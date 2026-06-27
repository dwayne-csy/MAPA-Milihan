import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import FarmerHeader from '../../layouts/FarmerHeader';

// ── Icons ───────────────────────────────────────────────────────────────
const SaveIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
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

// ── Component ───────────────────────────────────────────────────────────
const UpdateProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
  const [existingMedia, setExistingMedia] = useState([]);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  // ── Categories and Units ──────────────────────────────────────────────
  const categories = ['Fruits', 'Vegetables', 'Grains', 'Livestock', 'Others'];
  const units = [
    { value: 'kg', label: 'Per Kilo (KG)' },
    { value: 'tray', label: 'Per Tray (tray)' },
    { value: 'sack', label: 'Per Sack (sack)' },
    { value: 'pc', label: 'Per Piece (pc)' },
    { value: 'L', label: 'Per Liter (L)' }
  ];

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/v1/products/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        const product = data.product;
        setFormData({
          name: product.name || '',
          description: product.description || '',
          price: product.price || '',
          quantity: product.quantity || '',
          category: product.category || 'Vegetables',
          unit: product.unit || 'kg',
          isAvailable: product.isAvailable !== undefined ? product.isAvailable : true
        });
        setExistingMedia(product.images || []);
      } else {
        setError(data.message || 'Failed to fetch product');
      }
    } catch (err) {
      console.error('Fetch product error:', err);
      setError('Network error. Please try again.');
    } finally {
      setFetching(false);
    }
  };

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
    
    URL.revokeObjectURL(newPreviews[index].url);
    
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setMediaFiles(newFiles);
    setMediaPreviews(newPreviews);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();

      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('quantity', formData.quantity);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('unit', formData.unit);
      formDataToSend.append('isAvailable', formData.isAvailable);

      mediaFiles.forEach(file => {
        formDataToSend.append('images', file);
      });

      const response = await fetch(`${API_BASE_URL}/api/v1/products/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Product updated successfully!');
        setTimeout(() => navigate('/farmer/products'), 1500);
      } else {
        setError(data.message || 'Failed to update product');
      }
    } catch (err) {
      console.error('Update product error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="full-bleed w-full min-h-screen bg-[#f5f7f5] flex flex-col">
        <FarmerHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#c8e6c9] border-t-[#2E7D32] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#546e7a] font-['DM_Sans'] text-sm">Loading product...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="full-bleed w-full min-h-screen bg-[#f5f7f5] flex flex-col">
      <FarmerHeader />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        @keyframes up-fadeup {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .upd-root {
          font-family: 'DM Sans', sans-serif;
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 20px;
        }

        .upd-container {
          max-width: 820px;
          width: 100%;
        }

        .upd-card {
          background: #ffffff;
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 2px 20px rgba(27, 94, 32, 0.08);
          border: 1px solid #e8f5e9;
          animation: up-fadeup 0.4s ease both;
        }

        .upd-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 32px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e8f5e9;
        }

        .upd-header-icon {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #1565C0, #1E88E5);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
        }

        .upd-header h1 {
          font-family: 'DM Serif Display', serif;
          font-size: 1.6rem;
          color: #1a3d2b;
          margin: 0;
        }

        .upd-header p {
          margin: 2px 0 0;
          font-size: 0.85rem;
          color: #78909c;
        }

        /* ── Existing Media ── */
        .upd-section-title {
          font-size: 0.8rem;
          font-weight: 600;
          color: #37474f;
          margin-bottom: 10px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .upd-existing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 12px;
          margin-bottom: 22px;
        }

        .upd-existing-item {
          border-radius: 10px;
          overflow: hidden;
          aspect-ratio: 1;
          background: #e8f5e9;
          border: 1.5px solid #c8e6c9;
          position: relative;
        }

        .upd-existing-item img,
        .upd-existing-item video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .upd-existing-item .media-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          background: rgba(0, 0, 0, 0.7);
          color: #fff;
          font-size: 0.6rem;
          padding: 2px 10px;
          border-radius: 12px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        /* ── Form ── */
        .upd-form-group {
          margin-bottom: 22px;
        }

        .upd-form-label {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          color: #37474f;
          margin-bottom: 6px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .upd-form-label .required {
          color: #ef5350;
        }

        .upd-form-input,
        .upd-form-select,
        .upd-form-textarea {
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

        .upd-form-input:focus,
        .upd-form-select:focus,
        .upd-form-textarea:focus {
          outline: none;
          border-color: #66BB6A;
          box-shadow: 0 0 0 4px rgba(46, 125, 50, 0.1);
          background: #fff;
        }

        .upd-form-textarea {
          resize: vertical;
          min-height: 100px;
        }

        .upd-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }

        /* ── Upload ── */
        .upd-upload-area {
          border: 2px dashed #c8e6c9;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
          background: #fafffa;
        }

        .upd-upload-area:hover {
          border-color: #66BB6A;
          background: #f1f8f0;
        }

        .upd-upload-area .icon-wrapper {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-bottom: 6px;
        }

        .upd-upload-area .icon-wrapper svg {
          color: #66BB6A;
        }

        .upd-upload-area p {
          margin: 0;
          font-size: 0.9rem;
          color: #78909c;
        }

        .upd-upload-area .sub {
          font-size: 0.78rem;
          color: #a5b8a5;
        }

        .upd-media-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 12px;
          margin-top: 16px;
        }

        .upd-media-item {
          position: relative;
          border-radius: 10px;
          overflow: hidden;
          aspect-ratio: 1;
          background: #e8f5e9;
          border: 1.5px solid #c8e6c9;
        }

        .upd-media-item img,
        .upd-media-item video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .upd-media-item .media-type-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          background: rgba(0, 0, 0, 0.7);
          color: #fff;
          font-size: 0.6rem;
          padding: 2px 10px;
          border-radius: 12px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .upd-media-item .remove-btn {
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

        .upd-media-item .remove-btn:hover {
          transform: scale(1.1);
          background: #ef5350;
        }

        .upd-media-item .file-size {
          position: absolute;
          bottom: 8px;
          right: 8px;
          background: rgba(0, 0, 0, 0.6);
          color: #fff;
          font-size: 0.6rem;
          padding: 2px 8px;
          border-radius: 8px;
        }

        .upd-media-item .file-name {
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
        .upd-checkbox-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 0;
        }

        .upd-checkbox-wrap input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: #2E7D32;
          cursor: pointer;
        }

        .upd-checkbox-wrap label {
          font-size: 0.92rem;
          color: #37474f;
          cursor: pointer;
        }

        /* ── Alerts ── */
        .upd-alert {
          padding: 14px 18px;
          border-radius: 10px;
          margin-bottom: 20px;
          font-size: 0.92rem;
          display: flex;
          align-items: center;
          gap: 10px;
          animation: slideDown 0.3s ease both;
        }

        .upd-alert-error {
          background: #ffebee;
          border-left: 4px solid #ef5350;
          color: #c62828;
        }

        .upd-alert-success {
          background: #e8f5e9;
          border-left: 4px solid #43A047;
          color: #2E7D32;
        }

        /* ── Buttons ── */
        .upd-actions {
          display: flex;
          gap: 14px;
          margin-top: 8px;
        }

        .upd-btn {
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

        .upd-btn:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }

        .upd-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .upd-btn-primary {
          background: linear-gradient(135deg, #1565C0, #1E88E5);
          color: #fff;
          box-shadow: 0 4px 16px rgba(21, 101, 192, 0.25);
        }

        .upd-btn-secondary {
          background: #e8f5e9;
          color: #2E7D32;
          border: 1.5px solid #c8e6c9;
        }

        @media (max-width: 640px) {
          .upd-card { padding: 24px 18px; }
          .upd-form-row { grid-template-columns: 1fr; gap: 0; }
          .upd-actions { flex-direction: column; }
          .upd-header { flex-direction: column; align-items: flex-start; }
          .upd-existing-grid,
          .upd-media-grid { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); }
          .upd-root { padding: 16px; }
        }
      `}</style>

      <div className="upd-root">
        <div className="upd-container">
          <div className="upd-card">

            {/* ── Header ── */}
            <div className="upd-header">
              <div className="upd-header-icon">
                <SaveIcon size={22} />
              </div>
              <div>
                <h1>Update Product</h1>
                <p>Edit your product details</p>
              </div>
            </div>

            {/* ── Alerts ── */}
            {error && (
              <div className="upd-alert upd-alert-error">
                {error}
              </div>
            )}
            {success && (
              <div className="upd-alert upd-alert-success">
                {success}
              </div>
            )}

            {/* ── Form ── */}
            <form onSubmit={handleSubmit}>
              {/* Existing Media */}
              {existingMedia.length > 0 && (
                <div className="upd-form-group">
                  <label className="upd-section-title">Current Media</label>
                  <div className="upd-existing-grid">
                    {existingMedia.map((media, index) => {
                      const isVideo = media.url && (
                        media.url.includes('.mp4') || 
                        media.url.includes('.webm') || 
                        media.url.includes('.mov') ||
                        media.url.includes('.avi')
                      );
                      return (
                        <div key={index} className="upd-existing-item">
                          {isVideo ? (
                            <video src={media.url} muted />
                          ) : (
                            <img src={media.url} alt={`Media ${index + 1}`} />
                          )}
                          <span className="media-badge">{isVideo ? 'Video' : 'Image'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* New Media Upload */}
              <div className="upd-form-group">
                <label className="upd-form-label">
                  New Media <span style={{ fontWeight: 400, textTransform: 'none', color: '#78909c' }}>
                    (Optional, Max 5 files)
                  </span>
                </label>
                <div className="upd-upload-area" onClick={() => document.getElementById('mediaUpload').click()}>
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
                  <div className="upd-media-grid">
                    {mediaPreviews.map((preview, index) => (
                      <div key={index} className="upd-media-item">
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

              {/* Product Name */}
              <div className="upd-form-group">
                <label className="upd-form-label">Product Name <span className="required">*</span></label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="upd-form-input"
                />
              </div>

              {/* Description */}
              <div className="upd-form-group">
                <label className="upd-form-label">Description <span className="required">*</span></label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows="4"
                  className="upd-form-textarea"
                />
              </div>

              {/* Price & Quantity */}
              <div className="upd-form-row">
                <div className="upd-form-group">
                  <label className="upd-form-label">Price (₱) <span className="required">*</span></label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="upd-form-input"
                  />
                </div>
                <div className="upd-form-group">
                  <label className="upd-form-label">Quantity <span className="required">*</span></label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                    min="0"
                    className="upd-form-input"
                  />
                </div>
              </div>

              {/* Category & Unit */}
              <div className="upd-form-row">
                <div className="upd-form-group">
                  <label className="upd-form-label">Category <span className="required">*</span></label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="upd-form-select"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="upd-form-group">
                  <label className="upd-form-label">Unit <span className="required">*</span></label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    required
                    className="upd-form-select"
                  >
                    {units.map(unit => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Availability */}
              <div className="upd-checkbox-wrap">
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
              <div className="upd-actions">
                <button
                  type="submit"
                  disabled={loading}
                  className="upd-btn upd-btn-primary"
                >
                  {loading ? 'Updating...' : 'Update Product'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/farmer/products')}
                  className="upd-btn upd-btn-secondary"
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

export default UpdateProduct;