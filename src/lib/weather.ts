export interface WeatherData {
  temp: number; // in Fahrenheit
  emoji: string;
  condition: string;
}

// Maps Open-Meteo WMO weather codes to descriptive emojis and conditions
const mapWeatherCode = (code: number): { emoji: string; condition: string } => {
  if (code === 0) return { emoji: '☀️', condition: 'Clear Sky' };
  if (code >= 1 && code <= 3) return { emoji: '⛅', condition: 'Partly Cloudy' };
  if (code === 45 || code === 48) return { emoji: '🌫️', condition: 'Foggy' };
  if ((code >= 51 && code <= 55) || (code >= 80 && code <= 82)) return { emoji: '🌧️', condition: 'Showers' };
  if (code >= 56 && code <= 57) return { emoji: '❄️', condition: 'Freezing Drizzle' };
  if (code >= 61 && code <= 65) return { emoji: '🌧️', condition: 'Rainy' };
  if (code >= 66 && code <= 67) return { emoji: '❄️', condition: 'Freezing Rain' };
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return { emoji: '❄️', condition: 'Snowy' };
  if (code >= 95) return { emoji: '⛈️', condition: 'Thunderstorm' };
  return { emoji: '⛅', condition: 'Cloudy' };
};

export const fetchWeather = async (lat: number, lon: number): Promise<WeatherData> => {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=fahrenheit`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Weather API request failed');
    const data = await res.json();
    const current = data.current_weather;
    if (!current) throw new Error('No weather data returned');

    const mapped = mapWeatherCode(current.weathercode);
    return {
      temp: Math.round(current.temperature),
      emoji: mapped.emoji,
      condition: mapped.condition
    };
  } catch (e) {
    console.error('Failed to fetch weather:', e);
    // Fallback static weather if API fails
    return {
      temp: 64,
      emoji: '⛅',
      condition: 'Partly Cloudy'
    };
  }
};

export const getUserLocationAndWeather = (): Promise<WeatherData> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      // Geolocation not supported, fallback to LA
      fetchWeather(34.05, -118.24).then(resolve);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeather(position.coords.latitude, position.coords.longitude).then(resolve);
      },
      (error) => {
        console.warn('Geolocation access denied/failed, falling back to Los Angeles:', error);
        // Fallback to Los Angeles (UCLA)
        fetchWeather(34.07, -118.44).then(resolve);
      },
      { timeout: 10000 }
    );
  });
};
