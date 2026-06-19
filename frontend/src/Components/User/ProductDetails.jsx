import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import UserHeader from '../layouts/Header';

// ── Icons ───────────────────────────────────────────────────────────────
const ArrowLeftIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);

const MapPinIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const MessageIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const ShoppingCartIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/>
    <circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);

const ClockIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const CheckIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5"/>
  </svg>
);

const AlertTriangleIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const CreditCardIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);

// ── Component ───────────────────────────────────────────────────────────
const ProductDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/v1/products/${id}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : {}
        }
      });

      const data = await response.json();

      if (response.ok) {
        setProduct(data.product);
      } else {
        setError(data.message || 'Failed to fetch product details');
      }
    } catch (err) {
      console.error('Fetch product error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate('/products');
  };

  const handleViewOnMap = () => {
    if (product?.location) {
      navigate('/maps', {
        state: {
          location: product.location,
          product: {
            id: product._id,
            name: product.name,
            price: product.price,
            description: product.description,
            farmer: product.farmer?.name || 'Unknown Farmer'
          }
        }
      });
    }
  };

  const handleMessage = () => {
    if (product?.farmer?._id) {
      navigate('/messages', {
        state: {
          farmerId: product.farmer._id,
          farmerName: product.farmer.name,
          productName: product.name
        }
      });
    } else {
      navigate('/messages', {
        state: {
          productId: product._id,
          productName: product.name,
          farmerName: product.farmer?.name || 'Farmer'
        }
      });
    }
  };

  const handleAddToCart = () => {
    alert('Add to Cart functionality coming soon!');
  };

  const handlePurchase = () => {
    alert('Purchase functionality coming soon!');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getProductImage = (image) => {
    if (!image) return null;
    return image.url?.startsWith('http') ? image.url : `${API_BASE_URL}${image.url}`;
  };

  const getFarmerAvatar = (product) => {
    if (product?.farmerAvatar) {
      return product.farmerAvatar.startsWith('http') ? product.farmerAvatar : `${API_BASE_URL}${product.farmerAvatar}`;
    }
    if (product?.farmer?.avatar?.url) {
      return product.farmer.avatar.url.startsWith('http') ? product.farmer.avatar.url : `${API_BASE_URL}${product.farmer.avatar.url}`;
    }
    if (product?.farmer?.profilePicture?.url) {
      return product.farmer.profilePicture.url.startsWith('http') ? product.farmer.profilePicture.url : `${API_BASE_URL}${product.farmer.profilePicture.url}`;
    }
    return null;
  };

  const getFarmerInitial = (name) => {
    return name?.charAt(0)?.toUpperCase() || 'F';
  };

  const getLocationDisplay = () => {
    if (!product) return null;
    if (product.location?.address) {
      return product.location.address;
    }
    if (product.location?.fullAddress) {
      return product.location.fullAddress;
    }
    if (product.location?.barangay && product.location?.city) {
      return `${product.location.barangay}, ${product.location.city}`;
    }
    if (product.farmerAddress?.barangay && product.farmerAddress?.city) {
      return `${product.farmerAddress.barangay}, ${product.farmerAddress.city}`;
    }
    return null;
  };

  const nextImage = () => {
    if (product?.images?.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (product?.images?.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  };

  // ── Loading State ──
  if (loading) {
    return (
      <>
        <UserHeader />
        <style>{`
          @keyframes pd-spin { to { transform: rotate(360deg); } }
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
              animation: 'pd-spin 0.9s linear infinite',
              margin: '0 auto 16px'
            }} />
            <p style={{ color: '#546e7a', fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem' }}>
              Loading product details...
            </p>
          </div>
        </div>
      </>
    );
  }

  // ── Error State ──
  if (error || !product) {
    return (
      <>
        <UserHeader />
        <div style={{
          minHeight: '100vh',
          background: '#f5f7f5',
          paddingTop: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            textAlign: 'center',
            background: '#fff',
            padding: '40px',
            borderRadius: '16px',
            maxWidth: '400px',
            border: '1px solid #ffebee'
          }}>
            <AlertTriangleIcon size={48} style={{ color: '#ef5350' }} />
            <h3 style={{ color: '#c62828', margin: '16px 0 8px' }}>
              {error || 'Product not found'}
            </h3>
            <p style={{ color: '#78909c' }}>
              The product you're looking for might have been removed or is no longer available.
            </p>
            <button
              onClick={handleGoBack}
              style={{
                marginTop: '20px',
                padding: '10px 28px',
                background: 'linear-gradient(135deg, #2E7D32, #43A047)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.opacity = '0.85'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              Back to Products
            </button>
          </div>
        </div>
      </>
    );
  }

  const farmerAvatar = getFarmerAvatar(product);
  const farmerName = product.farmer?.name || 'Unknown Farmer';
  const locationDisplay = getLocationDisplay();

  return (
    <>
      <UserHeader />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        @keyframes pd-fadeup {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pd-spin {
          to { transform: rotate(360deg); }
        }

        .pd-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          background: #f5f7f5;
          padding-top: 80px;
        }

        .pd-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 20px 60px;
        }

        /* ── Back Button ── */
        .pd-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: #fff;
          border: 1.5px solid #e0e7e0;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          color: #546e7a;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 24px;
        }

        .pd-back-btn:hover {
          border-color: #66BB6A;
          color: #2E7D32;
          transform: translateX(-4px);
        }

        /* ── Product Card ── */
        .pd-card {
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          border: 1.5px solid #e8f5e9;
          box-shadow: 0 2px 20px rgba(27, 94, 32, 0.08);
          animation: pd-fadeup 0.4s ease both;
        }

        .pd-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
        }

        /* ── Image Gallery ── */
        .pd-gallery {
          background: #fafffa;
          position: relative;
          min-height: 500px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pd-gallery-image {
          width: 100%;
          height: 500px;
          object-fit: cover;
        }

        .pd-gallery .no-image {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 500px;
          color: #a5b8a5;
          font-size: 1rem;
        }

        .pd-gallery .no-image .icon {
          margin-bottom: 12px;
          color: #c8e6c9;
        }

        .pd-gallery-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0, 0, 0, 0.5);
          color: #fff;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
          font-size: 18px;
        }

        .pd-gallery-nav:hover {
          background: rgba(0, 0, 0, 0.7);
        }

        .pd-gallery-nav.prev {
          left: 12px;
        }

        .pd-gallery-nav.next {
          right: 12px;
        }

        .pd-gallery-dots {
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
        }

        .pd-gallery-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pd-gallery-dot.active {
          background: #fff;
          transform: scale(1.3);
        }

        /* ── Product Info ── */
        .pd-info {
          padding: 32px 36px;
          display: flex;
          flex-direction: column;
        }

        .pd-info-category {
          display: inline-block;
          padding: 4px 14px;
          background: #e8f5e9;
          color: #2E7D32;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 12px;
          align-self: flex-start;
        }

        .pd-info-name {
          font-family: 'DM Serif Display', serif;
          font-size: 1.8rem;
          color: #1a3d2b;
          margin: 0 0 8px;
        }

        .pd-info-price {
          font-family: 'DM Serif Display', serif;
          font-size: 2rem;
          color: #2E7D32;
          margin: 0 0 16px;
        }

        .pd-info-description {
          font-size: 0.95rem;
          color: #546e7a;
          line-height: 1.7;
          margin: 0 0 20px;
          padding: 16px 0;
          border-top: 1px solid #e8f5e9;
          border-bottom: 1px solid #e8f5e9;
        }

        .pd-info-meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 20px;
        }

        .pd-meta-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .pd-meta-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #90a4ae;
          font-weight: 600;
        }

        .pd-meta-value {
          font-size: 0.92rem;
          color: #263238;
          font-weight: 500;
        }

        .pd-info-farmer {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: #f1f8f0;
          border-radius: 10px;
          margin-bottom: 12px;
        }

        .pd-farmer-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          overflow: hidden;
          background: #e8f5e9;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .pd-farmer-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .pd-farmer-avatar .fallback {
          font-family: 'DM Serif Display', serif;
          font-size: 1.2rem;
          font-weight: 700;
          color: #2E7D32;
        }

        .pd-farmer-info {
          flex: 1;
        }

        .pd-farmer-name {
          font-weight: 600;
          color: #263238;
          font-size: 0.95rem;
          margin: 0;
        }

        .pd-farmer-role {
          font-size: 0.78rem;
          color: #78909c;
          margin: 0;
        }

        .pd-info-location {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          background: #e3f2fd;
          border-radius: 10px;
          margin-bottom: 20px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .pd-info-location:hover {
          background: #bbdefb;
        }

        .pd-info-location .location-text {
          font-size: 0.88rem;
          color: #0d47a1;
          flex: 1;
        }

        .pd-info-location .location-text strong {
          font-weight: 600;
        }

        .pd-info-actions {
          display: flex;
          gap: 12px;
          margin-top: auto;
          padding-top: 20px;
          border-top: 1px solid #e8f5e9;
        }

        .pd-action-btn {
          flex: 1;
          padding: 12px 20px;
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: opacity 0.2s, transform 0.15s;
        }

        .pd-action-btn:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }

        .pd-action-btn.message {
          background: linear-gradient(135deg, #1565C0, #1E88E5);
          color: #fff;
          box-shadow: 0 4px 16px rgba(21, 101, 192, 0.25);
        }

        .pd-action-btn.cart {
          background: linear-gradient(135deg, #0277bd, #0288d1);
          color: #fff;
          box-shadow: 0 4px 16px rgba(2, 119, 189, 0.25);
        }

        .pd-action-btn.purchase {
          background: linear-gradient(135deg, #2E7D32, #43A047);
          color: #fff;
          box-shadow: 0 4px 16px rgba(46, 125, 50, 0.25);
        }

        /* ── Status Badge ── */
        .pd-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 14px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .pd-status-badge.available {
          background: #e8f5e9;
          color: #2E7D32;
        }

        .pd-status-badge.unavailable {
          background: #ffebee;
          color: #c62828;
        }

        /* ── Responsive ── */
        @media (max-width: 968px) {
          .pd-content {
            grid-template-columns: 1fr;
          }
          .pd-gallery {
            min-height: 300px;
          }
          .pd-gallery-image {
            height: 350px;
          }
          .pd-gallery .no-image {
            height: 350px;
          }
          .pd-info {
            padding: 24px;
          }
        }

        @media (max-width: 640px) {
          .pd-info-meta {
            grid-template-columns: 1fr;
          }
          .pd-info-actions {
            flex-direction: column;
          }
          .pd-info-name {
            font-size: 1.4rem;
          }
          .pd-info-price {
            font-size: 1.6rem;
          }
          .pd-gallery-image {
            height: 250px;
          }
          .pd-gallery .no-image {
            height: 250px;
          }
          .pd-gallery-nav {
            width: 32px;
            height: 32px;
            font-size: 14px;
          }
        }
      `}</style>

      <div className="pd-root">
        <div className="pd-container">
          {/* ── Back Button ── */}
          <button className="pd-back-btn" onClick={handleGoBack}>
            <ArrowLeftIcon size={18} /> Back to Products
          </button>

          {/* ── Product Details ── */}
          <div className="pd-card">
            <div className="pd-content">
              {/* ── Image Gallery ── */}
              <div className="pd-gallery">
                {product.images && product.images.length > 0 ? (
                  <>
                    <img
                      src={getProductImage(product.images[currentImageIndex])}
                      alt={product.name}
                      className="pd-gallery-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `
                          <div class="no-image">
                            <div class="icon"><ShoppingCartIcon size={48} /></div>
                            <p>No Image Available</p>
                          </div>
                        `;
                      }}
                    />
                    {product.images.length > 1 && (
                      <>
                        <button className="pd-gallery-nav prev" onClick={prevImage}>
                          ‹
                        </button>
                        <button className="pd-gallery-nav next" onClick={nextImage}>
                          ›
                        </button>
                        <div className="pd-gallery-dots">
                          {product.images.map((_, index) => (
                            <button
                              key={index}
                              className={`pd-gallery-dot ${index === currentImageIndex ? 'active' : ''}`}
                              onClick={() => setCurrentImageIndex(index)}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="no-image">
                    <div className="icon"><ShoppingCartIcon size={48} /></div>
                    <p>No Image Available</p>
                  </div>
                )}
              </div>

              {/* ── Product Info ── */}
              <div className="pd-info">
                <span className="pd-info-category">{product.category}</span>
                
                <div className="pd-status-badge available">
                  <CheckIcon size={14} /> Available
                </div>

                <h1 className="pd-info-name">{product.name}</h1>
                <div className="pd-info-price">₱{Number(product.price).toFixed(2)}</div>

                <p className="pd-info-description">{product.description}</p>

                <div className="pd-info-meta">
                  <div className="pd-meta-item">
                    <span className="pd-meta-label">Quantity</span>
                    <span className="pd-meta-value">{product.quantity} {product.unit}</span>
                  </div>
                  <div className="pd-meta-item">
                    <span className="pd-meta-label">Posted</span>
                    <span className="pd-meta-value">{formatDate(product.createdAt)}</span>
                  </div>
                  <div className="pd-meta-item">
                    <span className="pd-meta-label">Unit</span>
                    <span className="pd-meta-value">{product.unit}</span>
                  </div>
                  <div className="pd-meta-item">
                    <span className="pd-meta-label">Category</span>
                    <span className="pd-meta-value">{product.category}</span>
                  </div>
                </div>

                {/* ── Farmer Info ── */}
                <div className="pd-info-farmer">
                  <div className="pd-farmer-avatar">
                    {farmerAvatar ? (
                      <img src={farmerAvatar} alt={farmerName} />
                    ) : (
                      <span className="fallback">{getFarmerInitial(farmerName)}</span>
                    )}
                  </div>
                  <div className="pd-farmer-info">
                    <p className="pd-farmer-name">{farmerName}</p>
                  </div>
                  <button
                    className="pd-action-btn message"
                    onClick={handleMessage}
                    style={{ flex: 'none', padding: '6px 16px', fontSize: '0.78rem' }}
                  >
                    <MessageIcon size={14} /> Message
                  </button>
                </div>

                {/* ── Location ── */}
                {locationDisplay && (
                  <div className="pd-info-location" onClick={handleViewOnMap}>
                    <MapPinIcon size={18} color="#0d47a1" />
                    <span className="location-text">
                      <strong>Location:</strong> {locationDisplay}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#0d47a1', fontWeight: 600 }}>
                      View on Map →
                    </span>
                  </div>
                )}

                {/* ── Actions ── */}
                <div className="pd-info-actions">
                  <button
                    className="pd-action-btn cart"
                    onClick={handleAddToCart}
                  >
                    <ShoppingCartIcon size={18} /> Add to Cart
                  </button>
                  <button
                    className="pd-action-btn purchase"
                    onClick={handlePurchase}
                  >
                    <CreditCardIcon size={18} /> Purchase
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetails;