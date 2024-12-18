const WeatherIcons = {
    iconMap: {
        // Clear Sky
        '01d': 'icons/clear-day.png',
        '01n': 'icons/clear-night.png',

        // Few Clouds
        '02d': 'icons/few-clouds-day.png',
        '02n': 'icons/few-clouds-night.png',

        // Scattered Clouds
        '03d': 'icons/scattered-clouds-day.png',
        '03n': 'icons/scattered-clouds-night.png',

        // Broken Clouds
        '04d': 'icons/broken-clouds-day.png',
        '04n': 'icons/broken-clouds-night.png',

        // Shower Rain
        '09d': 'icons/shower-rain-day.png',
        '09n': 'icons/shower-rain-night.png',

        // Rain
        '10d': 'icons/rain-day.png',
        '10n': 'icons/rain-night.png',

        // Thunderstorm
        '11d': 'icons/thunderstorm-day.png',
        '11n': 'icons/thunderstorm-night.png',

        // Snow
        '13d': 'icons/snow-day.png',
        '13n': 'icons/snow-night.png',

        // Mist
        '50d': 'icons/mist-day.png',
        '50n': 'icons/mist-night.png',
    },

    getWeatherIcon(iconCode) {
        if (!this.iconMap[iconCode]) {
            console.warn(`Missing icon for code: ${iconCode}`);
        }
        return this.iconMap[iconCode] || 'icons/default.png';
    }
};