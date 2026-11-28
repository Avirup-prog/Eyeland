// Live Weather Service powered by Open-Meteo (Zero API key required, Global coverage)

const WEATHER_CODE_MAP = {
  0: { label: 'Clear Sky', iconDay: '☀️', iconNight: '🌙', type: 'clear' },
  1: { label: 'Mainly Clear', iconDay: '🌤️', iconNight: '🌤️', type: 'mainly_clear' },
  2: { label: 'Partly Cloudy', iconDay: '⛅', iconNight: '☁️', type: 'partly_cloudy' },
  3: { label: 'Overcast', iconDay: '☁️', iconNight: '☁️', type: 'overcast' },
  45: { label: 'Foggy', iconDay: '🌫️', iconNight: '🌫️', type: 'fog' },
  48: { label: 'Rime Fog', iconDay: '🌫️', iconNight: '🌫️', type: 'fog' },
  51: { label: 'Light Drizzle', iconDay: '🌦️', iconNight: '🌧️', type: 'drizzle' },
  53: { label: 'Drizzle', iconDay: '🌦️', iconNight: '🌧️', type: 'drizzle' },
  55: { label: 'Heavy Drizzle', iconDay: '🌧️', iconNight: '🌧️', type: 'drizzle' },
  61: { label: 'Slight Rain', iconDay: '🌦️', iconNight: '🌧️', type: 'rain' },
  63: { label: 'Moderate Rain', iconDay: '🌧️', iconNight: '🌧️', type: 'rain' },
  65: { label: 'Heavy Rain', iconDay: '🌧️', iconNight: '🌧️', type: 'heavy_rain' },
  71: { label: 'Light Snow', iconDay: '🌨️', iconNight: '🌨️', type: 'snow' },
  73: { label: 'Moderate Snow', iconDay: '❄️', iconNight: '❄️', type: 'snow' },
  75: { label: 'Heavy Snow', iconDay: '❄️', iconNight: '❄️', type: 'heavy_snow' },
  77: { label: 'Snow Grains', iconDay: '❄️', iconNight: '❄️', type: 'snow' },
  80: { label: 'Rain Showers', iconDay: '🌦️', iconNight: '🌧️', type: 'showers' },
  81: { label: 'Heavy Showers', iconDay: '🌧️', iconNight: '🌧️', type: 'showers' },
  82: { label: 'Violent Showers', iconDay: '⛈️', iconNight: '⛈️', type: 'storm' },
  85: { label: 'Snow Showers', iconDay: '🌨️', iconNight: '🌨️', type: 'snow' },
  86: { label: 'Heavy Snow Showers', iconDay: '❄️', iconNight: '❄️', type: 'snow' },
  95: { label: 'Thunderstorm', iconDay: '⛈️', iconNight: '⛈️', type: 'storm' },
  96: { label: 'Thunderstorm & Hail', iconDay: '⛈️', iconNight: '⛈️', type: 'storm' },
  99: { label: 'Severe Thunderstorm', iconDay: '⛈️', iconNight: '⛈️', type: 'storm' },
};

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes cache to preserve battery & data
const memoryCache = new Map();

/**
 * Resolve city coordinates via Open-Meteo Geocoding
 */
