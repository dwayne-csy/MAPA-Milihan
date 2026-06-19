import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../layouts/Header';

// ── Icons ───────────────────────────────────────────────────────────────
const SaveIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
);

const UserIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const MailIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const PhoneIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.07 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3 2.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21 16.92z"/>
  </svg>
);

const MapPinIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const NavigationIcon = ({ size = 16 }) => (
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

const CameraIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const LockIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

// ── Component ───────────────────────────────────────────────────────────
const EditProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [user, setUser] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);
  
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
        text: '📍 Location applied to your profile! Click Save to update.' 
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
          contact: data.user.contact || data.user.phone || '',
          city: data.user.address?.city || '',
          barangay: data.user.address?.barangay || '',
          street: data.user.address?.street || '',
          zipcode: data.user.address?.zipcode || data.user.address?.zipCode || ''
        });
        if (data.user.avatar?.url || data.user.profilePicture?.url) {
          const avatarUrl = data.user.avatar?.url || data.user.profilePicture?.url;
          setAvatarPreview(avatarUrl.startsWith('http') ? avatarUrl : `${API_BASE_URL}${avatarUrl}`);
        }
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

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select an image file' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image size must be less than 5MB' });
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setMessage({ type: 'success', text: 'Avatar selected. Click Save to update.' });
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setMessage({ type: '', text: '' });

    const token = localStorage.getItem('token');
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name.trim());
    formDataToSend.append('contact', formData.contact.trim());
    formDataToSend.append('city', formData.city.trim());
    formDataToSend.append('barangay', formData.barangay.trim());
    formDataToSend.append('street', formData.street.trim());
    formDataToSend.append('zipcode', formData.zipcode.trim());

    if (avatarFile) {
      formDataToSend.append('avatar', avatarFile);
    }

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
        setUser(updatedUser);
        setAvatarFile(null);
        
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

  const getUserAvatar = (userData) => {
    if (avatarPreview) return avatarPreview;
    if (userData?.profilePicture?.url) {
      return userData.profilePicture.url.startsWith('http')
        ? userData.profilePicture.url
        : `${API_BASE_URL}${userData.profilePicture.url}`;
    }
    if (userData?.avatar?.url) {
      return userData.avatar.url.startsWith('http')
        ? userData.avatar.url
        : `${API_BASE_URL}${userData.avatar.url}`;
    }
    return null;
  };

  const getInitial = (name) => name?.charAt(0)?.toUpperCase() || 'U';

  // ── Loading State ──
  if (loading) {
    return (
      <div className="full-bleed w-full min-h-screen bg-white flex flex-col">
        <Header />
        <style>{`
          @keyframes ep-spin { to { transform: rotate(360deg); } }
        `}</style>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="full-bleed w-full min-h-screen bg-white flex flex-col">
      <Header />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        @keyframes ep-fadeup {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes ep-spin {
          to { transform: rotate(360deg); }
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .ep-root {
          font-family: 'DM Sans', sans-serif;
          flex: 1;
          background: #f9fafb;
          padding: 32px 20px 60px;
        }

        .ep-container {
          max-width: 820px;
          margin: 0 auto;
        }

        .ep-card {
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 2px 20px rgba(5, 150, 105, 0.08);
          border: 1px solid #d1fae5;
          animation: ep-fadeup 0.4s ease both;
          overflow: hidden;
        }

        .ep-header {
          background: linear-gradient(135deg, #059669, #047857);
          padding: 24px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .ep-header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .ep-header-icon {
          width: 44px;
          height: 44px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
        }

        .ep-header h1 {
          font-family: 'DM Serif Display', serif;
          font-size: 1.5rem;
          color: #fff;
          margin: 0;
        }

        .ep-header p {
          margin: 2px 0 0;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .ep-header-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .ep-header-btn {
          padding: 8px 18px;
          background: rgba(255, 255, 255, 0.15);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: background 0.2s, transform 0.15s;
        }

        .ep-header-btn:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-1px);
        }

        /* ── Body ── */
        .ep-body {
          padding: 32px;
        }

        /* ── Avatar ── */
        .ep-avatar-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 28px;
          padding-bottom: 28px;
          border-bottom: 1.5px solid #d1fae5;
        }

        .ep-avatar-wrapper {
          position: relative;
          cursor: pointer;
        }

        .ep-avatar-ring {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          overflow: hidden;
          border: 3px solid #059669;
          background: #d1fae5;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.2s;
        }

        .ep-avatar-ring:hover {
          opacity: 0.85;
        }

        .ep-avatar-ring img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .ep-avatar-ring .fallback {
          font-family: 'DM Serif Display', serif;
          font-size: 3rem;
          font-weight: 700;
          color: #059669;
        }

        .ep-avatar-overlay {
          position: absolute;
          bottom: 0;
          right: 0;
          background: linear-gradient(135deg, #059669, #047857);
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          border: 2px solid #fff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .ep-avatar-label {
          margin-top: 12px;
          font-size: 0.85rem;
          font-weight: 500;
          color: #37474f;
        }

        .ep-avatar-sub {
          font-size: 0.75rem;
          color: #a5b8a5;
        }

        /* ── Form ── */
        .ep-form-group {
          margin-bottom: 20px;
        }

        .ep-form-label {
          display: block;
          font-size: 0.78rem;
          font-weight: 600;
          color: #37474f;
          margin-bottom: 6px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .ep-form-label .required {
          color: #ef5350;
        }

        .ep-form-label .disabled-badge {
          font-weight: 400;
          text-transform: none;
          color: #a5b8a5;
          font-size: 0.7rem;
          margin-left: 6px;
        }

        .ep-form-input {
          width: 100%;
          padding: 12px 16px;
          border: 1.5px solid #e0e7e0;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          color: #263238;
          background: #fafcfa;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .ep-form-input:focus {
          outline: none;
          border-color: #059669;
          box-shadow: 0 0 0 4px rgba(5, 150, 105, 0.1);
          background: #fff;
        }

        .ep-form-input:disabled {
          background: #f1f3f1;
          color: #78909c;
          cursor: not-allowed;
        }

        .ep-form-input.readonly {
          background: #f1f3f1;
          color: #78909c;
        }

        .ep-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }

        /* ── Location Detect Button ── */
        .ep-location-detect {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          background: #ecfdf5;
          border: 1.5px dashed #059669;
          border-radius: 10px;
          margin-top: 4px;
        }

        .ep-location-detect p {
          margin: 0;
          font-size: 0.85rem;
          color: #546e7a;
          flex: 1;
        }

        .ep-location-detect .highlight {
          color: #059669;
          font-weight: 600;
        }

        .ep-detect-btn {
          padding: 8px 18px;
          background: linear-gradient(135deg, #059669, #047857);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: opacity 0.2s, transform 0.15s;
          white-space: nowrap;
        }

        .ep-detect-btn:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }

        /* ── Alerts ── */
        .ep-alert {
          padding: 14px 18px;
          border-radius: 10px;
          margin-bottom: 20px;
          font-size: 0.92rem;
          display: flex;
          align-items: center;
          gap: 10px;
          animation: slideDown 0.3s ease both;
        }

        .ep-alert-error {
          background: #ffebee;
          border-left: 4px solid #ef5350;
          color: #c62828;
        }

        .ep-alert-success {
          background: #e8f5e9;
          border-left: 4px solid #43A047;
          color: #2E7D32;
        }

        /* ── Buttons ── */
        .ep-actions {
          display: flex;
          gap: 14px;
          margin-top: 8px;
          padding-top: 24px;
          border-top: 1.5px solid #d1fae5;
        }

        .ep-btn {
          padding: 14px 32px;
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          flex: 1;
        }

        .ep-btn:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }

        .ep-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .ep-btn-primary {
          background: linear-gradient(135deg, #059669, #047857);
          color: #fff;
          box-shadow: 0 4px 16px rgba(5, 150, 105, 0.25);
        }

        .ep-btn-secondary {
          background: #ecfdf5;
          color: #059669;
          border: 1.5px solid #a7f3d0;
        }

        /* ── Modal ── */
        .ep-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(10, 30, 60, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 20px;
          backdrop-filter: blur(3px);
          animation: ep-fadeup 0.25s ease both;
        }

        .ep-modal {
          background: #fff;
          border-radius: 16px;
          max-width: 540px;
          width: 100%;
          max-height: 90vh;
          overflow: auto;
          box-shadow: 0 24px 64px rgba(27, 94, 32, 0.2);
        }

        .ep-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 22px;
          border-bottom: 1px solid #d1fae5;
          background: linear-gradient(135deg, #059669, #047857);
          border-radius: 16px 16px 0 0;
        }

        .ep-modal-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'DM Serif Display', serif;
          font-size: 1.1rem;
          color: #fff;
          margin: 0;
        }

        .ep-modal-close {
          background: rgba(255, 255, 255, 0.15);
          border: none;
          cursor: pointer;
          color: #fff;
          padding: 6px;
          display: flex;
          align-items: center;
          border-radius: 6px;
          transition: background 0.2s;
        }

        .ep-modal-close:hover {
          background: rgba(255, 255, 255, 0.28);
        }

        .ep-modal-body {
          padding: 24px;
        }

        .ep-loc-loading {
          text-align: center;
          padding: 32px 20px;
        }

        .ep-loc-spinner {
          width: 44px;
          height: 44px;
          border: 3px solid #d1fae5;
          border-top-color: #059669;
          border-radius: 50%;
          animation: ep-spin 0.9s linear infinite;
          margin: 0 auto 16px;
        }

        .ep-loc-error {
          text-align: center;
          padding: 28px 20px;
          color: #c62828;
        }

        .ep-retry-btn {
          margin-top: 14px;
          padding: 10px 24px;
          background: linear-gradient(135deg, #059669, #047857);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .ep-loc-result {
          padding: 4px 0;
        }

        .ep-loc-success-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          padding: 10px 14px;
          background: #e8f5e9;
          border-radius: 8px;
          border-left: 4px solid #43A047;
          font-weight: 600;
          color: #2E7D32;
          font-size: 0.92rem;
        }

        .ep-loc-block {
          margin-bottom: 14px;
          padding: 14px 16px;
          background: #f1f8e9;
          border-radius: 8px;
          border: 1px solid #c8e6c9;
        }

        .ep-loc-block strong {
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #78909c;
          display: block;
          margin-bottom: 6px;
        }

        .ep-loc-block p {
          font-size: 0.92rem;
          color: #263238;
          margin: 0;
          line-height: 1.5;
        }

        .ep-loc-block ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .ep-loc-block ul li {
          font-size: 0.85rem;
          color: #546e7a;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .ep-loc-actions {
          display: flex;
          gap: 10px;
          margin-top: 18px;
        }

        .ep-confirm-btn {
          flex: 2;
          padding: 12px;
          background: linear-gradient(135deg, #059669, #047857);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          box-shadow: 0 4px 14px rgba(5, 150, 105, 0.25);
          transition: opacity 0.2s;
        }

        .ep-confirm-btn:hover {
          opacity: 0.88;
        }

        .ep-cancel-btn {
          flex: 1;
          padding: 12px;
          background: #ecfdf5;
          color: #546e7a;
          border: 1px solid #a7f3d0;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          transition: background 0.2s;
        }

        .ep-cancel-btn:hover {
          background: #d1fae5;
        }

        /* ── Hidden file input ── */
        .ep-file-input {
          display: none;
        }

        @media (max-width: 640px) {
          .ep-body { padding: 20px; }
          .ep-header { padding: 20px; flex-direction: column; align-items: stretch; }
          .ep-header-actions { justify-content: stretch; }
          .ep-form-row { grid-template-columns: 1fr; gap: 0; }
          .ep-actions { flex-direction: column; }
          .ep-location-detect { flex-direction: column; align-items: stretch; }
          .ep-avatar-ring { width: 100px; height: 100px; }
          .ep-avatar-overlay { width: 30px; height: 30px; }
        }

        @media (max-width: 480px) {
          .ep-root { padding: 16px 12px; }
          .ep-header h1 { font-size: 1.2rem; }
          .ep-body { padding: 16px; }
          .ep-card { border-radius: 12px; }
          .ep-btn { padding: 12px 20px; font-size: 0.85rem; }
        }
      `}</style>

      <div className="ep-root">
        <div className="ep-container">
          <div className="ep-card">

            {/* ── Header ── */}
            <div className="ep-header">
              <div className="ep-header-left">
                <div className="ep-header-icon">
                  <UserIcon size={22} />
                </div>
                <div>
                  <h1>Edit Profile</h1>
                  <p>Update your personal information</p>
                </div>
              </div>
              <div className="ep-header-actions">
                <button
                  type="button"
                  className="ep-header-btn"
                  onClick={handleChangePassword}
                >
                  <LockIcon size={16} /> Change Password
                </button>
              </div>
            </div>

            {/* ── Body ── */}
            <div className="ep-body">

              {/* ── Alerts ── */}
              {message.text && (
                <div className={`ep-alert ${message.type === 'success' ? 'ep-alert-success' : 'ep-alert-error'}`}>
                  {message.type === 'success' ? <CheckIcon size={18} /> : <AlertTriangleIcon size={20} />}
                  {message.text}
                </div>
              )}

              {/* ── Avatar ── */}
              <div className="ep-avatar-section">
                <div className="ep-avatar-wrapper" onClick={handleAvatarClick}>
                  <div className="ep-avatar-ring">
                    {getUserAvatar(user) ? (
                      <img src={getUserAvatar(user)} alt={user?.name} />
                    ) : (
                      <span className="fallback">{getInitial(user?.name)}</span>
                    )}
                  </div>
                  <div className="ep-avatar-overlay">
                    <CameraIcon size={16} />
                  </div>
                </div>
                <p className="ep-avatar-label">{user?.name}</p>
                <p className="ep-avatar-sub">Click the camera icon to change your photo</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="ep-file-input"
                />
              </div>

              {/* ── Form ── */}
              <form onSubmit={handleSubmit}>
                <div className="ep-form-row">
                  <div className="ep-form-group">
                    <label className="ep-form-label">Full Name <span className="required">*</span></label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="ep-form-input"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="ep-form-group">
                    <label className="ep-form-label">
                      Email <span className="disabled-badge">(cannot be changed)</span>
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="ep-form-input readonly"
                    />
                  </div>
                </div>

                <div className="ep-form-group">
                  <label className="ep-form-label">Contact Number</label>
                  <input
                    type="tel"
                    name="contact"
                    value={formData.contact}
                    onChange={handleInputChange}
                    placeholder="+63 912 345 6789"
                    className="ep-form-input"
                  />
                </div>

                {/* ── Address Fields ── */}
                <div className="ep-form-group">
                  <label className="ep-form-label">Address Information</label>
                  
                  <div className="ep-form-group">
                    <label className="ep-form-label" style={{ fontSize: '0.7rem', color: '#78909c' }}>Street</label>
                    <input
                      type="text"
                      name="street"
                      value={formData.street}
                      onChange={handleInputChange}
                      placeholder="Enter street address"
                      className="ep-form-input"
                    />
                  </div>

                  <div className="ep-form-row">
                    <div className="ep-form-group">
                      <label className="ep-form-label" style={{ fontSize: '0.7rem', color: '#78909c' }}>Barangay</label>
                      <input
                        type="text"
                        name="barangay"
                        value={formData.barangay}
                        onChange={handleInputChange}
                        placeholder="Enter barangay"
                        className="ep-form-input"
                      />
                    </div>
                    <div className="ep-form-group">
                      <label className="ep-form-label" style={{ fontSize: '0.7rem', color: '#78909c' }}>City/Municipality</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="Enter city"
                        className="ep-form-input"
                      />
                    </div>
                  </div>

                  <div className="ep-form-group">
                    <label className="ep-form-label" style={{ fontSize: '0.7rem', color: '#78909c' }}>Zip Code</label>
                    <input
                      type="text"
                      name="zipcode"
                      value={formData.zipcode}
                      onChange={handleInputChange}
                      maxLength="4"
                      placeholder="Enter 4-digit zip code"
                      className="ep-form-input"
                    />
                  </div>

                  {/* ── Detect Location ── */}
                  <div className="ep-location-detect">
                    <MapPinIcon size={18} color="#059669" />
                    <p>
                      Use <span className="highlight">GPS</span> to automatically fill your address
                    </p>
                    <button
                      type="button"
                      className="ep-detect-btn"
                      onClick={() => { setShowLocationModal(true); detectCurrentLocation(); }}
                    >
                      <NavigationIcon size={16} /> Detect
                    </button>
                  </div>
                </div>

                {/* ── Actions ── */}
                <div className="ep-actions">
                  <button
                    type="submit"
                    disabled={updating}
                    className="ep-btn ep-btn-primary"
                  >
                    {updating ? (
                      <>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: '#fff',
                          borderRadius: '50%',
                          animation: 'ep-spin 0.8s linear infinite'
                        }} />
                        Saving...
                      </>
                    ) : (
                      <>
                        <SaveIcon size={18} /> Save Changes
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="ep-btn ep-btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ── Location Modal ── */}
      {showLocationModal && (
        <div className="ep-modal-overlay" onClick={() => setShowLocationModal(false)}>
          <div className="ep-modal" onClick={e => e.stopPropagation()}>
            <div className="ep-modal-header">
              <h3 className="ep-modal-title"><NavigationIcon size={16} /> Detect Your Location</h3>
              <button className="ep-modal-close" onClick={() => setShowLocationModal(false)}>
                <XIcon />
              </button>
            </div>
            <div className="ep-modal-body">
              {locationLoading && (
                <div className="ep-loc-loading">
                  <div className="ep-loc-spinner" />
                  <p style={{ margin: '0 0 4px', fontSize: '0.92rem', color: '#546e7a' }}>Detecting your location...</p>
                  <p style={{ fontSize: '0.82rem', color: '#90a4ae', margin: 0 }}>Please allow location access when prompted</p>
                </div>
              )}
              {locationError && !locationLoading && (
                <div className="ep-loc-error">
                  <AlertTriangleIcon size={28} />
                  <p style={{ margin: '12px 0 0', fontSize: '0.92rem' }}>{locationError}</p>
                  <button className="ep-retry-btn" onClick={detectCurrentLocation}>
                    <RefreshIcon /> Try Again
                  </button>
                </div>
              )}
              {!locationLoading && !locationError && detailedLocation && (
                <div className="ep-loc-result">
                  <div className="ep-loc-success-banner">
                    <CheckIcon /> Location Detected Successfully
                  </div>
                  <div className="ep-loc-block">
                    <strong>Full Address</strong>
                    <p>{detailedLocation.fullAddress}</p>
                  </div>
                  {detailedLocation.components && (
                    <div className="ep-loc-block">
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
                    <div className="ep-loc-block">
                      <strong>GPS Accuracy</strong>
                      <p>±{Math.round(gpsAccuracy)} meters</p>
                    </div>
                  )}
                  <div className="ep-loc-actions">
                    <button className="ep-confirm-btn" onClick={applyDetectedLocation}>
                      <CheckIcon /> Apply to Profile
                    </button>
                    <button className="ep-cancel-btn" onClick={() => setShowLocationModal(false)}>
                      <XIcon /> Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProfile;