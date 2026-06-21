// RubberSense/Web/src/Components/User/Home.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../layouts/Header';
import ChatbotWidget from './ChatbotWidget';

// Weather Icons (same as Weather component)
const IconSun = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const IconCloudRain = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="16" y1="13" x2="16" y2="21"/><line x1="8" y1="13" x2="8" y2="21"/><line x1="12" y1="15" x2="12" y2="23"/>
    <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/>
  </svg>
);

const IconCloud = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
  </svg>
);

const IconCloudSun = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41"/>
    <path d="M17 12a5 5 0 1 0-9.9-1H6a3 3 0 0 0 0 6h11a3 3 0 0 0 0-6z"/>
  </svg>
);

const IconDroplets = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/>
    <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>
  </svg>
);

const IconThermometer = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
  </svg>
);

const IconWind = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>
  </svg>
);

const IconPin = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const IconCalendar = ({ size = 15, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const IconClock = ({ size = 15, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Weather states
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [locationAddress, setLocationAddress] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  // API Base URL from environment variable
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  // Weather codes mapping
  const weatherCodes = {
    0: { icon: '☀️', condition: 'Clear sky', color: '#FFD700' },
    1: { icon: '🌤️', condition: 'Mainly clear', color: '#87CEEB' },
    2: { icon: '⛅', condition: 'Partly cloudy', color: '#A9A9A9' },
    3: { icon: '☁️', condition: 'Overcast', color: '#696969' },
    45: { icon: '🌫️', condition: 'Fog', color: '#D3D3D3' },
    48: { icon: '🌫️', condition: 'Depositing rime fog', color: '#D3D3D3' },
    51: { icon: '🌧️', condition: 'Light drizzle', color: '#4682B4' },
    53: { icon: '🌧️', condition: 'Moderate drizzle', color: '#4169E1' },
    55: { icon: '🌧️', condition: 'Dense drizzle', color: '#0000CD' },
    56: { icon: '🌧️', condition: 'Light freezing drizzle', color: '#B0C4DE' },
    57: { icon: '🌧️', condition: 'Dense freezing drizzle', color: '#6495ED' },
    61: { icon: '🌧️', condition: 'Slight rain', color: '#4682B4' },
    63: { icon: '🌧️', condition: 'Moderate rain', color: '#4169E1' },
    65: { icon: '🌧️', condition: 'Heavy rain', color: '#0000CD' },
    66: { icon: '🌧️', condition: 'Light freezing rain', color: '#B0C4DE' },
    67: { icon: '🌧️', condition: 'Heavy freezing rain', color: '#6495ED' },
    71: { icon: '🌨️', condition: 'Slight snow fall', color: '#F0F8FF' },
    73: { icon: '🌨️', condition: 'Moderate snow fall', color: '#E0FFFF' },
    75: { icon: '🌨️', condition: 'Heavy snow fall', color: '#AFEEEE' },
    77: { icon: '🌨️', condition: 'Snow grains', color: '#B0E0E6' },
    80: { icon: '🌧️', condition: 'Slight rain showers', color: '#4682B4' },
    81: { icon: '🌧️', condition: 'Moderate rain showers', color: '#4169E1' },
    82: { icon: '🌧️', condition: 'Violent rain showers', color: '#0000CD' },
    85: { icon: '🌨️', condition: 'Slight snow showers', color: '#F0F8FF' },
    86: { icon: '🌨️', condition: 'Heavy snow showers', color: '#E0FFFF' },
    95: { icon: '⛈️', condition: 'Thunderstorm', color: '#4B0082' },
    96: { icon: '⛈️', condition: 'Thunderstorm with slight hail', color: '#483D8B' },
    99: { icon: '⛈️', condition: 'Thunderstorm with heavy hail', color: '#2F4F4F' }
  };

  // Fetch weather data from Open-Meteo (free, no API key needed)
  const fetchWeatherData = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`
      );
      if (!response.ok) throw new Error('Weather API error');
      const weatherData = await response.json();
      const currentCode = weatherData.current.weather_code;
      const currentWeather = weatherCodes[currentCode] || { icon: '🌤️', condition: 'Fair', color: '#87CEEB' };
      return {
        current: {
          temp: Math.round(weatherData.current.temperature_2m),
          condition: currentWeather.condition,
          humidity: Math.round(weatherData.current.relative_humidity_2m),
          wind: Math.round(weatherData.current.wind_speed_10m),
          icon: currentWeather.icon,
          color: currentWeather.color,
          feels_like: Math.round(weatherData.current.temperature_2m + 2),
          weather_code: currentCode
        },
        daily: weatherData.daily.time.map((date, index) => ({
          date: new Date(date),
          day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          temp_max: Math.round(weatherData.daily.temperature_2m_max[index]),
          temp_min: Math.round(weatherData.daily.temperature_2m_min[index]),
          weather_code: weatherData.daily.weather_code[index]
        })),
        coordinates: { lat: lat.toFixed(6), lng: lng.toFixed(6) },
        fetched_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Weather fetch error:', error);
      throw error;
    }
  };

  const getOpenStreetMapAddress = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'RubberSenseApp/1.0' } }
      );
      if (!response.ok) throw new Error('OpenStreetMap error');
      const data = await response.json();
      const address = data.address || {};
      const parts = [];
      if (address.city) parts.push(address.city);
      if (address.state) parts.push(address.state);
      if (address.country) parts.push(address.country);
      const formattedAddress = parts.filter(Boolean).join(', ') || data.display_name;
      return {
        fullAddress: formattedAddress || `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        components: address,
        source: 'OpenStreetMap',
        coordinates: { lat: lat.toFixed(6), lng: lng.toFixed(6) }
      };
    } catch (error) {
      console.error('OpenStreetMap error:', error);
      return {
        fullAddress: `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        components: null,
        source: 'GPS coordinates only',
        coordinates: { lat: lat.toFixed(6), lng: lng.toFixed(6) }
      };
    }
  };

  const getFiveDayForecast = (dailyData) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const forecastData = [];
    for (let i = 0; i < 5; i++) {
      const dayCode = dailyData[i].weather_code;
      const dayWeather = weatherCodes[dayCode] || { icon: '🌤️', condition: 'Fair', color: '#87CEEB' };
      forecastData.push({
        day: days[dailyData[i].date.getDay()],
        temp: dailyData[i].temp_max,
        icon: dayWeather.icon,
        condition: dayWeather.condition,
        low: dailyData[i].temp_min,
        color: dayWeather.color,
        weather_code: dayCode
      });
    }
    return forecastData;
  };

  const checkGeolocationPermission = () => {
    if (!navigator.geolocation) {
      return { available: false, error: 'Geolocation not supported by your browser' };
    }
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve({ available: true, error: null }),
        (error) => {
          let errorMessage = 'Location permission denied';
          if (error.code === error.PERMISSION_DENIED) {
            errorMessage = 'Location permission denied by user';
          }
          resolve({ available: false, error: errorMessage });
        },
        { timeout: 3000 }
      );
    });
  };

  const getUserLocation = () => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          resolve({ lat: latitude, lng: longitude, accuracy });
        },
        (error) => reject(new Error('Could not get location')),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const WeatherIcon = ({ icon, size = 20, color = 'currentColor' }) => {
    const map = {
      '☀️': <IconSun size={size} color={color} />,
      '🌤️': <IconCloudSun size={size} color={color} />,
      '⛅': <IconCloudSun size={size} color={color} />,
      '☁️': <IconCloud size={size} color={color} />,
      '🌫️': <IconCloud size={size} color={color} />,
      '🌧️': <IconCloudRain size={size} color={color} />,
      '🌨️': <IconCloudRain size={size} color={color} />,
      '⛈️': <IconCloudRain size={size} color={color} />
    };
    return map[icon] || <IconSun size={size} color={color} />;
  };

  // Initialize weather and user
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setLoading(false);
    fetchUserProfile(token);

    // Update date/time
    const updateDateTime = () => {
      const now = new Date();
      setCurrentDate(now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }));
      setCurrentTime(now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true 
      }));
    };
    updateDateTime();
    const timeInterval = setInterval(updateDateTime, 1000);
    return () => clearInterval(timeInterval);
  }, [navigate]);

  // Fetch weather on load
  useEffect(() => {
    if (loading) return;
    const initializeLocation = async () => {
      setWeatherLoading(true);
      const geolocationStatus = await checkGeolocationPermission();
      if (geolocationStatus.available) {
        try {
          const location = await getUserLocation();
          const { lat, lng } = location;
          const locationInfo = await getOpenStreetMapAddress(lat, lng);
          setLocationAddress(locationInfo.fullAddress);
          const weatherData = await fetchWeatherData(lat, lng);
          setWeather(weatherData);
          const fiveDayForecast = getFiveDayForecast(weatherData.daily);
          setForecast(fiveDayForecast);
        } catch (error) {
          console.error('Location/Weather error:', error);
          setLocationError('Could not get weather data. Please try again.');
        }
      } else {
        setLocationError(geolocationStatus.error);
      }
      setWeatherLoading(false);
    };
    initializeLocation();
  }, [loading]);

  const fetchUserProfile = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (response.ok && data.user) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  if (loading) {
    return (
      <div className="full-bleed w-full min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="full-bleed w-full min-h-screen bg-white flex flex-col">
      {/* Header Component */}
      <Header />

      {/* Main Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Home</h1>
          <p className="text-lg text-gray-600">
            Welcome, {user?.name || 'User'}!
          </p>
          
          {/* Weather Section */}
          <div className="mt-8">
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-6 shadow-sm border border-emerald-100">
              <h2 className="text-2xl font-semibold text-emerald-800 mb-4 flex items-center justify-center gap-2">
                <IconCloudSun size={24} color="#2e7d32" />
                Weather Update
                <span className="text-sm font-normal text-gray-500 ml-2">
                  {locationAddress || 'Your Location'}
                </span>
              </h2>

              {weatherLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
                  <span className="ml-3 text-gray-600">Loading weather...</span>
                </div>
              ) : locationError ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
                  <p>⚠️ {locationError}</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="mt-2 text-emerald-600 hover:text-emerald-800 font-medium"
                  >
                    Retry
                  </button>
                </div>
              ) : weather ? (
                <>
                  {/* Current Weather */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100">
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <p className="text-gray-500 text-sm">Temperature</p>
                          <p className="text-3xl font-bold text-emerald-700">
                            {weather.current.temp}°C
                          </p>
                        </div>
                        <div className="text-4xl">
                          <WeatherIcon icon={weather.current.icon} size={40} color="#2e7d32" />
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mt-1">{weather.current.condition}</p>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100">
                      <div className="flex items-center gap-3">
                        <IconThermometer size={24} color="#ef5350" />
                        <div className="text-left">
                          <p className="text-gray-500 text-sm">Feels Like</p>
                          <p className="text-xl font-semibold text-gray-800">{weather.current.feels_like}°C</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100">
                      <div className="flex items-center gap-3">
                        <IconDroplets size={24} color="#42a5f5" />
                        <div className="text-left">
                          <p className="text-gray-500 text-sm">Humidity</p>
                          <p className="text-xl font-semibold text-gray-800">{weather.current.humidity}%</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100">
                      <div className="flex items-center gap-3">
                        <IconWind size={24} color="#26a69a" />
                        <div className="text-left">
                          <p className="text-gray-500 text-sm">Wind Speed</p>
                          <p className="text-xl font-semibold text-gray-800">{weather.current.wind} km/h</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 7-Day Forecast */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <IconCalendar size={18} color="#2e7d32" />
                      <h3 className="text-lg font-semibold text-gray-700">7-Day Forecast</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
                      {forecast.map((day, index) => (
                        <div 
                          key={index} 
                          className="bg-white rounded-xl p-3 text-center shadow-sm border border-emerald-100 hover:shadow-md transition-shadow"
                        >
                          <p className="font-semibold text-gray-700 text-sm">{day.day}</p>
                          <div className="text-2xl my-1">
                            <WeatherIcon icon={day.icon} size={24} color="#2e7d32" />
                          </div>
                          <p className="font-bold text-emerald-700 text-sm">{day.temp}°</p>
                          <p className="text-gray-400 text-xs">{day.low}°</p>
                          <p className="text-gray-500 text-xs truncate mt-1">{day.condition}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Date/Time */}
                  <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-500 border-t border-emerald-100 pt-4">
                    <span className="flex items-center gap-1">
                      <IconCalendar size={14} color="#6b7280" />
                      {currentDate}
                    </span>
                    <span className="w-px h-4 bg-gray-300"></span>
                    <span className="flex items-center gap-1">
                      <IconClock size={14} color="#6b7280" />
                      {currentTime}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 py-4">Unable to load weather data</p>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold text-gray-800">Dashboard</h3>
              <p className="text-gray-600 mt-2">View your farming dashboard</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold text-gray-800">Products</h3>
              <p className="text-gray-600 mt-2">Browse agricultural products</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold text-gray-800">Community</h3>
              <p className="text-gray-600 mt-2">Connect with other farmers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chatbot Widget */}
      <ChatbotWidget 
        isOpen={isChatOpen} 
        onClose={toggleChat} 
        sessionId={`user-${user?.id || 'guest'}-${Date.now()}`}
      />
    </div>
  );
};

export default Home;