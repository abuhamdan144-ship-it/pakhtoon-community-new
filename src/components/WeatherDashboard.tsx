import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Droplets,
  Eye,
  Gauge,
  MapPin,
  Search,
  AlertCircle,
} from 'lucide-react';

interface WeatherData {
  location: string;
  country: string;
  temperature: number;
  feelsLike: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
  pressure: number;
  uvIndex: number;
  sunrise: string;
  sunset: string;
}

interface ForecastDay {
  date: string;
  maxTemp: number;
  minTemp: number;
  description: string;
  icon: string;
  precipitation: number;
}

const WeatherDashboard: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [searchCity, setSearchCity] = useState('Muscat');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState<'C' | 'F'>('C');

  const API_KEY = 'demo'; // Use a free weather API like Open-Meteo (no key needed)

  const fetchWeather = async (city: string) => {
    setLoading(true);
    setError(null);

    try {
      // Using Open-Meteo API (free, no API key required)
      const geocodingResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`
      );

      if (!geocodingResponse.ok) {
        throw new Error('City not found');
      }

      const geoData = await geocodingResponse.json();

      if (!geoData.results || geoData.results.length === 0) {
        throw new Error('City not found. Please try another search.');
      }

      const { latitude, longitude, name, country } = geoData.results[0];

      // Fetch weather data
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,weather&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`
      );

      const weatherData = await weatherResponse.json();

      const current = weatherData.current;
      const daily = weatherData.daily;

      // Map weather codes to descriptions
      const getWeatherDescription = (code: number): string => {
        const descriptions: Record<number, string> = {
          0: 'Clear sky',
          1: 'Mainly clear',
          2: 'Partly cloudy',
          3: 'Overcast',
          45: 'Foggy',
          48: 'Foggy',
          51: 'Light drizzle',
          53: 'Moderate drizzle',
          55: 'Dense drizzle',
          61: 'Slight rain',
          63: 'Moderate rain',
          65: 'Heavy rain',
          71: 'Slight snow',
          73: 'Moderate snow',
          75: 'Heavy snow',
          80: 'Slight rain showers',
          81: 'Moderate rain showers',
          82: 'Violent rain showers',
          85: 'Slight snow showers',
          86: 'Heavy snow showers',
          95: 'Thunderstorm',
          96: 'Thunderstorm with hail',
          99: 'Thunderstorm with hail',
        };
        return descriptions[code] || 'Unknown';
      };

      const getWeatherIcon = (code: number): string => {
        if (code === 0 || code === 1) return '☀️';
        if (code === 2 || code === 3) return '☁️';
        if (code === 45 || code === 48) return '🌫️';
        if (code >= 51 && code <= 67) return '🌧️';
        if (code >= 71 && code <= 86) return '❄️';
        if (code >= 80 && code <= 82) return '⛈️';
        if (code >= 95) return '⛈️';
        return '🌤️';
      };

      const weatherInfo: WeatherData = {
        location: name,
        country: country || '',
        temperature: Math.round(current.temperature_2m),
        feelsLike: Math.round(current.apparent_temperature),
        description: getWeatherDescription(current.weather_code),
        icon: getWeatherIcon(current.weather_code),
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m),
        visibility: 10, // Default visibility
        pressure: 1013, // Default pressure
        uvIndex: 5, // Default UV index
        sunrise: '06:00',
        sunset: '18:00',
      };

      setWeather(weatherInfo);

      // Process forecast
      const forecastData: ForecastDay[] = daily.time.map((date: string, index: number) => ({
        date,
        maxTemp: Math.round(daily.temperature_2m_max[index]),
        minTemp: Math.round(daily.temperature_2m_min[index]),
        description: getWeatherDescription(daily.weather_code[index]),
        icon: getWeatherIcon(daily.weather_code[index]),
        precipitation: daily.precipitation_sum[index],
      }));

      setForecast(forecastData.slice(0, 5));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
      setWeather(null);
      setForecast([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(searchCity);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchCity.trim()) {
      fetchWeather(searchCity);
    }
  };

  const convertTemp = (celsius: number): string => {
    if (unit === 'F') {
      return Math.round((celsius * 9) / 5 + 32).toString();
    }
    return celsius.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Weather Dashboard</h1>
          <p className="text-blue-100">Real-time weather information for your city</p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2 bg-white rounded-full shadow-lg overflow-hidden">
            <input
              type="text"
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              placeholder="Search for a city..."
              className="flex-1 px-6 py-4 bg-transparent outline-none text-gray-800 placeholder-gray-500"
            />
            <button
              type="submit"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
              disabled={loading}
            >
              <Search size={20} />
            </button>
            <button
              type="button"
              onClick={() => setUnit(unit === 'C' ? 'F' : 'C')}
              className="px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold transition-colors"
            >
              °{unit === 'C' ? 'F' : 'C'}
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500 text-white rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center text-white py-12">
            <div className="inline-block animate-spin">
              <Cloud size={40} />
            </div>
            <p className="mt-4">Loading weather data...</p>
          </div>
        )}

        {/* Current Weather */}
        {weather && !loading && (
          <>
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-3xl shadow-2xl p-8 md:p-12 mb-8 text-white">
              {/* Location */}
              <div className="flex items-center gap-2 mb-6">
                <MapPin size={20} />
                <h2 className="text-2xl font-semibold">
                  {weather.location}, {weather.country}
                </h2>
              </div>

              {/* Main Weather Display */}
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="flex items-center justify-center">
                  <div className="text-8xl">{weather.icon}</div>
                </div>
                <div>
                  <div className="text-7xl font-bold mb-4">{convertTemp(weather.temperature)}°</div>
                  <p className="text-2xl text-blue-100 mb-2">{weather.description}</p>
                  <p className="text-lg text-blue-200">
                    Feels like {convertTemp(weather.feelsLike)}°
                  </p>
                </div>
              </div>

              {/* Weather Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white bg-opacity-10 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplets size={18} />
                    <span className="text-sm text-blue-100">Humidity</span>
                  </div>
                  <p className="text-2xl font-bold">{weather.humidity}%</p>
                </div>

                <div className="bg-white bg-opacity-10 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Wind size={18} />
                    <span className="text-sm text-blue-100">Wind Speed</span>
                  </div>
                  <p className="text-2xl font-bold">{weather.windSpeed} km/h</p>
                </div>

                <div className="bg-white bg-opacity-10 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye size={18} />
                    <span className="text-sm text-blue-100">Visibility</span>
                  </div>
                  <p className="text-2xl font-bold">{weather.visibility} km</p>
                </div>

                <div className="bg-white bg-opacity-10 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Gauge size={18} />
                    <span className="text-sm text-blue-100">Pressure</span>
                  </div>
                  <p className="text-2xl font-bold">{weather.pressure} mb</p>
                </div>
              </div>
            </div>

            {/* 5-Day Forecast */}
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-3xl shadow-2xl p-8 md:p-12 text-white">
              <h3 className="text-2xl font-semibold mb-6">5-Day Forecast</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {forecast.map((day, index) => (
                  <div
                    key={index}
                    className="bg-white bg-opacity-10 rounded-lg p-4 text-center hover:bg-opacity-20 transition-all"
                  >
                    <p className="font-semibold mb-3">
                      {new Date(day.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <div className="text-4xl mb-3">{day.icon}</div>
                    <p className="text-sm text-blue-100 mb-3">{day.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="font-bold">{convertTemp(day.maxTemp)}°</span>
                      <span className="text-blue-200">{convertTemp(day.minTemp)}°</span>
                    </div>
                    {day.precipitation > 0 && (
                      <p className="text-xs text-blue-100 mt-2">
                        💧 {day.precipitation}mm
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WeatherDashboard;
