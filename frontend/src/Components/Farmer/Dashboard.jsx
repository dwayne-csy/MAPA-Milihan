// Mapa-Milihan/frontend/src/Components/Farmer/Dashboard.jsx

import React, { useState, useEffect } from 'react';
import FarmerHeader from '../layouts/FarmerHeader';
import FarmerChatbotWidget from './FarmerChatbotWidget';
import forumsImg from '../image/forums.jpg';
import marketplaceImg from '../image/marketplace.jpg';

// --- Simple inline icon set (no emojis) ---
const IconSun = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);
const IconCloud = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M17.5 19H8a5 5 0 1 1 1.68-9.71 6 6 0 0 1 11.42 2.87A4 4 0 0 1 21 19h-3.5Z" />
  </svg>
);
const IconCloudSun = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12.5 2v1M18 4.5l-.7.7M22 12h-1M4.2 5.2l.7.7" />
    <path d="M9.5 6.5A5 5 0 0 1 15 10a4 4 0 0 1 3 4H6a4 4 0 0 1 3.5-7.5Z" />
  </svg>
);
const IconRain = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 17H6a4 4 0 1 1 1.2-7.82 5 5 0 0 1 9.3 1.9A3.5 3.5 0 0 1 16 17Z" />
    <path d="M8 19v2M12 19v2M16 19v2" />
  </svg>
);
const IconSnow = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 17H6a4 4 0 1 1 1.2-7.82 5 5 0 0 1 9.3 1.9A3.5 3.5 0 0 1 16 17Z" />
    <path d="M8 19v2M8 19l-1 1M8 19l1 1M12 19v2M16 19v2M16 19l-1 1M16 19l1 1" />
  </svg>
);
const IconStorm = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 14H6a4 4 0 1 1 1.2-7.82 5 5 0 0 1 9.3 1.9A3.5 3.5 0 0 1 16 14Z" />
    <path d="M13 14l-3 5h3l-2 4" />
  </svg>
);
const IconFog = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 12H6a4 4 0 1 1 1.2-7.82 5 5 0 0 1 9.3 1.9A3.5 3.5 0 0 1 16 12Z" />
    <path d="M4 17h16M4 20h16" />
  </svg>
);
const IconDroplet = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 2s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11Z" />
  </svg>
);
const IconWind = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 8h11a2.5 2.5 0 1 0-2.5-2.5M3 12h15a2.5 2.5 0 1 1-2.5 2.5M3 16h8a2 2 0 1 1-2 2" />
  </svg>
);
const IconMapPin = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

