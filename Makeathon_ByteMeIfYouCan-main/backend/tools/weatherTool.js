function seasonRiskForMonth(month, trail) {
  if (trail.bestMonths.includes(month)) {
    return {
      level: "good",
      summary: "The season is generally suitable for this route.",
    };
  }

  if ([7, 8].includes(month)) {
    return {
      level: "caution",
      summary: "Summer heat can make exposed sections harder. Start early and carry extra water.",
    };
  }

  if ([12, 1, 2].includes(month)) {
    return {
      level: "caution",
      summary: "Winter conditions may bring snow, mud, short daylight, or closed mountain sections.",
    };
  }

  return {
    level: "watch",
    summary: "Conditions can vary in shoulder season. Check local guidance before departing.",
  };
}

async function fetchOpenWeather(trail) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey || apiKey === "PASTE_YOUR_OPENWEATHER_KEY_HERE") return null;

  const { lat, lon } = trail.coordinates;
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || `OpenWeather failed with status ${response.status}`);
  }

  return {
    source: "openweather",
    temperatureC: Math.round(data.main.temp),
    windKph: Math.round((data.wind?.speed || 0) * 3.6),
    precipitationMm: null,
    description: data.weather?.[0]?.description || "current weather unavailable",
    risk:
      data.wind?.speed > 11 || data.main.temp > 32
        ? "caution"
        : data.weather?.[0]?.main === "Thunderstorm"
          ? "unsafe"
          : "good",
  };
}

async function fetchOpenMeteo(trail) {
  const { lat, lon } = trail.coordinates;
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: "temperature_2m,precipitation,weather_code,wind_speed_10m",
    timezone: "auto",
  });
  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  const response = await fetch(url);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.reason || `Open-Meteo failed with status ${response.status}`);
  }

  const current = data.current || {};
  const weatherCode = Number(current.weather_code);
  const precipitationMm = Number(current.precipitation || 0);
  const windKph = Math.round(Number(current.wind_speed_10m || 0));
  const temperatureC = Math.round(Number(current.temperature_2m));

  return {
    source: "open-meteo",
    temperatureC,
    windKph,
    precipitationMm,
    description: describeOpenMeteoCode(weatherCode),
    risk:
      precipitationMm >= 8 || [95, 96, 99].includes(weatherCode)
        ? "unsafe"
        : windKph > 40 || temperatureC > 32 || precipitationMm >= 2
          ? "caution"
          : "good",
  };
}

function describeOpenMeteoCode(code) {
  if (code === 0) return "clear sky";
  if ([1, 2, 3].includes(code)) return "partly cloudy";
  if ([45, 48].includes(code)) return "fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "drizzle";
  if ([61, 63, 65, 66, 67].includes(code)) return "rain";
  if ([71, 73, 75, 77].includes(code)) return "snow";
  if ([80, 81, 82].includes(code)) return "rain showers";
  if ([95, 96, 99].includes(code)) return "thunderstorm";
  return "current weather";
}

async function getWeatherContext(trail, date = new Date()) {
  const seasonal = seasonRiskForMonth(date.getMonth() + 1, trail);

  try {
    let current = null;
    let providerWarning;

    try {
      current = await fetchOpenWeather(trail);
    } catch (error) {
      providerWarning = `OpenWeather failed: ${error.message}`;
    }

    if (!current) {
      current = await fetchOpenMeteo(trail);
    }

    if (!current) {
      return {
        source: "seasonal-fallback",
        seasonal,
        current: null,
        summary: seasonal.summary,
      };
    }

    return {
      source: current.source,
      seasonal,
      current,
      providerWarning,
      summary: `${current.description}, ${current.temperatureC}C, wind ${current.windKph} km/h${
        current.precipitationMm !== null ? `, precipitation ${current.precipitationMm} mm` : ""
      }. ${seasonal.summary}`,
    };
  } catch (error) {
    return {
      source: "seasonal-fallback",
      seasonal,
      current: null,
      summary: `${seasonal.summary} Live weather failed: ${error.message}`,
    };
  }
}

module.exports = { getWeatherContext };