export async function geocodeCity(cityName) {
  if (!cityName || !cityName.trim()) return null;
  const clean = cityName.trim();
  const cacheKey = `geo_${clean.toLowerCase()}`;
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey);
  }

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(clean)}&count=1&language=en&format=json`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Eyeland-Dynamic-Island/1.0' } });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const match = data.results[0];
      const result = {
        name: match.name,
        country: match.country || '',
        admin: match.admin1 || '',
        latitude: match.latitude,
        longitude: match.longitude,
      };
      memoryCache.set(cacheKey, result);
      return result;
    }
  } catch (err) {
    console.warn('[weatherService] Geocoding error:', err.message);
  }
  return null;
}

/**
 * Auto-detect user's current city & coordinates via IP / Timezone fallback
 */
export async function autoDetectLocation() {
  const cacheKey = 'auto_location';
  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 60 * 60 * 1000) {
    return cached.data;
  }

  // 1. Try ip-api.com
  try {
    const res = await fetch('http://ip-api.com/json/?fields=status,country,city,lat,lon', {
      signal: AbortSignal.timeout(3500),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success' && data.city) {
        const result = {
          name: data.city,
          country: data.country || '',
          latitude: data.lat,
          longitude: data.lon,
        };
        memoryCache.set(cacheKey, { data: result, timestamp: Date.now() });
        return result;
      }
    }
  } catch (_) {}

  // 2. Fallback to Timezone estimation
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Calcutta';
    const cityFromTz = tz.split('/').pop()?.replace(/_/g, ' ') || 'New York';
    const geo = await geocodeCity(cityFromTz);
    if (geo) {
      memoryCache.set(cacheKey, { data: geo, timestamp: Date.now() });
      return geo;
    }
  } catch (_) {}

  // 3. Deterministic default
  return {
    name: 'Bengaluru',
    country: 'India',
    latitude: 12.9716,
    longitude: 77.5946,
  };
}

/**
 * Fetch live weather data for a city or auto-detected location
 */
export async function fetchLiveWeather({ city = '', units = 'celsius', forceRefresh = false } = {}) {
  const isFahrenheit = units === 'fahrenheit';
  const cleanCity = (city || '').trim();
  const cacheStorageKey = `eyeland_weather_cache_${cleanCity.toLowerCase()}_${units}`;

  // Check LocalStorage cache first
  if (!forceRefresh) {
    try {
      const stored = localStorage.getItem(cacheStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
          return parsed.data;
        }
      }
    } catch (_) {}
  }

  // 1. Resolve Location
  let loc = null;
  if (cleanCity && cleanCity.toLowerCase() !== 'auto') {
    loc = await geocodeCity(cleanCity);
    if (!loc) {
      // If geocoding failed, try auto-detection
      loc = await autoDetectLocation();
    }
  } else {
    loc = await autoDetectLocation();
  }

  if (!loc) {
    loc = { name: cleanCity || 'Local', latitude: 51.5074, longitude: -0.1278 };
  }

  // 2. Query Open-Meteo Forecast
  try {
    const tempUnitParam = isFahrenheit ? '&temperature_unit=fahrenheit' : '';
    const windUnitParam = isFahrenheit ? '&wind_speed_unit=mph' : '&wind_speed_unit=kmh';
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto${tempUnitParam}${windUnitParam}`;

    const res = await fetch(url, { headers: { 'User-Agent': 'Eyeland-Dynamic-Island/1.0' } });
    if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);
    const data = await res.json();

    const curr = data.current || {};
    const daily = data.daily || {};
    const code = typeof curr.weather_code === 'number' ? curr.weather_code : 0;
    const isDay = curr.is_day !== 0;
    const meta = WEATHER_CODE_MAP[code] || WEATHER_CODE_MAP[0];

    const currentTemp = typeof curr.temperature_2m === 'number' ? Math.round(curr.temperature_2m) : 22;
    const feelsLike = typeof curr.apparent_temperature === 'number' ? Math.round(curr.apparent_temperature) : currentTemp;
    const humidity = typeof curr.relative_humidity_2m === 'number' ? curr.relative_humidity_2m : 55;
    const windSpeed = typeof curr.wind_speed_10m === 'number' ? Math.round(curr.wind_speed_10m) : 10;
    const maxTemp = Array.isArray(daily.temperature_2m_max) && daily.temperature_2m_max[0] != null ? Math.round(daily.temperature_2m_max[0]) : currentTemp + 3;
    const minTemp = Array.isArray(daily.temperature_2m_min) && daily.temperature_2m_min[0] != null ? Math.round(daily.temperature_2m_min[0]) : currentTemp - 4;

    const weatherResult = {
      city: loc.name,
      country: loc.country || '',
      temp: currentTemp,
      tempUnit: isFahrenheit ? '°F' : '°C',
      feelsLike,
      condition: meta.label,
      icon: isDay ? meta.iconDay : meta.iconNight,
      type: meta.type,
      isDay,
      humidity,
      windSpeed: `${windSpeed} ${isFahrenheit ? 'mph' : 'km/h'}`,
      high: maxTemp,
      low: minTemp,
      precipitation: curr.precipitation || 0,
      timestamp: Date.now(),
      isLive: true,
    };

    // Cache in localStorage
    try {
      localStorage.setItem(cacheStorageKey, JSON.stringify({ data: weatherResult, timestamp: Date.now() }));
    } catch (_) {}

    return weatherResult;
  } catch (err) {
    console.warn('[weatherService] Fetch error:', err.message);

    // Fallback: Check expired cache
    try {
      const stored = localStorage.getItem(cacheStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.data) {
          return { ...parsed.data, isLive: false, cached: true };
        }
      }
    } catch (_) {}

    // Ultimate fallback if offline
    return {
      city: loc.name || 'Local Weather',
      country: '',
      temp: isFahrenheit ? 72 : 23,
      tempUnit: isFahrenheit ? '°F' : '°C',
      feelsLike: isFahrenheit ? 74 : 24,
      condition: 'Partly Cloudy',
      icon: '⛅',
      type: 'partly_cloudy',
      isDay: true,
      humidity: 50,
      windSpeed: isFahrenheit ? '8 mph' : '12 km/h',
      high: isFahrenheit ? 78 : 26,
      low: isFahrenheit ? 64 : 18,
      precipitation: 0,
      timestamp: Date.now(),
      isLive: false,
      offline: true,
    };
  }
}
