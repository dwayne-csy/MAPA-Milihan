import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import UserHeader from '../layouts/Header';
import { getUnitLabel, getUnitFullLabel, getPricePerUnit, getQuantityDisplay, getStockStatus } from '../utils/unitHelpers';

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

const PlayIcon = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="12" fill="rgba(0,0,0,0.6)"/>
    <polygon points="10,8 17,12 10,16" fill="white"/>
  </svg>
);

const PauseIcon = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="12" fill="rgba(0,0,0,0.6)"/>
    <rect x="9" y="8" width="2.5" height="8" fill="white"/>
    <rect x="12.5" y="8" width="2.5" height="8" fill="white"/>
  </svg>
);

const VideoIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="2.18"/>
    <line x1="8" y1="2" x2="8" y2="22"/>
    <line x1="16" y1="2" x2="16" y2="22"/>
    <line x1="2" y1="8" x2="22" y2="8"/>
    <line x1="2" y1="16" x2="22" y2="16"/>
    <polygon points="10 10 14 12 10 14 10 10"/>
  </svg>
);

const ImageIcon = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);

// ── Helper: Check if URL is video ─────────────────────────────────────
const isVideoUrl = (url) => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mpeg', '.ogg', '.3gpp', '.flv', '.wmv'];
  const videoMimeTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
  
  if (videoExtensions.some(ext => url.toLowerCase().includes(ext))) return true;
  if (videoMimeTypes.some(mime => url.toLowerCase().includes(mime))) return true;
  if (url.includes('/video/upload/')) return true;
  
  return false;
};

