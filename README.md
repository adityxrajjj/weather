# Weather 

A simple and responsive weather web application that allows users to search for weather information based on a city or location. The app uses an API to retrieve weather data and displays it in a user-friendly interface.

## Features

- **Search Functionality**: Users can input a city name or location to retrieve weather information.
- **Dynamic Weather Display**: Displays the weather details such as temperature, humidity, and weather conditions.
- **Loading Spinner**: Visual indicator while weather data is being fetched.
- **Responsive Design**: Optimized for both desktop and mobile devices.
- **Weather Icons**: Displays weather conditions using icons from Font Awesome.

## Installation

### 1. Clone the repository

Clone this repository to your local machine:

```bash
git clone https://github.com/adityxrajj/weather.git
```

### 2. File Structure

The project consists of the following files:

```
/weather-web-app
│
├── index.html         # Main HTML file
├── style.css          # CSS styles for the app
├── script.js          # JavaScript for fetching and displaying weather data
├── weatherIcons.js    # Script to manage weather icons
└── README.md          # Project documentation
```

### 3. Dependencies

This project uses Font Awesome for the search icon and custom scripts to handle weather data:

- Font Awesome (CDN)
- JavaScript (local `script.js` and `weatherIcons.js`)

### 4. Open the Project

To view the app, open the `index.html` file in your browser.

## How It Works

1. **Search for a City**: Users enter a city name or location in the search input field.
2. **Weather Data Fetch**: When the search button is clicked, the app fetches weather data from an external weather API (assumed to be integrated in `script.js`).
3. **Display Weather**: Upon receiving the data, the app displays relevant weather information such as temperature, weather conditions, and humidity.
4. **Loading Spinner**: A loading spinner appears while the weather data is being fetched.

## Customization

### Modify the Weather API

In the `script.js` file, you can replace the current weather API URL with your own or adjust the parameters as needed to fetch additional or different types of weather data.

```javascript
const apiKey = 'YOUR_API_KEY';
const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
```

### Modify the CSS

You can customize the styles in `style.css` to adjust the look and feel of the app, such as colors, fonts, and layout.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
