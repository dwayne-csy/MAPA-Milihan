import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../layouts/Header';

// ── Icons ───────────────────────────────────────────────────────────────
const MapPinIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const NavigationIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 11 22 2 13 21 11 13 3 11"/>
  </svg>
);

const RefreshIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

const CheckIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5"/>
  </svg>
);

const XIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
);

const AlertTriangleIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const LeafIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
  </svg>
);

const FileTextIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

// ── Component ───────────────────────────────────────────────────────────
const EditProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    city: '',
    barangay: '',
    street: '',
    zipcode: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  // Location states
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [detailedLocation, setDetailedLocation] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  // ── OpenStreetMap Location Logic ─────────────────────────────────────
  const getOpenStreetMapAddress = async (lat, lng) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&namedetails=1`,
        { headers: { 'Accept-Language': 'en' }, timeout: 5000 }
      );
      const data = response.data;
      const address = data.address || {};
      const components = {
        house: address.house_number || address.house_name || null,
        road: address.road || address.street || address.footway || address.path || null,
        neighbourhood: address.neighbourhood || null,
        suburb: address.suburb || null,
        city_district: address.city_district || null,
        village: address.village || address.hamlet || null,
        town: address.town || null,
        city: address.city || address.municipality || null,
        state: address.state || address.region || null,
        country: address.country || null,
        country_code: address.country_code ? address.country_code.toUpperCase() : null,
        postcode: address.postcode || null,
        county: address.county || null,
      };
      const parts = [
        components.house, components.road, components.neighbourhood,
        components.suburb, components.city_district, components.village,
        components.city, components.county, components.state,
        components.country, components.postcode
      ].filter(Boolean);
      const formattedAddress = parts.join(', ');
      return {
        fullAddress: formattedAddress || data.display_name || `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        displayName: data.display_name,
        components,
        rawData: data,
        source: 'OpenStreetMap',
        coordinates: { lat, lng }
      };
    } catch (error) {
      return {
        fullAddress: `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        displayName: null,
        components: null,
        rawData: null,
        source: 'GPS coordinates only',
        error: 'Failed to fetch from OpenStreetMap',
        coordinates: { lat, lng }
      };
    }
  };

  const detectCurrentLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported by your browser');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setGpsAccuracy(accuracy);
        setUserLocation({ lat: latitude, lng: longitude });
        
        const locationInfo = await getOpenStreetMapAddress(latitude, longitude);
        setDetailedLocation(locationInfo);
        setLocationLoading(false);
      },
      (error) => {
        let msg = 'Could not get your location.';
        if (error.code === error.PERMISSION_DENIED) msg = 'Location permission denied by user.';
        else if (error.code === error.POSITION_UNAVAILABLE) msg = 'Location information is unavailable.';
        else if (error.code === error.TIMEOUT) msg = 'Location request timed out.';
        setLocationError(msg);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const applyDetectedLocation = () => {
    if (detailedLocation && detailedLocation.components) {
      const c = detailedLocation.components;
      setFormData({
        ...formData,
        street: c.road || formData.street,
        barangay: c.neighbourhood || c.suburb || formData.barangay,
        city: c.city || c.town || c.village || formData.city,
        zipcode: c.postcode || formData.zipcode
      });
      setShowLocationModal(false);
      setMessage({ 
        type: 'success', 
        text: '📍 Location detected and applied! Click Save to update your profile.' 
      });
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 4000);
    }
  };

  // ── Fetch User Data ──────────────────────────────────────────────────
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.user) {
        setUser(data.user);
        setFormData({
          name: data.user.name || '',
          contact: data.user.contact || '',
          city: data.user.address?.city || '',
          barangay: data.user.address?.barangay || '',
          street: data.user.address?.street || '',
          zipcode: data.user.address?.zipcode || ''
        });
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile data' });
    } finally {
      setLoading(false);
    }
  };

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setMessage({ type: '', text: '' });

    const token = localStorage.getItem('token');
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('contact', formData.contact);
    formDataToSend.append('city', formData.city);
    formDataToSend.append('barangay', formData.barangay);
    formDataToSend.append('street', formData.street);
    formDataToSend.append('zipcode', formData.zipcode);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/me/update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (response.ok) {
        const updatedUser = { ...user, ...data.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        
        setTimeout(() => {
          navigate('/home');
        }, 2000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Update failed' });
      }
    } catch (error) {
      console.error('Update error:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    navigate('/home');
  };

  const handleChangePassword = () => {
    navigate('/change-password');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes modalFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .location-detect-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: linear-gradient(135deg, #0288d1, #0277bd);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }

        .location-detect-btn:hover {
          opacity: 0.88;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(2, 119, 189, 0.3);
        }

        .location-detect-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          max-width: 520px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
          animation: modalFadeIn 0.3s ease;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 24px;
          border-bottom: 1px solid #e5e7eb;
          background: linear-gradient(135deg, #0288d1, #0277bd);
          border-radius: 16px 16px 0 0;
        }

        .modal-header h3 {
          color: white;
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .modal-close-btn {
          background: rgba(255, 255, 255, 0.15);
          border: none;
          color: white;
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .modal-close-btn:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        .modal-body {
          padding: 24px;
        }

        .loc-loading {
          text-align: center;
          padding: 32px 20px;
        }

        .loc-spinner {
          width: 44px;
          height: 44px;
          border: 3px solid #e0e7e0;
          border-top-color: #0288d1;
          border-radius: 50%;
          animation: spin 0.9s linear infinite;
          margin: 0 auto 16px;
        }

        .loc-error {
          text-align: center;
          padding: 28px 20px;
          color: #c62828;
        }

        .loc-retry-btn {
          margin-top: 14px;
          padding: 10px 24px;
          background: linear-gradient(135deg, #0288d1, #0277bd);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-family: inherit;
        }

        .loc-success-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          padding: 10px 14px;
          background: #e8f5e9;
          border-radius: 8px;
          border-left: 4px solid #43a047;
          font-weight: 600;
          color: #2e7d32;
          font-size: 0.92rem;
        }

        .loc-block {
          margin-bottom: 14px;
          padding: 14px 16px;
          background: #f5f8f5;
          border-radius: 8px;
          border: 1px solid #e0e7e0;
        }

        .loc-block strong {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #78909c;
          display: block;
          margin-bottom: 6px;
        }

        .loc-block p {
          font-size: 0.92rem;
          color: #263238;
          margin: 0;
          line-height: 1.5;
        }

        .loc-block ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .loc-block ul li {
          font-size: 0.85rem;
          color: #546e7a;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .loc-actions {
          display: flex;
          gap: 10px;
          margin-top: 18px;
        }

        .loc-confirm-btn {
          flex: 2;
          padding: 12px;
          background: linear-gradient(135deg, #2e7d32, #43a047);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          font-family: inherit;
          transition: opacity 0.2s;
        }

        .loc-confirm-btn:hover {
          opacity: 0.88;
        }

        .loc-cancel-btn {
          flex: 1;
          padding: 12px;
          background: #f1f3f1;
          color: #546e7a;
          border: 1px solid #e0e7e0;
          border-radius: 8px;
          font-size: 0.88rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          font-family: inherit;
          transition: background 0.2s;
        }

        .loc-cancel-btn:hover {
          background: #e8eae8;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Header */}
            <div className="bg-blue-600 px-6 py-4 flex justify-between items-center flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">Edit Profile</h1>
                <p className="text-blue-100 mt-1">Update your personal information</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowLocationModal(true); detectCurrentLocation(); }}
                  className="location-detect-btn"
                >
                  <NavigationIcon size={16} /> Detect Location
                </button>
                <button
                  onClick={handleChangePassword}
                  className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition font-medium"
                >
                  Change Password
                </button>
              </div>
            </div>

            {/* Message Alerts */}
            {message.text && (
              <div className={`mx-6 mt-6 p-4 rounded-md ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-700 border border-green-400' 
                  : 'bg-red-50 text-red-700 border border-red-400'
              }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center space-y-4">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-blue-600">
                  {user?.avatar?.url ? (
                    <img
                      src={user.avatar.url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-100">
                      <span className="text-4xl font-bold text-blue-600">
                        {user?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500">Your profile picture</p>
                <p className="text-xs text-gray-400">To change your photo, please contact support</p>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    name="contact"
                    value={formData.contact}
                    onChange={handleInputChange}
                    placeholder="+63 912 345 6789"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                    placeholder="Enter street address"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Barangay
                  </label>
                  <input
                    type="text"
                    name="barangay"
                    value={formData.barangay}
                    onChange={handleInputChange}
                    placeholder="Enter barangay"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City/Municipality
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Enter city"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    name="zipcode"
                    value={formData.zipcode}
                    onChange={handleInputChange}
                    maxLength="4"
                    placeholder="Enter 4-digit zip code"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {updating ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ── Location Detection Modal ── */}
      {showLocationModal && (
        <div className="modal-overlay" onClick={() => setShowLocationModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <NavigationIcon size={18} /> Detect Your Location
              </h3>
              <button className="modal-close-btn" onClick={() => setShowLocationModal(false)}>
                <XIcon size={18} />
              </button>
            </div>
            <div className="modal-body">
              {locationLoading && (
                <div className="loc-loading">
                  <div className="loc-spinner" />
                  <p style={{ margin: '0 0 4px', fontSize: '0.92rem', color: '#546e7a' }}>
                    Detecting your location...
                  </p>
                  <p style={{ fontSize: '0.82rem', color: '#90a4ae', margin: 0 }}>
                    Please allow location access when prompted
                  </p>
                </div>
              )}
              {locationError && !locationLoading && (
                <div className="loc-error">
                  <AlertTriangleIcon size={28} />
                  <p style={{ margin: '12px 0 0', fontSize: '0.92rem' }}>{locationError}</p>
                  <button className="loc-retry-btn" onClick={detectCurrentLocation}>
                    <RefreshIcon /> Try Again
                  </button>
                </div>
              )}
              {!locationLoading && !locationError && detailedLocation && (
                <div>
                  <div className="loc-success-banner">
                    <CheckIcon /> Location Detected Successfully
                  </div>
                  <div className="loc-block">
                    <strong>Full Address</strong>
                    <p>{detailedLocation.fullAddress}</p>
                  </div>
                  {detailedLocation.components && (
                    <div className="loc-block">
                      <strong>Address Components</strong>
                      <ul>
                        {detailedLocation.components.road && <li><MapPinIcon size={14} /> Road: {detailedLocation.components.road}</li>}
                        {detailedLocation.components.neighbourhood && <li><LeafIcon size={14} /> Neighbourhood: {detailedLocation.components.neighbourhood}</li>}
                        {detailedLocation.components.suburb && <li><LeafIcon size={14} /> Suburb: {detailedLocation.components.suburb}</li>}
                        {detailedLocation.components.city && <li><MapPinIcon size={14} /> City: {detailedLocation.components.city}</li>}
                        {detailedLocation.components.town && <li><MapPinIcon size={14} /> Town: {detailedLocation.components.town}</li>}
                        {detailedLocation.components.village && <li><MapPinIcon size={14} /> Village: {detailedLocation.components.village}</li>}
                        {detailedLocation.components.state && <li><MapPinIcon size={14} /> State: {detailedLocation.components.state}</li>}
                        {detailedLocation.components.country && <li><LeafIcon size={14} /> Country: {detailedLocation.components.country}</li>}
                        {detailedLocation.components.postcode && <li><FileTextIcon size={14} /> Postcode: {detailedLocation.components.postcode}</li>}
                      </ul>
                    </div>
                  )}
                  {gpsAccuracy && (
                    <div className="loc-block">
                      <strong>GPS Accuracy</strong>
                      <p>±{Math.round(gpsAccuracy)} meters</p>
                    </div>
                  )}
                  <div className="loc-actions">
                    <button className="loc-confirm-btn" onClick={applyDetectedLocation}>
                      <CheckIcon /> Apply to Profile
                    </button>
                    <button className="loc-cancel-btn" onClick={() => setShowLocationModal(false)}>
                      <XIcon /> Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EditProfile;