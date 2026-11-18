/* ==========================================================
   SKYCAST WEATHER JAVASCRIPT — Mahmudul Haq Rupom
   Open-Meteo API is used; no API key is required.
   1. State/helpers 2. API calls 3. Render views
   4. Search/location 5. Units 6. Initialization
   ========================================================== */
/* 1. Cache UI elements and keep application state */
const $ = s => document.querySelector(s); let weatherData = null, selectedPlace = null, isFahrenheit = false;


/* 2. Translate Open-Meteo weather codes into labels and icons */
function weatherInfo(code, day = 1) { if (code === 0) return { label: 'Clear sky', icon: day ? 'fa-sun' : 'fa-moon' }; if ([1, 2].includes(code)) return { label: 'Mainly clear', icon: day ? 'fa-cloud-sun' : 'fa-cloud-moon' }; if (code === 3) return { label: 'Overcast', icon: 'fa-cloud' }; if ([45, 48].includes(code)) return { label: 'Foggy', icon: 'fa-smog' }; if ([51, 53, 55, 56, 57].includes(code)) return { label: 'Drizzle', icon: 'fa-cloud-rain' }; if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: 'Rain', icon: 'fa-cloud-showers-heavy' }; if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: 'Snow', icon: 'fa-snowflake' }; if ([95, 96, 99].includes(code)) return { label: 'Thunderstorm', icon: 'fa-cloud-bolt' }; return { label: 'Variable conditions', icon: 'fa-cloud-sun' } }


/* 3. Format temperature for Celsius or Fahrenheit */
function convertTemp(c) { return isFahrenheit ? c * 9 / 5 + 32 : c } function formatTemp(value, unit = true) { if (value == null || Number.isNaN(Number(value))) return '--'; const n = Math.round(convertTemp(Number(value))); return unit ? `${n}°${isFahrenheit ? 'F' : 'C'}` : n }
function status(message = '') { const el = $('#statusMessage'); el.textContent = message; }



/* 4. Search city coordinates with Open-Meteo Geocoding API */
async function findCity(city) { const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`; const response = await fetch(url); if (!response.ok) throw Error('City search is temporarily unavailable.'); const data = await response.json(); if (!data.results?.length) throw Error('City not found. Please check the spelling.'); return data.results[0] }


/* 5. Fetch live, hourly and five-day forecast data */
async function fetchWeather(place) { const params = new URLSearchParams({ latitude: place.latitude, longitude: place.longitude, current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m', hourly: 'temperature_2m,precipitation_probability,weather_code', daily: 'weather_code,temperature_2m_max,temperature_2m_min,uv_index_max', forecast_days: '5', timezone: 'auto' }); const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`); if (!response.ok) throw Error('Weather service is unavailable. Please try again.'); return response.json() }



/* 6. Render current weather and overview metrics */
function renderCurrent(data, place) { const c = data.current, d = data.daily, info = weatherInfo(c.weather_code, c.is_day); $('#cityName').textContent = [place.name, place.admin1, place.country].filter((v, i, a) => v && a.indexOf(v) === i).join(', '); $('#currentDate').textContent = new Date(c.time).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }); $('#currentIcon').innerHTML = `<i class="fa-solid ${info.icon}"></i>`; $('#temperature').textContent = formatTemp(c.temperature_2m, false); $('#degree').textContent = `°${isFahrenheit ? 'F' : 'C'}`; $('#condition').textContent = info.label; $('#highTemp').textContent = formatTemp(d.temperature_2m_max[0]); $('#lowTemp').textContent = formatTemp(d.temperature_2m_min[0]); $('#humidity').textContent = `${c.relative_humidity_2m}%`; $('#wind').textContent = `${Math.round(c.wind_speed_10m)} km/h`; $('#uv').textContent = Number(d.uv_index_max[0]).toFixed(1); $('#feelsLike').textContent = formatTemp(c.apparent_temperature); $('#localTime').textContent = new Date(c.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); $('#coordinates').textContent = `${Number(place.latitude).toFixed(2)}°, ${Number(place.longitude).toFixed(2)}°` }



/* 7. Render next 12 hours, showing every second hour */
function renderHourly(data) { const box = $('#hourlyList'); box.replaceChildren(); const now = new Date(data.current.time).getTime(); let start = data.hourly.time.findIndex(t => new Date(t).getTime() >= now); start = Math.max(0, start); for (let i = start; i < Math.min(start + 12, data.hourly.time.length); i += 2) { const date = new Date(data.hourly.time[i]), info = weatherInfo(data.hourly.weather_code[i]); const card = document.createElement('article'); card.className = 'hour-card'; card.innerHTML = `<span class="hour">${date.toLocaleTimeString([], { hour: 'numeric' })}</span><i class="fa-solid ${info.icon}"></i><strong>${formatTemp(data.hourly.temperature_2m[i])}</strong><small><i class="fa-solid fa-droplet"></i> ${data.hourly.precipitation_probability[i] ?? 0}% rain</small>`; box.append(card) } }



/* 8. Render five daily high/low forecast cards */
function renderDaily(data) { const box = $('#dailyList'); box.replaceChildren(); data.daily.time.forEach((value, i) => { const date = new Date(`${value}T12:00:00`), info = weatherInfo(data.daily.weather_code[i]); const card = document.createElement('article'); card.className = 'day-card'; card.innerHTML = `<span class="day-name">${i === 0 ? 'Today' : date.toLocaleDateString(undefined, { weekday: 'short' })}</span><i class="fa-solid ${info.icon}"></i><span class="day-temps"><span>${formatTemp(data.daily.temperature_2m_max[i], false)}°</span><span>${formatTemp(data.daily.temperature_2m_min[i], false)}°</span></span>`; box.append(card) }) }



/* 9. Load all weather sections for the selected city */
async function loadPlace(place) { status('Loading live weather data...'); try { const data = await fetchWeather(place); weatherData = data; selectedPlace = place; renderCurrent(data, place); renderHourly(data); renderDaily(data); status('') } catch (error) { status(error.message || 'Could not load weather data.') } }



/* 10. Handle city search form */
$('#searchForm').addEventListener('submit', async event => { event.preventDefault(); const city = $('#cityInput').value.trim(); if (!city) { status('Please enter a city name.'); return } status('Searching for city...'); try { await loadPlace(await findCity(city)) } catch (error) { status(error.message) } });



/* 11. Ask permission before using browser geolocation */
$('#locationBtn').addEventListener('click', () => { if (!navigator.geolocation) { status('Geolocation is not supported. Search for a city instead.'); return } status('Waiting for location permission...'); navigator.geolocation.getCurrentPosition(async p => loadPlace({ name: 'Your location', latitude: p.coords.latitude, longitude: p.coords.longitude }), () => status('Location permission was not granted. Search for a city instead.'), { timeout: 10000 }) });



/* 12. Switch units without making another API request */
$('#unitToggle').addEventListener('click', () => { if (!weatherData) return; isFahrenheit = !isFahrenheit; $('#unitToggle').innerHTML = isFahrenheit ? '°F <span>/ °C</span>' : '°C <span>/ °F</span>'; renderCurrent(weatherData, selectedPlace); renderHourly(weatherData); renderDaily(weatherData) });



/* 13. Start with Dhaka and print the current year */
async function init() { $('#year').textContent = new Date().getFullYear(); try { await loadPlace(await findCity('Dhaka')) } catch (error) { status(error.message) } } init();
