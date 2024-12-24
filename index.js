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
const weatherHistoryButton = document.getElementById('weatherHistoryButton');
const historyDropdown = document.getElementById('historyDropdown');
const historyList = document.getElementById('historyList');
const noHistory = document.getElementById('noHistory');


// Icon map for weather icons
const iconMap = {
    "01d": '<i class="fas fa-sun text-yellow-500 text-6xl"></i>',
    "01n": '<i class="fas fa-moon text-yellow-500 text-6xl"></i>',
    "02d": '<i class="fas fa-cloud-sun text-yellow-500 text-6xl"></i>',
    "02n": '<i class="fas fa-cloud-moon text-yellow-500 text-6xl"></i>',
    "03d": '<i class="fas fa-cloud text-gray-500 text-6xl"></i>',
    "03n": '<i class="fas fa-cloud text-gray-500 text-6xl"></i>',
    "04d": '<i class="fas fa-cloud-showers-heavy text-gray-500 text-6xl"></i>',
    "04n": '<i class="fas fa-cloud-showers-heavy text-gray-500 text-6xl"></i>',
    "09d": '<i class="fas fa-cloud-rain text-blue-500 text-6xl"></i>',
    "09n": '<i class="fas fa-cloud-rain text-blue-500 text-6xl"></i>',
    "10d": '<i class="fas fa-cloud-sun-rain text-blue-500 text-6xl"></i>',
    "10n": '<i class="fas fa-cloud-moon-rain text-blue-500 text-6xl"></i>',
    "11d": '<i class="fas fa-bolt text-yellow-500 text-6xl"></i>',
    "11n": '<i class="fas fa-bolt text-yellow-500 text-6xl"></i>',
    "13d": '<i class="fas fa-snowflake text-white text-6xl"></i>',
    "13n": '<i class="fas fa-snowflake text-white text-6xl"></i>',
    "50d": '<i class="fas fa-smog text-gray-500 text-6xl"></i>',
    "50n": '<i class="fas fa-smog text-gray-500 text-6xl"></i>'
};

let weatherHistory = JSON.parse(sessionStorage.getItem('weatherHistory')) || [];

// Toggle the Weather History dropdown visibility
weatherHistoryButton.addEventListener('click', () => {
    historyDropdown.classList.toggle('hidden');
    if (weatherHistory.length === 0) {
        noHistory.classList.remove('hidden');
        historyList.classList.add('hidden');
    } else {
        noHistory.classList.add('hidden');
        historyList.classList.remove('hidden');
        renderHistoryList();
    }
});

// Render History List
function renderHistoryList() {
    historyList.innerHTML = weatherHistory.map((entry, index) => {
        return `<li data-index="${index}" class="cursor-pointer py-2 px-4 border-b border-gray-300 text-sm hover:bg-gray-100">
            <strong>${entry.location}</strong>: ${entry.temperature}°C
        </li>`;
    }).join('');
}

// Add Click Event to History List Items
historyList.addEventListener('click', (event) => {
    const target = event.target.closest('li[data-index]');
    if (target) {
        const index = target.getAttribute('data-index');
        const selectedLocation = weatherHistory[index].location;

        // Update input box with selected location
        locationInput.value = selectedLocation;

        // Fetch and display weather details for the selected location
        getWeatherButton.click();
    }
});

// Handle Weather Fetch from Search Box
getWeatherButton.addEventListener('click', async () => {
    const location = locationInput.value.trim();
    if (!location) {
        alert('Please enter a location.');
        return;
    }

    try {
        const weatherData = await fetchWeather(location);
        displayWeather(weatherData);
        addToHistory(location, weatherData.main.temp);

        // Make history dropdown visible after first search
        weatherHistoryButton.classList.remove('hidden');
    } catch (error) {
        displayError(error.message);
    }
});

// Handle Current Location Button
getCurrentLocationButton.addEventListener('click', async () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const currentLocation = await getLocationByCoordinates(latitude, longitude);
                locationInput.value = currentLocation; // Set the input field with the city name
                getWeatherButton.click();
            } catch (error) {
                displayError('Unable to retrieve your location.');
            }
        });
    } else {
        displayError('Geolocation is not supported by this browser.');
    }
});

// Fetch Weather Data
async function fetchWeather(location) {
    const response = await fetch(
        `${baseApiUrl}weather?q=${location}&units=metric&appid=${apiKey}`
    );
    if (!response.ok) {
        throw new Error('Location not found. Please check the input.');
    }

    const data = await response.json();
    const forecastData = await fetchForecast(data.coord.lat, data.coord.lon);
    return { ...data, forecast: forecastData };
}

// Fetch Forecast Data
async function fetchForecast(lat, lon) {
    const response = await fetch(
        `${baseApiUrl}forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
    );
    const data = await response.json();
    return data.list.slice(0, 5); // Get next 5 forecasts
}

// Display Weather Data
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
        const date = new Date();
        date.setDate(date.getDate() + index + 1); // Get dates for the next 5 days
        const forecastIconCode = day.weather[0].icon;

        return `
            <li class="bg-gray-900 p-6 pt-4 rounded-lg shadow-lg text-center text-white h-[300px] w-[200px] border border-gray-700 flex flex-col justify-between transform transition-transform duration-300 hover:scale-110 hover:shadow-2xl">
                <p class="text-lg font-semibold text-gray-300">${date.toLocaleDateString()}</p>
                <div class="mt-4 text-center">${iconMap[forecastIconCode] || '<i class="fas fa-question-circle text-red-500 text-6xl"></i>'}</div>
                <p class="mt-6 text-xl font-serif font-bold text-yellow-200 card-description">${day.weather[0].description}</p>
                <p class="text-lg mt-5">Temp: ${day.main.temp}°C</p>
            </li>
        `;
    }).join('');

    weatherContainer.classList.remove('hidden');
}

// Handle Error
function displayError(message) {
    errorContainer.textContent = message;
    errorContainer.classList.remove('hidden');
    weatherContainer.classList.add('hidden');
}

// Add Search to History
function addToHistory(location, temperature) {
    weatherHistory = weatherHistory.filter(entry => entry.location !== location); // Avoid duplicates
    weatherHistory.unshift({ location, temperature });

    if (weatherHistory.length > 4) {
        weatherHistory.pop();
    }

    sessionStorage.setItem('weatherHistory', JSON.stringify(weatherHistory));
    renderHistoryList();
}

// Convert Coordinates to Location (City Name)
async function getLocationByCoordinates(lat, lon) {
    const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`
    );
    const data = await response.json();
    if (data && data.name) {
        return data.name; // Return city name
    } else {
        throw new Error('Unable to get location from coordinates.');
    }
}

// Initial Setup: Hide History Button if No History
if (weatherHistory.length === 0) {
    weatherHistoryButton.classList.add('hidden');
}
