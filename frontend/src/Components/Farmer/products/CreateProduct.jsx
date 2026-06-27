import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FarmerHeader from '../../layouts/FarmerHeader';
import { getUser } from '../../utils/helper';

// ── Icons ───────────────────────────────────────────────────────────────
const PlusIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);

const ImageIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);

const VideoIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="2.18"/>
    <line x1="8" y1="2" x2="8" y2="22"/>
    <line x1="16" y1="2" x2="16" y2="22"/>
    <line x1="2" y1="8" x2="22" y2="8"/>
    <line x1="2" y1="16" x2="22" y2="16"/>
    <polygon points="10 10 14 12 10 14 10 10"/>
  </svg>
);

const CloseIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
);

const MapPinIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const EditIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const AlertTriangleIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const CheckIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5"/>
  </svg>
);

// ── Component ───────────────────────────────────────────────────────────
const CreateProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);
  const [hasLocation, setHasLocation] = useState(false);
  const [locationDetails, setLocationDetails] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    category: 'Vegetables',
    unit: 'kg',
    isAvailable: true
  });

  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  // ── Effect ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const userData = getUser();
    if (userData) {
      setUser(userData);
      // Check if user has address in profile
      const hasAddress = userData.address && 
                        userData.address.city && 
                        userData.address.barangay &&
                        userData.address.city.trim() !== '' &&
                        userData.address.barangay.trim() !== '';
      
      if (hasAddress) {
        setHasLocation(true);
        setLocationDetails({
          address: `${userData.address.barangay}, ${userData.address.city}`,
          street: userData.address.street || '',
          barangay: userData.address.barangay,
          city: userData.address.city,
          zipcode: userData.address.zipcode || ''
        });
      } else {
        setHasLocation(false);
      }
    }
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      setError('Maximum 5 files allowed');
      return;
    }

    setMediaFiles(files);
    
    const previews = files.map(file => {
      const isVideo = file.type.startsWith('video/');
      return {
        url: URL.createObjectURL(file),
        type: isVideo ? 'video' : 'image',
        name: file.name,
        size: file.size
      };
    });
    setMediaPreviews(previews);
  };

  const handleRemoveMedia = (index) => {
    const newFiles = [...mediaFiles];
    const newPreviews = [...mediaPreviews];
    
    // Revoke object URL to free memory
    URL.revokeObjectURL(newPreviews[index].url);
    
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setMediaFiles(newFiles);
    setMediaPreviews(newPreviews);
  };

  const handleEditProfile = () => {
    navigate('/farmer/edit-profile');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate location
    if (!hasLocation) {
      setError('Please update your profile with location details first.');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();

      // Append all form fields
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('price', parseFloat(formData.price));
      formDataToSend.append('quantity', parseInt(formData.quantity));
      formDataToSend.append('category', formData.category);
      formDataToSend.append('unit', formData.unit);
      formDataToSend.append('isAvailable', formData.isAvailable);

      // Use location from user profile
      if (user?.address) {
        const locationData = {
          type: 'Point',
          coordinates: [0, 0],
          address: `${user.address.barangay || ''}, ${user.address.city || ''}, ${user.address.street || ''}`.trim() || 'Address not specified',
          components: {
            barangay: user.address.barangay || '',
            city: user.address.city || '',
            street: user.address.street || '',
            zipcode: user.address.zipcode || ''
          }
        };
        formDataToSend.append('location', JSON.stringify(locationData));
      }

      // Append media files (images and videos)
      mediaFiles.forEach(file => {
        formDataToSend.append('images', file);
      });

      const response = await fetch(`${API_BASE_URL}/api/v1/products/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Product created successfully!');
        setFormData({
          name: '',
          description: '',
          price: '',
          quantity: '',
          category: 'Vegetables',
          unit: 'kg',
          isAvailable: true
        });
        setMediaFiles([]);
        setMediaPreviews([]);
        setTimeout(() => navigate('/farmer/products'), 2000);
      } else {
        const errorMessage = data.message || data.error || 'Failed to create product';
        setError(errorMessage);
        console.error('Server error:', data);
      }
    } catch (err) {
      console.error('Create product error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['Fruits', 'Vegetables', 'Grains', 'Livestock', 'Others'];
  const units = [
    { value: 'kg', label: 'Per Kilo (KG)' },
    { value: 'tray', label: 'Per Tray (tray)' },
    { value: 'sack', label: 'Per Sack (sack)' },
    { value: 'pc', label: 'Per Piece (pc)' },
    { value: 'L', label: 'Per Liter (L)' }
  ];

  // Helper to format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="full-bleed w-full min-h-screen bg-[#f5f7f5] flex flex-col">
      <FarmerHeader />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        @keyframes up-fadeup {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes up-spin {
          to { transform: rotate(360deg); }
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .cp-root {
          font-family: 'DM Sans', sans-serif;
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 20px;
        }

        .cp-container {
          max-width: 820px;
          width: 100%;
        }

        .cp-card {
          background: #ffffff;
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 2px 20px rgba(27, 94, 32, 0.08);
          border: 1px solid #e8f5e9;
          animation: up-fadeup 0.4s ease both;
        }

        .cp-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 32px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e8f5e9;
        }

        .cp-header-icon {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #2E7D32, #43A047);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
        }

        .cp-header h1 {
          font-family: 'DM Serif Display', serif;
          font-size: 1.6rem;
          color: #1a3d2b;
          margin: 0;
        }

        .cp-header p {
          margin: 2px 0 0;
          font-size: 0.85rem;
          color: #78909c;
        }

        /* ── Location Bar ── */
        .cp-location-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: ${hasLocation ? '#f1f8f0' : '#fff8e1'};
          border: 1.5px solid ${hasLocation ? '#c8e6c9' : '#ffcc02'};
          border-radius: 12px;
          padding: 14px 20px;
          margin-bottom: 28px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .cp-location-info {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
        }

        .cp-location-info .status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .cp-location-info .status-dot.active {
          background: #43A047;
        }

        .cp-location-info .status-dot.inactive {
          background: #ef5350;
        }

        .cp-location-text {
          font-size: 0.9rem;
          color: #37474f;
        }

        .cp-location-text .highlight {
          font-weight: 600;
          color: #2E7D32;
        }

        .cp-location-text .highlight-warning {
          font-weight: 600;
          color: #e65100;
        }

        .cp-location-address {
          font-size: 0.85rem;
          color: #546e7a;
          margin-top: 2px;
        }

        .cp-location-address strong {
          color: #263238;
        }

        .cp-edit-btn {
          padding: 8px 18px;
          background: linear-gradient(135deg, #1565C0, #1E88E5);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: opacity 0.2s, transform 0.15s;
          white-space: nowrap;
        }

        .cp-edit-btn:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }

        .cp-edit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        /* ── Form ── */
        .cp-form-group {
          margin-bottom: 22px;
        }

        .cp-form-label {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          color: #37474f;
          margin-bottom: 6px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .cp-form-label .required {
          color: #ef5350;
        }

        .cp-form-input,
        .cp-form-select,
        .cp-form-textarea {
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

        .cp-form-input:focus,
        .cp-form-select:focus,
        .cp-form-textarea:focus {
          outline: none;
          border-color: #66BB6A;
          box-shadow: 0 0 0 4px rgba(46, 125, 50, 0.1);
          background: #fff;
        }

        .cp-form-textarea {
          resize: vertical;
          min-height: 100px;
        }

        .cp-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }

        /* ── File Upload ── */
        .cp-upload-area {
          border: 2px dashed #c8e6c9;
          border-radius: 12px;
          padding: 30px;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
          background: #fafffa;
        }

        .cp-upload-area:hover {
          border-color: #66BB6A;
          background: #f1f8f0;
        }

        .cp-upload-area .icon-wrapper {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .cp-upload-area .icon-wrapper svg {
          color: #66BB6A;
        }

        .cp-upload-area p {
          margin: 0;
          font-size: 0.9rem;
          color: #78909c;
        }

        .cp-upload-area .sub {
          font-size: 0.78rem;
          color: #a5b8a5;
        }

        .cp-media-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 14px;
          margin-top: 16px;
        }

        .cp-media-item {
          position: relative;
          border-radius: 10px;
          overflow: hidden;
          aspect-ratio: 1;
          background: #e8f5e9;
          border: 1.5px solid #c8e6c9;
        }

        .cp-media-item img,
        .cp-media-item video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .cp-media-item .media-type-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          background: rgba(0, 0, 0, 0.7);
          color: #fff;
          font-size: 0.65rem;
          padding: 2px 10px;
          border-radius: 12px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .cp-media-item .remove-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: none;
          background: rgba(239, 83, 80, 0.9);
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.15s, background 0.2s;
        }

        .cp-media-item .remove-btn:hover {
          transform: scale(1.1);
          background: #ef5350;
        }

        .cp-media-item .file-size {
          position: absolute;
          bottom: 8px;
          right: 8px;
          background: rgba(0, 0, 0, 0.6);
          color: #fff;
          font-size: 0.6rem;
          padding: 2px 8px;
          border-radius: 8px;
        }

        .cp-media-item .file-name {
          position: absolute;
          bottom: 8px;
          left: 8px;
          right: 60px;
          background: rgba(0, 0, 0, 0.6);
          color: #fff;
          font-size: 0.6rem;
          padding: 2px 8px;
          border-radius: 8px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ── Checkbox ── */
        .cp-checkbox-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 0;
        }

        .cp-checkbox-wrap input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: #2E7D32;
          cursor: pointer;
        }

        .cp-checkbox-wrap label {
          font-size: 0.92rem;
          color: #37474f;
          cursor: pointer;
        }

        /* ── Buttons ── */
        .cp-actions {
          display: flex;
          gap: 14px;
          margin-top: 8px;
        }

        .cp-btn {
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

        .cp-btn:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }

        .cp-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .cp-btn-primary {
          background: linear-gradient(135deg, #2E7D32, #43A047);
          color: #fff;
          box-shadow: 0 4px 16px rgba(46, 125, 50, 0.25);
        }

        .cp-btn-primary-disabled {
          background: #a5b8a5;
          color: #fff;
          cursor: not-allowed;
          box-shadow: none;
        }

        .cp-btn-primary-disabled:hover {
          opacity: 1;
          transform: none;
        }

        .cp-btn-secondary {
          background: #e8f5e9;
          color: #2E7D32;
          border: 1.5px solid #c8e6c9;
        }

        /* ── Alerts ── */
        .cp-alert {
          padding: 14px 18px;
          border-radius: 10px;
          margin-bottom: 20px;
          font-size: 0.92rem;
          display: flex;
          align-items: center;
          gap: 10px;
          animation: slideDown 0.3s ease both;
        }

        .cp-alert-error {
          background: #ffebee;
          border-left: 4px solid #ef5350;
          color: #c62828;
        }

        .cp-alert-success {
          background: #e8f5e9;
          border-left: 4px solid #43A047;
          color: #2E7D32;
        }

        .cp-alert-warning {
          background: #fff8e1;
          border-left: 4px solid #ffa726;
          color: #e65100;
        }

        @media (max-width: 640px) {
          .cp-card { padding: 24px 18px; }
          .cp-form-row { grid-template-columns: 1fr; gap: 0; }
          .cp-actions { flex-direction: column; }
          .cp-location-bar { flex-direction: column; align-items: stretch; }
          .cp-header { flex-direction: column; align-items: flex-start; }
          .cp-media-grid { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); }
          .cp-root { padding: 16px; }
        }
      `}</style>

      <div className="cp-root">
        <div className="cp-container">
          <div className="cp-card">

            {/* ── Header ── */}
            <div className="cp-header">
              <div className="cp-header-icon">
                <PlusIcon size={22} />
              </div>
              <div>
                <h1>List New Product</h1>
                <p>Share your harvest with the community</p>
              </div>
            </div>

            {/* ── Location Bar ── */}
            <div className="cp-location-bar">
              <div className="cp-location-info">
                <span className={`status-dot ${hasLocation ? 'active' : 'inactive'}`} />
                <div>
                  <span className="cp-location-text">
                    {hasLocation ? (
                      <>✅ Location: <span className="highlight">Set</span></>
                    ) : (
                      <>⚠️ <span className="highlight-warning">Location required!</span> Please update your profile</>
                    )}
                  </span>
                  {hasLocation && locationDetails && (
                    <div className="cp-location-address">
                      📍 <strong>{locationDetails.barangay}</strong>, {locationDetails.city}
                      {locationDetails.street && ` • ${locationDetails.street}`}
                    </div>
                  )}
                  {!hasLocation && (
                    <div className="cp-location-address" style={{ color: '#e65100' }}>
                      You need to set your location in your profile before creating products.
                    </div>
                  )}
                </div>
              </div>
              <button
                className="cp-edit-btn"
                onClick={handleEditProfile}
              >
                <EditIcon size={16} /> {hasLocation ? 'Update Profile' : 'Edit Profile'}
              </button>
            </div>

            {/* ── Alerts ── */}
            {error && (
              <div className="cp-alert cp-alert-error">
                <AlertTriangleIcon size={20} /> {error}
              </div>
            )}
            {success && (
              <div className="cp-alert cp-alert-success">
                <CheckIcon size={18} /> {success}
              </div>
            )}

            {/* ── Form ── */}
            <form onSubmit={handleSubmit}>
              {/* Product Name */}
              <div className="cp-form-group">
                <label className="cp-form-label">Product Name <span className="required">*</span></label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="cp-form-input"
                  placeholder="e.g., Fresh Organic Tomatoes"
                />
              </div>

              {/* Description */}
              <div className="cp-form-group">
                <label className="cp-form-label">Description <span className="required">*</span></label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows="4"
                  className="cp-form-textarea"
                  placeholder="Describe your product in detail..."
                />
              </div>

              {/* Price & Quantity */}
              <div className="cp-form-row">
                <div className="cp-form-group">
                  <label className="cp-form-label">Price (₱) <span className="required">*</span></label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="cp-form-input"
                    placeholder="0.00"
                  />
                </div>
                <div className="cp-form-group">
                  <label className="cp-form-label">Quantity <span className="required">*</span></label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                    min="0"
                    className="cp-form-input"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Category & Unit */}
              <div className="cp-form-row">
                <div className="cp-form-group">
                  <label className="cp-form-label">Category <span className="required">*</span></label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="cp-form-select"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="cp-form-group">
                  <label className="cp-form-label">Unit <span className="required">*</span></label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    required
                    className="cp-form-select"
                  >
                    {units.map(unit => (
                      <option key={unit.value} value={unit.value}>{unit.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Media Upload - Images & Videos */}
              <div className="cp-form-group">
                <label className="cp-form-label">
                  Product Media <span style={{ fontWeight: 400, textTransform: 'none', color: '#78909c' }}>
                    (Images & Videos, Max 5 files)
                  </span>
                </label>
                <div className="cp-upload-area" onClick={() => document.getElementById('mediaUpload').click()}>
                  <div className="icon-wrapper">
                    <ImageIcon size={32} />
                    <VideoIcon size={32} />
                  </div>
                  <p>Click to upload images or videos</p>
                  <span className="sub">PNG, JPG, JPEG, MP4, WebM, MOV • Max 100MB each</span>
                </div>
                <input
                  id="mediaUpload"
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleMediaChange}
                  style={{ display: 'none' }}
                />
                
                {mediaPreviews.length > 0 && (
                  <div className="cp-media-grid">
                    {mediaPreviews.map((preview, index) => (
                      <div key={index} className="cp-media-item">
                        {preview.type === 'video' ? (
                          <video src={preview.url} muted />
                        ) : (
                          <img src={preview.url} alt={`Preview ${index + 1}`} />
                        )}
                        <span className="media-type-badge">{preview.type}</span>
                        <span className="file-name">{preview.name}</span>
                        <span className="file-size">{formatFileSize(preview.size)}</span>
                        <button
                          type="button"
                          className="remove-btn"
                          onClick={() => handleRemoveMedia(index)}
                        >
                          <CloseIcon size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Availability */}
              <div className="cp-checkbox-wrap">
                <input
                  type="checkbox"
                  id="isAvailable"
                  name="isAvailable"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                />
                <label htmlFor="isAvailable">Available for sale</label>
              </div>

              {/* Actions */}
              <div className="cp-actions">
                <button
                  type="submit"
                  disabled={loading || !hasLocation}
                  className={`cp-btn ${hasLocation ? 'cp-btn-primary' : 'cp-btn-primary-disabled'}`}
                >
                  {loading ? 'Creating...' : 'Create Product'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/farmer/products')}
                  className="cp-btn cp-btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProduct;