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

  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

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
        setExistingImages(product.images || []);
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

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    setImages(files);
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
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

      images.forEach(image => {
        formDataToSend.append('images', image);
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
      <>
        <FarmerHeader />
        <style>{`
          @keyframes up-spin { to { transform: rotate(360deg); } }
        `}</style>
        <div style={{
          minHeight: '100vh',
          background: '#f5f7f5',
          paddingTop: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #c8e6c9',
              borderTopColor: '#2E7D32',
              borderRadius: '50%',
              animation: 'up-spin 0.9s linear infinite',
              margin: '0 auto 16px'
            }} />
            <p style={{ color: '#546e7a', fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem' }}>
              Loading product...
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
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
          min-height: 100vh;
          background: #f5f7f5;
          padding-top: 80px;
        }

        .upd-container {
          max-width: 820px;
          margin: 0 auto;
          padding: 32px 20px 60px;
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

        /* ── Existing Images ── */
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
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 12px;
          margin-bottom: 22px;
        }

        .upd-existing-img {
          border-radius: 10px;
          overflow: hidden;
          aspect-ratio: 1;
          background: #e8f5e9;
          border: 1.5px solid #c8e6c9;
        }

        .upd-existing-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
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

        .upd-upload-area .icon {
          color: #66BB6A;
          margin-bottom: 6px;
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

        .upd-image-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 12px;
          margin-top: 16px;
        }

        .upd-image-preview {
          border-radius: 10px;
          overflow: hidden;
          aspect-ratio: 1;
          background: #e8f5e9;
        }

        .upd-image-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
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
              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div className="upd-form-group">
                  <label className="upd-section-title">Current Images</label>
                  <div className="upd-existing-grid">
                    {existingImages.map((img, index) => (
                      <div key={index} className="upd-existing-img">
                        <img src={img.url} alt={`Product ${index + 1}`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Images */}
              <div className="upd-form-group">
                <label className="upd-form-label">New Images <span style={{ fontWeight: 400, textTransform: 'none', color: '#78909c' }}>(Optional, Max 5)</span></label>
                <div className="upd-upload-area" onClick={() => document.getElementById('imageUpload').click()}>
                  <div className="icon"><ImageIcon size={32} /></div>
                  <p>Click to upload new images</p>
                  <span className="sub">PNG, JPG, JPEG • Max 5MB each</span>
                </div>
                <input
                  id="imageUpload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                {imagePreviews.length > 0 && (
                  <div className="upd-image-grid">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="upd-image-preview">
                        <img src={preview} alt={`Preview ${index + 1}`} />
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
    </>
  );
};

export default UpdateProduct;