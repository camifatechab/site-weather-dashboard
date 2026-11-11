const siteSelect = document.getElementById("siteSelect");
const limitInput = document.getElementById("limitInput");
const statusText = document.getElementById("status");

let weather = null; // the latest data from the API
let chart = null;   // the chart currently on screen
let limit = 30;     // the last valid wind limit

// 1. GET: build the URL from the chosen site, then fetch
async function loadWeather() {
  const [lat, lon] = siteSelect.value.split(",");
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&hourly=temperature_2m,precipitation_probability,wind_speed_10m` +
    `&timezone=Asia%2FTaipei&forecast_days=2`;

  statusText.textContent = "Loading…";
  statusText.className = "";

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) throw new Error(data.reason || "HTTP " + response.status);

    weather = data;
    console.log(weather.hourly);
    statusText.textContent = "Updated at " + new Date().toLocaleTimeString();
    render();
  } catch (error) {
    statusText.textContent = "Couldn't load weather data: " + error.message;
    statusText.className = "error";
  }
}

// 2. PROCESS + 3. RENDER
function render() {
  const hourly = weather.hourly;

  // If the box is empty, keep using the last valid limit
  if (limitInput.value !== "") limit = Number(limitInput.value);

  // Process: turn raw lists into labels and summary numbers
  const labels = hourly.time.map(t => t.slice(5).replace("T", " "));
  const maxWind = Math.max(...hourly.wind_speed_10m);
  const windHours = hourly.wind_speed_10m.filter(w => w > limit).length;
  const rainHours = hourly.precipitation_probability.filter(p => p >= 50).length;

  // Render the summary cards
  document.getElementById("maxWind").textContent = maxWind + " km/h";
  document.getElementById("windHours").textContent = windHours + " h";
  document.getElementById("rainHours").textContent = rainHours + " h";

  // Render the chart (remove the old one first)
  if (chart) chart.destroy();
  chart = new Chart(document.getElementById("weatherChart"), {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        { label: "Wind speed (km/h)", data: hourly.wind_speed_10m },
        { label: "Temperature (°C)", data: hourly.temperature_2m },
        {
          label: "Wind limit (km/h)",
          data: labels.map(() => limit),
          borderDash: [6, 6],
          pointRadius: 0
        }
      ]
    },
    options: {
      maintainAspectRatio: false, // fill the 360px-tall .chart-box instead of staying 2:1
      scales: {
        x: { title: { display: true, text: "Date and time (Taiwan)" } },
        y: { title: { display: true, text: "km/h  ·  °C" }, beginAtZero: true }
      }
    }
  });
}

// 4. INTERACTION
siteSelect.addEventListener("change", loadWeather);                  // new site → new API request
limitInput.addEventListener("input", () => { if (weather) render(); }); // new limit → redraw only

loadWeather();