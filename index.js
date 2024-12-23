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
const getCurrentLocationButton = document.getElementById('getCurrentLocationButton');

// Map weather condition codes to Font Awesome classes
const iconMap = {
    '01d': '<i class="fas fa-sun text-yellow-400 text-6xl"></i>', // Clear sky (day)
    '01n': '<i class="fas fa-moon text-blue-400 text-6xl"></i>', // Clear sky (night)
    '02d': '<i class="fas fa-cloud-sun text-yellow-400 text-6xl"></i>', // Few clouds (day)
    '02n': '<i class="fas fa-cloud-moon text-blue-400 text-6xl"></i>', // Few clouds (night)
    '03d': '<i class="fas fa-cloud text-gray-400 text-6xl"></i>', // Scattered clouds
    '03n': '<i class="fas fa-cloud text-gray-400 text-6xl"></i>', // Scattered clouds
    '04d': '<i class="fas fa-cloud text-gray-500 text-6xl"></i>', // Broken clouds
    '04n': '<i class="fas fa-cloud text-gray-500 text-6xl"></i>', // Broken clouds
    '09d': '<i class="fas fa-cloud-showers-heavy text-blue-500 text-6xl"></i>', // Shower rain
    '09n': '<i class="fas fa-cloud-showers-heavy text-blue-500 text-6xl"></i>', // Shower rain
    '10d': '<i class="fas fa-cloud-rain text-blue-400 text-6xl"></i>', // Rain (day)
    '10n': '<i class="fas fa-cloud-rain text-blue-400 text-6xl"></i>', // Rain (night)
    '11d': '<i class="fas fa-bolt text-yellow-500 text-6xl"></i>', // Thunderstorm
    '11n': '<i class="fas fa-bolt text-yellow-500 text-6xl"></i>', // Thunderstorm
    '13d': '<i class="fas fa-snowflake text-blue-300 text-6xl"></i>', // Snow
    '13n': '<i class="fas fa-snowflake text-blue-300 text-6xl"></i>', // Snow
    '50d': '<i class="fas fa-smog text-gray-400 text-6xl"></i>', // Mist
    '50n': '<i class="fas fa-smog text-gray-400 text-6xl"></i>', // Mist
};

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

getCurrentLocationButton.addEventListener('click', async () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const currentLocation = await getLocationByCoordinates(latitude, longitude);
                locationInput.value = currentLocation;
            } catch (error) {
                displayError('Unable to retrieve your location.');
            }
        });
    } else {
        displayError('Geolocation is not supported by this browser.');
    }
});

async function getLocationByCoordinates(lat, lon) {
    const response = await fetch(
        `${baseApiUrl}weather?lat=${lat}&lon=${lon}&appid=${apiKey}`
    );
    const data = await response.json();
    return data.name;
}

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
        <p id="humidity">Humidity: ${main.humidity}%</p>
        <p id="windSpeed">Wind Speed: ${wind.speed} m/s</p>
        <p id="temperature">Temperature: ${main.temp}°C</p>
    `;

    const iconCode = weather[0].icon;
    weatherIcon.innerHTML = iconMap[iconCode] || '<i class="fas fa-question-circle text-red-500 text-6xl"></i>';

    forecastList.innerHTML = forecast.map((day, index) => {
        const forecastDate = new Date();
        forecastDate.setDate(forecastDate.getDate() + index + 1); // Calculate date for next days
        const formattedDate = forecastDate.toLocaleDateString(); // Format the date

        const forecastIconCode = day.weather[0].icon;
        return `
            <li class="bg-white p-10 pt-5 rounded-lg shadow-lg text-center h-[300px]">
                <p class="text-lg font-semibold">${formattedDate}</p>
                <div class="mt-4 text-center">${iconMap[forecastIconCode] || '<i class="fas fa-question-circle text-red-500 text-6xl"></i>'}</div>
                <p class="mt-6 text-xl font-serif font-bold text-gray-800" style="text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.6);">${day.weather[0].description}</p>
                <p class="text-lg mt-5">Temp: ${day.main.temp}°C</p>
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
