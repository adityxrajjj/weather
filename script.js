// Constants and configuration
const CONFIG = {
    API: {
        KEY: "c15e91a2307e37708e6910af17c66e43",
        BASE_URL: "https://api.openweathermap.org/data/2.5/",
        GEO_URL: "https://api.openweathermap.org/geo/1.0/",
        UNITS: "metric",
    },
    CACHE: {
        DURATION: 300000, // 5 minutes in milliseconds
        KEY: "weatherData",
    },
    UI: {
        FORECAST_LIMIT: 5,
        DEBOUNCE_DELAY: 300,
        ERROR_DURATION: 5000, // Show errors for 5 seconds
    },
};

// Cache management
class WeatherCache {
    static set(key, data) {
        const cacheItem = {
            timestamp: Date.now(),
            data: data,
        };
        localStorage.setItem(key, JSON.stringify(cacheItem));
    }

    static get(key) {
        const cached = localStorage.getItem(key);
        if (!cached) return null;

        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp > CONFIG.CACHE.DURATION) {
            localStorage.removeItem(key);
            return null;
        }
        return data;
    }
}

// Weather service class
class WeatherService {
    static async fetchData(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(response.status === 404 ? "Location not found." : "Failed to fetch weather data.");
        }
        return response.json();
    }

    static constructUrl(type, query) {
        const { BASE_URL, KEY, UNITS } = CONFIG.API;
        const params = `&appid=${KEY}&units=${UNITS}`;

        return type === "city" ? `${BASE_URL}weather?q=${query}${params}` : `${BASE_URL}weather?lat=${query.lat}&lon=${query.lon}${params}`;
    }

    static async getLocationDetails(lat, lon) {
        const { GEO_URL, KEY } = CONFIG.API;
        const url = `${GEO_URL}reverse?lat=${lat}&lon=${lon}&limit=1&appid=${KEY}`;
        try {
            const data = await this.fetchData(url);
            return data[0] || null;
        } catch (error) {
            console.error("Reverse geocoding failed:", error);
            return null;
        }
    }

    static async getWeatherData(query) {
        const cacheKey = typeof query === "string" ? query : `${query.lat},${query.lon}`;
        const cachedData = WeatherCache.get(cacheKey);

        if (cachedData) {
            return cachedData;
        }

        const urls = {
            current: this.constructUrl(typeof query === "string" ? "city" : "coordinates", query),
            forecast:
                typeof query === "string"
                    ? `${CONFIG.API.BASE_URL}forecast?q=${query}&appid=${CONFIG.API.KEY}&units=${CONFIG.API.UNITS}`
                    : `${CONFIG.API.BASE_URL}forecast?lat=${query.lat}&lon=${query.lon}&appid=${CONFIG.API.KEY}&units=${CONFIG.API.UNITS}`,
        };

        const [currentWeather, forecastWeather] = await Promise.all([this.fetchData(urls.current), this.fetchData(urls.forecast)]);

        if (typeof query !== "string") {
            const locationDetails = await this.getLocationDetails(query.lat, query.lon);
            if (locationDetails) {
                currentWeather.name = locationDetails.name;
                currentWeather.sys.country = locationDetails.country;
            }
        }

        const weatherData = { current: currentWeather, forecast: forecastWeather };
        WeatherCache.set(cacheKey, weatherData);
        return weatherData;
    }
}

// UI Manager class
class WeatherUI {
    constructor() {
        this.elements = {
            cityInput: document.getElementById("cityInput"),
            searchBtn: document.getElementById("searchBtn"),
            weatherDisplay: document.getElementById("weatherDisplay"),
        };
        this.bindEvents();
    }

    bindEvents() {
        this.elements.searchBtn.addEventListener("click", () => this.handleSearch());
        this.elements.cityInput.addEventListener(
            "keypress",
            this.debounce((e) => e.key === "Enter" && this.handleSearch(), CONFIG.UI.DEBOUNCE_DELAY)
        );
        document.addEventListener("DOMContentLoaded", () => this.initializeWeather());
    }