// Maps Open-Meteo weather codes to label + icon
const WEATHER_CODES = {
  0: { label: 'Clear sky', Icon: IconSun },
  1: { label: 'Mostly clear', Icon: IconCloudSun },
  2: { label: 'Partly cloudy', Icon: IconCloudSun },
  3: { label: 'Overcast', Icon: IconCloud },
  45: { label: 'Foggy', Icon: IconFog },
  48: { label: 'Foggy', Icon: IconFog },
  51: { label: 'Light drizzle', Icon: IconRain },
  53: { label: 'Drizzle', Icon: IconRain },
  55: { label: 'Dense drizzle', Icon: IconRain },
  61: { label: 'Light rain', Icon: IconRain },
  63: { label: 'Rain', Icon: IconRain },
  65: { label: 'Heavy rain', Icon: IconRain },
  71: { label: 'Light snow', Icon: IconSnow },
  73: { label: 'Snow', Icon: IconSnow },
  75: { label: 'Heavy snow', Icon: IconSnow },
  80: { label: 'Rain showers', Icon: IconRain },
  81: { label: 'Rain showers', Icon: IconRain },
  82: { label: 'Violent showers', Icon: IconStorm },
  95: { label: 'Thunderstorm', Icon: IconStorm },
  96: { label: 'Thunderstorm w/ hail', Icon: IconStorm },
  99: { label: 'Thunderstorm w/ hail', Icon: IconStorm },
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Dashboard = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [weather, setWeather] = useState(null);
  const [currentTime, setCurrentTime] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [locationName, setLocationName] = useState(null);
  const [weatherError, setWeatherError] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(true);

  const toggleChat = () => setIsChatOpen((prev) => !prev);

  // Live clock, updates every second, independent of the weather API
  useEffect(() => {
    const updateClock = () => {
      setCurrentTime(
        new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };

    updateClock();
    const clockTimer = setInterval(updateClock, 1000);

    return () => clearInterval(clockTimer);
  }, []);

  // Fetch weather + location once on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setWeatherError('Location not supported by your browser.');
      setLoadingWeather(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Request 6 days total so we can drop "today" and keep the next 5
          const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&forecast_days=6&timezone=auto`
          );
          const weatherData = await weatherRes.json();

          setWeather({
            temp: Math.round(weatherData.current.temperature_2m),
            humidity: weatherData.current.relative_humidity_2m,
            windSpeed: Math.round(weatherData.current.wind_speed_10m),
            code: weatherData.current.weather_code,
          });

          // Skip index 0 (today) — keep the next 5 days only
          const days = weatherData.daily.time.slice(1).map((date, i) => ({
            date,
            day: DAY_LABELS[new Date(date).getDay()],
            max: Math.round(weatherData.daily.temperature_2m_max[i + 1]),
            min: Math.round(weatherData.daily.temperature_2m_min[i + 1]),
            code: weatherData.daily.weather_code[i + 1],
          }));
          setForecast(days);

          // Reverse geocode location using OpenStreetMap Nominatim
          try {
            const geoRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
            );
            const geoData = await geoRes.json();
            const address = geoData.address || {};
            const place =
              address.city ||
              address.town ||
              address.municipality ||
              address.village ||
              address.county;
            const region = address.state || address.region;
            setLocationName(
              [place, region].filter(Boolean).join(', ') || geoData.display_name
            );
          } catch {
            setLocationName(null);
          }
        } catch (err) {
          setWeatherError('Unable to load weather data.');
        } finally {
          setLoadingWeather(false);
        }
      },
      () => {
        setWeatherError('Location access denied.');
        setLoadingWeather(false);
      }
    );
  }, []);

  const weatherInfo = weather
    ? WEATHER_CODES[weather.code] || { label: 'Unknown', Icon: IconCloud }
    : null;

  return (
    <div className="full-bleed w-full min-h-screen bg-emerald-50/40 flex flex-col">
      <FarmerHeader />

      <div className="flex-1 flex items-center">
        <div className="w-full max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left: text + weather */}
          <div>
            <h1 className="text-5xl font-bold leading-tight text-gray-900 mb-6">
              Welcome to your{' '}
              <span className="text-emerald-700">Farming</span> Dashboard
            </h1>

            <p className="text-gray-500 text-lg mb-8 max-w-md">
              Browse and buy products from other farmers, chat and connect
              directly with the community, join discussions in the forums,
              and find or route to nearby farmers — all in one place.
            </p>

            {/* Weather Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-5 max-w-md">
              {loadingWeather && (
                <p className="text-gray-400 text-sm">Fetching your local weather...</p>
              )}

              {!loadingWeather && weatherError && (
                <p className="text-red-500 text-sm">{weatherError}</p>
              )}

              {!loadingWeather && weather && (
                <>
                  {/* Location */}
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-3">
                    <IconMapPin className="w-3.5 h-3.5" />
                    <span>{locationName || 'Your location'}</span>
                  </div>

                  {/* Current weather */}
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">
                        Now{currentTime ? ` · ${currentTime}` : ''}
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {weather.temp}°C
                      </p>
                      <p className="text-sm text-gray-500">{weatherInfo.label}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <weatherInfo.Icon className="w-9 h-9 text-emerald-600" />
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <IconDroplet className="w-3.5 h-3.5" />
                          {weather.humidity}%
                        </span>
                        <span className="flex items-center gap-1">
                          <IconWind className="w-3.5 h-3.5" />
                          {weather.windSpeed} km/h
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 5-day forecast (excludes today, clearly labeled as predicted) */}
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-gray-500">
                      5-Day Forecast
                    </p>
                  </div>
                  <div className="grid grid-cols-5 gap-2 pt-2 border-t border-gray-100">
                    {forecast.map((d) => {
                      const info = WEATHER_CODES[d.code] || { Icon: IconCloud };
                      const DayIcon = info.Icon;
                      return (
                        <div
                          key={d.date}
                          className="flex flex-col items-center gap-1 text-center"
                        >
                          <span className="text-xs font-medium text-gray-500">
                            {d.day}
                          </span>
                          <DayIcon className="w-5 h-5 text-emerald-600" />
                          <span className="text-xs font-semibold text-gray-800">
                            {d.max}°
                          </span>
                          <span className="text-xs text-gray-400">{d.min}°</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right: stacked images */}
          <div className="relative w-full h-[420px] hidden lg:block">
            <div className="absolute top-0 right-0 w-[80%] h-[280px] rounded-2xl overflow-hidden shadow-lg border-4 border-white">
              <img
                src={marketplaceImg}
                alt="Marketplace"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute bottom-0 left-0 w-[65%] h-[280px] rounded-2xl overflow-hidden shadow-lg border-4 border-white">
              <img
                src={forumsImg}
                alt="Forums"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      <FarmerChatbotWidget isOpen={isChatOpen} onClose={toggleChat} />
    </div>
  );
};

export default Dashboard;