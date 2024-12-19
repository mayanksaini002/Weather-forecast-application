const apiKey = '9428b90de634547456b50e5f9d3cecfd';
const baseApiUrl = 'https://api.openweathermap.org/data/2.5/';
const getWeatherButton = document.getElementById('getWeatherButton');
const locationInput = document.getElementById('locationInput');
const weatherContainer = document.getElementById('weatherContainer');
const locationHeading = document.getElementById('locationHeading');
const weatherProperties = document.getElementById('weatherProperties');
const forecastList = document.getElementById('forecastList');
const weatherIcon = document.getElementById('weatherIcon');
const errorContainer = document.getElementById('errorContainer');

getWeatherButton.addEventListener('click', async () => {
    const location = locationInput.value.trim();
    if (!location) {
        alert('Please enter a location.');
        return;
    }

    try {
        const weatherData = await fetchWeather(location);
        displayWeather(weatherData);
    } catch (error) {
        displayError(error.message);
    }
});

async function fetchWeather(location) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
        const response = await fetch(
            `${baseApiUrl}weather?q=${location}&units=metric&appid=${apiKey}`,
            { signal: controller.signal }
        );

        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error('Location not found. Please check the input.');
        }

        const data = await response.json();
        const forecastData = await fetchForecast(data.coord.lat, data.coord.lon);
        return { ...data, forecast: forecastData };
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please try again.');
        }
        throw new Error('Unable to fetch weather data. Please check your connection.');
    }
}

async function fetchForecast(lat, lon) {
    const response = await fetch(
        `${baseApiUrl}forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
    );
    const data = await response.json();
    return data.list.slice(0, 5); // Get next 5 days of forecast
}

function displayWeather(data) {
    const { name, sys, weather, main, wind, forecast } = data;
    locationHeading.textContent = `${name}, ${sys.country}`;
    weatherProperties.innerHTML = `
        <p id="temperature">Temperature: ${main.temp}°C</p>
        <p id="humidity">Humidity: ${main.humidity}%</p>
        <p id="windSpeed">Wind Speed: ${wind.speed} m/s</p>
    `;
    
    // Set the weather icon
    weatherIcon.src = `https://openweathermap.org/img/wn/${weather[0].icon}@2x.png`;
    weatherIcon.alt = weather[0].description;

    // Display the 5-day forecast
    forecastList.innerHTML = forecast.map(day => {
        const date = new Date(day.dt * 1000);
        return `
            <li class="bg-white p-6 rounded-lg shadow-lg text-center">
                <p class="text-lg font-semibold">${date.toLocaleDateString()}</p>
                <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" alt="${day.weather[0].description}" class="w-16 h-16 mx-auto" />
                <p>${day.weather[0].description}</p>
                <p>Temp: ${day.main.temp}°C</p>
            </li>
        `;
    }).join('');

    weatherContainer.classList.remove('hidden');
}

function displayError(message) {
    errorContainer.textContent = message;
    errorContainer.classList.remove('hidden');
    weatherContainer.classList.add('hidden');
}