    showLoading() {
        this.elements.weatherDisplay.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Fetching weather data...</p>
            </div>
        `;
    }

    showError(message, duration = CONFIG.UI.ERROR_DURATION) {
        const errorDiv = document.createElement("div");
        errorDiv.className = "error-message";
        errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;

        this.elements.weatherDisplay.innerHTML = "";
        this.elements.weatherDisplay.appendChild(errorDiv);

        setTimeout(() => {
            if (errorDiv.parentNode === this.elements.weatherDisplay) {
                errorDiv.remove();
            }
        }, duration);
    }

    formatDate(timestamp) {
        return new Date(timestamp * 1000).toLocaleDateString("en-US", {
            weekday: "short",
            day: "2-digit",
            month: "short",
        });
    }

    getWindDirection(degrees) {
        const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
        return directions[Math.round(degrees / 22.5) % 16];
    }

    async handleSearch() {
        const city = this.elements.cityInput.value.trim();
        if (city) {
            this.showLoading();
            try {
                const weatherData = await WeatherService.getWeatherData(city);
                this.updateDisplay(weatherData);
            } catch (error) {
                this.showError(error.message);
            }
        }
    }

    async initializeWeather() {
        if (!("geolocation" in navigator)) {
            this.showError("Geolocation not supported by your browser.");
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
        };

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, options);
            });

            const { latitude, longitude } = position.coords;
            const weatherData = await WeatherService.getWeatherData({ lat: latitude, lon: longitude });
            this.updateDisplay(weatherData);
        } catch (error) {
            let message = "Unable to fetch local weather.";
            if (error.code) {
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message = "Location access denied. Please enable location services.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = "Location information unavailable. Please try again.";
                        break;
                    case error.TIMEOUT:
                        message = "Location request timed out. Please try again.";
                        break;
                }
            }
            this.showError(message);
        }
    }

    updateDisplay(data) {
        const currentWeather = this.renderCurrentWeather(data.current);
        const forecastPreview = this.renderForecastPreview(data.forecast);
        this.elements.weatherDisplay.innerHTML = currentWeather + forecastPreview;
    }

    renderCurrentWeather(current) {
        const iconUrl = WeatherIcons.getWeatherIcon(current.weather[0].icon);
        return `
            <div class="location-header">
                <h2 class="location-name">
                    <i class="fas fa-map-marker-alt"></i> ${current.name}, ${current.sys.country}
                </h2>
                <span>${this.formatDate(Date.now() / 1000)}</span>
            </div>
            <div class="weather-main">
                <p class="temperature">${Math.round(current.main.temp)}°C</p>
                <img src="${iconUrl}" alt="${current.weather[0].description}" class="weather-icon">
                <p>${current.weather[0].description}</p>
            </div>
            <div class="weather-details">
                ${this.createDetailCard("fas fa-tint", `${current.main.humidity}%`, "Humidity")}
                ${this.createDetailCard("fas fa-wind", `${Math.round(current.wind.speed)} m/s`, this.getWindDirection(current.wind.deg))}
                ${this.createDetailCard("fas fa-compress-arrows-alt", `${current.main.pressure} hPa`, "Pressure")}
            </div>
        `;
    }

    renderForecastPreview(forecast) {
        const uniqueDays = new Map();
        const filteredForecast = forecast.list
            .filter((item) => {
                const day = new Date(item.dt * 1000).toLocaleDateString();
                if (!uniqueDays.has(day)) {
                    uniqueDays.set(day, true);
                    return true;
                }
                return false;
            })
            .slice(0, CONFIG.UI.FORECAST_LIMIT);

        return `
            <div class="forecast-preview">
                ${filteredForecast
                    .map(
                        (item) => `
                    <div class="forecast-day">
                        <div>${this.formatDate(item.dt)}</div>
                        <img src="${WeatherIcons.getWeatherIcon(item.weather[0].icon)}" 
                             alt="${item.weather[0].description}" width="35">
                        <div>${Math.round(item.main.temp)}°C</div>
                    </div>
                `
                    )
                    .join("")}
            </div>
        `;
    }

    createDetailCard(icon, value, label) {
        return `
            <div class="detail-card">
                <i class="${icon} detail-icon"></i>
                <div>${value}</div>
                <small>${label}</small>
            </div>
        `;
    }

    debounce(func, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), delay);
        };
    }
}

// Initialize the application
const weatherApp = new WeatherUI();