// ── Component ───────────────────────────────────────────────────────────
const ProductDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef(null);

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

  const getMediaUrl = (media) => {
    if (!media) return null;
    return media.url?.startsWith('http') ? media.url : `${API_BASE_URL}${media.url}`;
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

  const nextMedia = () => {
    if (product?.images?.length > 0) {
      if (videoRef.current && isVideoPlaying) {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      }
      setCurrentMediaIndex((prev) => 
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevMedia = () => {
    if (product?.images?.length > 0) {
      if (videoRef.current && isVideoPlaying) {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      }
      setCurrentMediaIndex((prev) => 
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  };

  const toggleVideoPlay = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    
    if (isVideoPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsVideoPlaying(!isVideoPlaying);
  };

  const currentMedia = product?.images?.[currentMediaIndex] || null;
  const isVideo = currentMedia ? isVideoUrl(currentMedia.url) : false;
  const mediaCount = product?.images?.length || 0;

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
  const unitLabel = getUnitLabel(product.unit);
  const unitFullLabel = getUnitFullLabel(product.unit);
  const stockStatus = getStockStatus(Number(product.quantity) || 0);

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

        /* ── Media Gallery ── */
        .pd-gallery {
          background: #1a1a2e;
          position: relative;
          min-height: 500px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .pd-gallery-image {
          width: 100%;
          height: 500px;
          object-fit: cover;
        }

        .pd-gallery-video-wrapper {
          position: relative;
          width: 100%;
          height: 500px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #1a1a2e;
        }

        .pd-gallery-video-wrapper video {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .pd-video-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.3);
          cursor: pointer;
          transition: background 0.3s;
        }

        .pd-video-overlay:hover {
          background: rgba(0, 0, 0, 0.2);
        }

        .pd-video-overlay svg {
          transition: transform 0.3s;
        }

        .pd-video-overlay:hover svg {
          transform: scale(1.05);
        }

        .pd-video-overlay.hidden {
          opacity: 0;
          pointer-events: none;
        }

        .pd-gallery .no-media {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 500px;
          color: #a5b8a5;
          font-size: 1rem;
          background: #fafffa;
        }

        .pd-gallery .no-media .icon {
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
          width: 44px;
          height: 44px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s, transform 0.2s;
          font-size: 20px;
          z-index: 10;
          backdrop-filter: blur(4px);
        }

        .pd-gallery-nav:hover {
          background: rgba(0, 0, 0, 0.7);
          transform: translateY(-50%) scale(1.05);
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
          z-index: 5;
        }

        .pd-gallery-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.4);
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          padding: 0;
        }

        .pd-gallery-dot.active {
          background: #fff;
          transform: scale(1.3);
        }

        .pd-gallery-dot:hover {
          background: rgba(255, 255, 255, 0.7);
        }

        .pd-media-badge {
          position: absolute;
          top: 16px;
          left: 16px;
          background: rgba(0, 0, 0, 0.7);
          color: #fff;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 4px 14px;
          border-radius: 12px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          backdrop-filter: blur(4px);
          z-index: 5;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .pd-media-counter {
          position: absolute;
          bottom: 16px;
          right: 16px;
          background: rgba(0, 0, 0, 0.6);
          color: #fff;
          font-size: 0.75rem;
          padding: 4px 12px;
          border-radius: 12px;
          backdrop-filter: blur(4px);
          z-index: 5;
        }

        /* ── Thumbnail Strip ── */
        .pd-thumbnail-strip {
          display: flex;
          gap: 8px;
          padding: 12px 16px;
          overflow-x: auto;
          background: #f5f7f5;
          border-top: 1px solid #e8f5e9;
        }

        .pd-thumbnail-item {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          border: 2px solid transparent;
          transition: border-color 0.2s, transform 0.2s;
          flex-shrink: 0;
          background: #e8f5e9;
          position: relative;
        }

        .pd-thumbnail-item:hover {
          transform: scale(1.05);
        }

        .pd-thumbnail-item.active {
          border-color: #2E7D32;
        }

        .pd-thumbnail-item img,
        .pd-thumbnail-item video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .pd-thumbnail-item .thumb-badge {
          position: absolute;
          bottom: 2px;
          right: 2px;
          font-size: 0.5rem;
          background: rgba(0,0,0,0.6);
          color: #fff;
          padding: 1px 6px;
          border-radius: 4px;
        }

        .pd-thumbnail-item .thumb-play {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: rgba(255,255,255,0.8);
          font-size: 14px;
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
          margin: 0 0 4px;
        }

        .pd-info-price .unit-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 1rem;
          color: #78909c;
          font-weight: 400;
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

        .pd-meta-value .unit {
          font-size: 0.8rem;
          color: #78909c;
          font-weight: 400;
        }

        .pd-stock-info {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 8px;
          margin: 0 0 12px 0;
          font-size: 0.9rem;
        }

        .pd-stock-info .status-icon {
          font-size: 1.2rem;
        }

        .pd-stock-info .status-text {
          font-weight: 600;
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
          .pd-gallery-image,
          .pd-gallery-video-wrapper,
          .pd-gallery .no-media {
            height: 350px;
          }
          .pd-info {
            padding: 24px;
          }
          .pd-thumbnail-strip {
            padding: 8px 12px;
          }
          .pd-thumbnail-item {
            width: 50px;
            height: 50px;
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
          .pd-gallery-image,
          .pd-gallery-video-wrapper,
          .pd-gallery .no-media {
            height: 250px;
          }
          .pd-gallery-nav {
            width: 36px;
            height: 36px;
            font-size: 16px;
          }
          .pd-thumbnail-item {
            width: 44px;
            height: 44px;
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
              {/* ── Media Gallery ── */}
              <div className="pd-gallery">
                {mediaCount > 0 ? (
                  <>
                    {isVideo ? (
                      <div className="pd-gallery-video-wrapper">
                        <video
                          ref={videoRef}
                          src={getMediaUrl(currentMedia)}
                          className="pd-gallery-image"
                          playsInline
                          onEnded={() => setIsVideoPlaying(false)}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = `
                              <div class="no-media">
                                <div class="icon"><AlertTriangleIcon size={48} /></div>
                                <p>Video failed to load</p>
                              </div>
                            `;
                          }}
                        />
                        <div 
                          className={`pd-video-overlay ${isVideoPlaying ? 'hidden' : ''}`}
                          onClick={toggleVideoPlay}
                        >
                          {isVideoPlaying ? <PauseIcon size={56} /> : <PlayIcon size={56} />}
                        </div>
                        <span className="pd-media-badge">
                          <VideoIcon size={14} /> Video
                        </span>
                      </div>
                    ) : (
                      <img
                        src={getMediaUrl(currentMedia)}
                        alt={product.name}
                        className="pd-gallery-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = `
                            <div class="no-media">
                              <div class="icon"><ImageIcon size={48} /></div>
                              <p>Image failed to load</p>
                            </div>
                          `;
                        }}
                      />
                    )}
                    
                    {mediaCount > 1 && (
                      <>
                        <button className="pd-gallery-nav prev" onClick={prevMedia}>
                          ‹
                        </button>
                        <button className="pd-gallery-nav next" onClick={nextMedia}>
                          ›
                        </button>
                        <div className="pd-gallery-dots">
                          {product.images.map((_, index) => (
                            <button
                              key={index}
                              className={`pd-gallery-dot ${index === currentMediaIndex ? 'active' : ''}`}
                              onClick={() => {
                                if (videoRef.current && isVideoPlaying) {
                                  videoRef.current.pause();
                                  setIsVideoPlaying(false);
                                }
                                setCurrentMediaIndex(index);
                              }}
                            />
                          ))}
                        </div>
                        <span className="pd-media-counter">
                          {currentMediaIndex + 1} / {mediaCount}
                        </span>
                      </>
                    )}
                    
                    {!isVideo && (
                      <span className="pd-media-badge">
                        <ImageIcon size={14} /> Image
                      </span>
                    )}
                  </>
                ) : (
                  <div className="no-media">
                    <div className="icon"><ImageIcon size={48} /></div>
                    <p>No Media Available</p>
                  </div>
                )}
              </div>

              {/* ── Thumbnail Strip ── */}
              {mediaCount > 1 && (
                <div className="pd-thumbnail-strip">
                  {product.images.map((media, index) => {
                    const isVideoThumb = isVideoUrl(media.url);
                    return (
                      <div
                        key={index}
                        className={`pd-thumbnail-item ${index === currentMediaIndex ? 'active' : ''}`}
                        onClick={() => {
                          if (videoRef.current && isVideoPlaying) {
                            videoRef.current.pause();
                            setIsVideoPlaying(false);
                          }
                          setCurrentMediaIndex(index);
                        }}
                      >
                        {isVideoThumb ? (
                          <>
                            <video src={media.url} muted playsInline />
                            <div className="thumb-play">▶</div>
                          </>
                        ) : (
                          <img src={media.url} alt={`Thumb ${index + 1}`} />
                        )}
                        <span className="thumb-badge">{isVideoThumb ? '🎬' : '🖼️'}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Product Info ── */}
              <div className="pd-info">
                <span className="pd-info-category">{product.category}</span>
                
                <div className="pd-status-badge available">
                  <CheckIcon size={14} /> Available
                </div>

                <h1 className="pd-info-name">{product.name}</h1>
                <div className="pd-info-price">
                  ₱{Number(product.price).toFixed(2)}
                  <span className="unit-label"> / {unitLabel}</span>
                </div>

                {/* Stock Status */}
                <div 
                  className="pd-stock-info" 
                  style={{ 
                    backgroundColor: stockStatus.bg,
                    color: stockStatus.color
                  }}
                >
                  <span className="status-icon">{stockStatus.icon}</span>
                  <span className="status-text">
                    {stockStatus.label}: {product.quantity} {unitLabel} available
                  </span>
                </div>

                <p className="pd-info-description">{product.description}</p>

                <div className="pd-info-meta">
                  <div className="pd-meta-item">
                    <span className="pd-meta-label">Total Stock</span>
                    <span className="pd-meta-value">
                      {product.quantity} <span className="unit">{unitLabel}</span>
                    </span>
                  </div>
                  <div className="pd-meta-item">
                    <span className="pd-meta-label">Posted</span>
                    <span className="pd-meta-value">{formatDate(product.createdAt)}</span>
                  </div>
                  <div className="pd-meta-item">
                    <span className="pd-meta-label">Unit</span>
                    <span className="pd-meta-value">{unitFullLabel}</span>
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
                    className="pd-action-btn purchase"
                    onClick={handlePurchase}
                    style={{ flex: 1 }}
                  >
                    <CreditCardIcon size={18} /> Purchase Now
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