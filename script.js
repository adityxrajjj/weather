const API_KEY = 'c15e91a2307e37708e6910af17c66e43';
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const weatherDisplay = document.getElementById('weatherDisplay');
const FORECAST_LIMIT = 5;

// Utility to construct API URLs dynamically
function constructWeatherUrl(type, query) {
    const baseUrl = 'https://api.openweathermap.org/data/2.5/';
    const params = `&appid=${API_KEY}&units=metric`;
    return type === 'city'
        ? `${baseUrl}weather?q=${query}${params}`
        : `${baseUrl}weather?lat=${query.lat}&lon=${query.lon}${params}`;
}

// Format date in desired format: "Day, DD Month"
function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
    });
}

// Get wind direction from degrees
function getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return directions[Math.round(degrees / 22.5) % 16];
}

// Handle errors and display a message to the user
function handleError(message) {
    console.error(message);
    weatherDisplay.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i> ${message}
        </div>
    `;
}

// Fetch weather data from API
async function fetchWeatherData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            if (response.status === 404) throw new Error('City not found.');
            throw new Error('Failed to fetch weather data.');
        }
        return response.json();
    } catch (error) {
        handleError(error.message);
        throw error;
    }
}

// Fetch both current weather and forecast data
async function fetchWeather(city) {
    const currentUrl = constructWeatherUrl('city', city);
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`;

    const [currentWeather, forecastWeather] = await Promise.all([
        fetchWeatherData(currentUrl),
        fetchWeatherData(forecastUrl)
    ]);

    return { current: currentWeather, forecast: forecastWeather };
}

// Fetch weather for local coordinates
async function fetchWeatherByCoordinates(lat, lon) {
    const currentUrl = constructWeatherUrl('coordinates', { lat, lon });
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

    const [currentWeather, forecastWeather] = await Promise.all([
        fetchWeatherData(currentUrl),
        fetchWeatherData(forecastUrl)
    ]);

    return { current: currentWeather, forecast: forecastWeather };
}

// Display current weather details
function createWeatherDetailCard(icon, value, label) {
    return `
        <div class="detail-card">
            <i class="${icon} detail-icon"></i>
            <div>${value}</div>
            <small>${label}</small>
        </div>
    `;
}

function displayCurrentWeather(data) {
    const iconUrl = WeatherIcons.getWeatherIcon(data.current.weather[0].icon);
    return `
        <div class="location-header">
            <h2 class="location-name">
                <i class="fas fa-map-marker-alt"></i> ${data.current.name}, ${data.current.sys.country}
            </h2>
            <span>${formatDate(Date.now() / 1000)}</span>
        </div>
        <div class="weather-main">
            <p class="temperature">${Math.round(data.current.main.temp)}°C</p>
            <img src="${iconUrl}" alt="${data.current.weather[0].description}" class="weather-icon">
            <p>${data.current.weather[0].description}</p>
        </div>
        <div class="weather-details">
            ${createWeatherDetailCard('fas fa-tint', `${data.current.main.humidity}%`, 'Humidity')}
            ${createWeatherDetailCard('fas fa-wind', `${Math.round(data.current.wind.speed)} m/s`, getWindDirection(data.current.wind.deg))}
            ${createWeatherDetailCard('fas fa-compress-arrows-alt', `${data.current.main.pressure} hPa`, 'Pressure')}
        </div>
    `;
}

// Display forecast preview
function displayForecastPreview(data) {
    const uniqueDays = {};
    const filteredForecast = data.forecast.list.filter(forecast => {
        const day = new Date(forecast.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' });
        if (!uniqueDays[day]) {
            uniqueDays[day] = true;
            return true;
        }
        return false;
    }).slice(0, FORECAST_LIMIT);

    return `
        <div class="forecast-preview">
            ${filteredForecast.map(forecast => `
                <div class="forecast-day">
                    <div>${formatDate(forecast.dt)}</div>
                    <img src="${WeatherIcons.getWeatherIcon(forecast.weather[0].icon)}" alt="${forecast.weather[0].description}" width="35">
                    <div>${Math.round(forecast.main.temp)}°C</div>
                </div>
            `).join('')}
        </div>
    `;
}

// Update weather data and display
async function updateWeather(location) {
    weatherDisplay.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Fetching weather data...</p>
        </div>
    `;
    try {
        const weatherData = typeof location === 'object'
            ? await fetchWeatherByCoordinates(location.latitude, location.longitude)
            : await fetchWeather(location);

        weatherDisplay.innerHTML = displayCurrentWeather(weatherData) + displayForecastPreview(weatherData);
    } catch (error) {
        console.error(error);
        handleError("Unable to retrieve weather data. Please try again.");
    }
}

// Fetch and display weather for the user's current location
async function fetchLocalWeather() {
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            async position => {
                const { latitude, longitude } = position.coords;
                await updateWeather({ latitude, longitude });
            },
            () => handleError("Location access denied. Unable to fetch local weather.")
        );
    } else {
        handleError("Geolocation not supported by your browser.");
    }
}

// Initialize weather with geolocation
async function initializeWeather() {
    await fetchLocalWeather();
}

// Add event listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) updateWeather(city);
});

cityInput.addEventListener('keypress', debounce(e => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) updateWeather(city);
    }
}, 300));

document.addEventListener('DOMContentLoaded', initializeWeather);

// Debounce function for better performance
function debounce(func, delay) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
}
