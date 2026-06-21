import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import FarmerHeader from '../../layouts/FarmerHeader';
import { getUnitLabel, getPricePerUnit, getQuantityDisplay, getStockStatus } from '../../utils/unitHelpers';

// ── Icons ───────────────────────────────────────────────────────────────
const ArrowLeftIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);

const EditIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const TrashIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

const MapPinIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const ShoppingCartIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/>
    <circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
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
const ViewProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
          'Authorization': `Bearer ${token}`
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
    navigate('/farmer/products');
  };

  const handleEdit = () => {
    navigate(`/farmer/update-product/${id}`);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/v1/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        navigate('/farmer/products');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to delete product');
        setShowDeleteModal(false);
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Network error. Please try again.');
    } finally {
      setDeleting(false);
    }
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

  const nextMedia = () => {
    if (product?.images?.length > 0) {
      // Pause video if playing
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

  // ── Loading State ──
  if (loading) {
    return (
      <>
        <FarmerHeader />
        <style>{`
          @keyframes vp-spin { to { transform: rotate(360deg); } }
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
              animation: 'vp-spin 0.9s linear infinite',
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
        <FarmerHeader />
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

  const unitLabel = getUnitLabel(product.unit);
  const stockStatus = getStockStatus(Number(product.quantity) || 0);

  return (
    <>
      <FarmerHeader />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        @keyframes vp-fadeup {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes vp-spin {
          to { transform: rotate(360deg); }
        }

        @keyframes vp-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .vp-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          background: #f5f7f5;
          padding-top: 80px;
        }

        .vp-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 20px 60px;
        }

        .vp-header-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 24px;
        }

        .vp-back-btn {
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
        }

        .vp-back-btn:hover {
          border-color: #66BB6A;
          color: #2E7D32;
          transform: translateX(-4px);
        }

        .vp-action-btns {
          display: flex;
          gap: 10px;
        }

        .vp-action-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: opacity 0.2s, transform 0.15s;
        }

        .vp-action-btn:hover {
          opacity: 0.85;
          transform: translateY(-1px);
        }

        .vp-action-btn.edit {
          background: linear-gradient(135deg, #1565C0, #1E88E5);
          color: #fff;
        }

        .vp-action-btn.delete {
          background: linear-gradient(135deg, #c62828, #d32f2f);
          color: #fff;
        }

        .vp-card {
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          border: 1.5px solid #e8f5e9;
          box-shadow: 0 2px 20px rgba(27, 94, 32, 0.08);
          animation: vp-fadeup 0.4s ease both;
        }

        .vp-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
        }

        .vp-gallery {
          background: #1a1a2e;
          position: relative;
          min-height: 500px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .vp-gallery-media {
          width: 100%;
          height: 500px;
          object-fit: contain;
          background: #1a1a2e;
        }

        .vp-gallery-image {
          width: 100%;
          height: 500px;
          object-fit: cover;
        }

        .vp-gallery-video {
          width: 100%;
          height: 500px;
          object-fit: contain;
          background: #1a1a2e;
          cursor: pointer;
        }

        .vp-gallery-video-wrapper {
          position: relative;
          width: 100%;
          height: 500px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #1a1a2e;
        }

        .vp-gallery-video-wrapper video {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .vp-video-overlay {
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

        .vp-video-overlay:hover {
          background: rgba(0, 0, 0, 0.2);
        }

        .vp-video-overlay svg {
          transition: transform 0.3s;
        }

        .vp-video-overlay:hover svg {
          transform: scale(1.05);
        }

        .vp-video-overlay.hidden {
          opacity: 0;
          pointer-events: none;
        }

        .vp-media-badge {
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
        }

        .vp-media-counter {
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

        .vp-gallery .no-media {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 500px;
          color: #a5b8a5;
          font-size: 1rem;
          background: #fafffa;
        }

        .vp-gallery .no-media .icon {
          margin-bottom: 12px;
          color: #c8e6c9;
        }

        .vp-gallery-nav {
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

        .vp-gallery-nav:hover {
          background: rgba(0, 0, 0, 0.7);
          transform: translateY(-50%) scale(1.05);
        }

        .vp-gallery-nav.prev {
          left: 12px;
        }

        .vp-gallery-nav.next {
          right: 12px;
        }

        .vp-gallery-dots {
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
          z-index: 5;
        }

        .vp-gallery-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.4);
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          padding: 0;
        }

        .vp-gallery-dot.active {
          background: #fff;
          transform: scale(1.3);
        }

        .vp-gallery-dot:hover {
          background: rgba(255, 255, 255, 0.7);
        }

        .vp-info {
          padding: 32px 36px;
          display: flex;
          flex-direction: column;
        }

        .vp-info-category {
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

        .vp-info-name {
          font-family: 'DM Serif Display', serif;
          font-size: 1.8rem;
          color: #1a3d2b;
          margin: 0 0 8px;
        }

        .vp-info-price {
          font-family: 'DM Serif Display', serif;
          font-size: 2rem;
          color: #2E7D32;
          margin: 0 0 4px;
        }

        .vp-info-price .unit-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 1rem;
          color: #78909c;
          font-weight: 400;
        }

        .vp-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 14px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          margin-bottom: 12px;
          align-self: flex-start;
        }

        .vp-status-badge.available {
          background: #e8f5e9;
          color: #2E7D32;
        }

        .vp-status-badge.unavailable {
          background: #ffebee;
          color: #c62828;
        }

        .vp-info-description {
          font-size: 0.95rem;
          color: #546e7a;
          line-height: 1.7;
          margin: 0 0 20px;
          padding: 16px 0;
          border-top: 1px solid #e8f5e9;
          border-bottom: 1px solid #e8f5e9;
        }

        .vp-info-meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 20px;
        }

        .vp-meta-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .vp-meta-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #90a4ae;
          font-weight: 600;
        }

        .vp-meta-value {
          font-size: 0.92rem;
          color: #263238;
          font-weight: 500;
        }

        .vp-meta-value .unit {
          font-size: 0.8rem;
          color: #78909c;
          font-weight: 400;
        }

        .vp-info-location {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: #f1f8f0;
          border-radius: 10px;
          margin-top: auto;
        }

        .vp-location-text {
          font-size: 0.88rem;
          color: #546e7a;
          flex: 1;
        }

        .vp-location-text strong {
          color: #263238;
        }

        .vp-map-btn {
          padding: 8px 16px;
          background: linear-gradient(135deg, #0277bd, #0288d1);
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
          transition: opacity 0.2s;
          white-space: nowrap;
        }

        .vp-map-btn:hover {
          opacity: 0.85;
        }

        .vp-stock-info {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 8px;
          margin: 8px 0 12px;
          font-size: 0.9rem;
        }

        .vp-stock-info .status-icon {
          font-size: 1.2rem;
        }

        .vp-stock-info .status-text {
          font-weight: 600;
        }

        .vp-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(10, 30, 15, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 20px;
          backdrop-filter: blur(3px);
          animation: vp-fadeup 0.25s ease both;
        }

        .vp-modal {
          background: #fff;
          border-radius: 16px;
          max-width: 440px;
          width: 100%;
          padding: 32px;
          box-shadow: 0 24px 64px rgba(27, 94, 32, 0.2);
          text-align: center;
        }

        .vp-modal-icon {
          margin: 0 auto 16px;
          color: #ef5350;
        }

        .vp-modal h3 {
          font-family: 'DM Serif Display', serif;
          font-size: 1.3rem;
          color: #1a3d2b;
          margin: 0 0 8px;
        }

        .vp-modal p {
          color: #78909c;
          font-size: 0.95rem;
          margin: 0 0 24px;
          line-height: 1.5;
        }

        .vp-modal-actions {
          display: flex;
          gap: 12px;
        }

        .vp-modal-btn {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .vp-modal-btn:hover {
          opacity: 0.85;
        }

        .vp-modal-btn.confirm {
          background: linear-gradient(135deg, #c62828, #d32f2f);
          color: #fff;
        }

        .vp-modal-btn.cancel {
          background: #e8f5e9;
          color: #2E7D32;
        }

        .vp-thumbnail-strip {
          display: flex;
          gap: 8px;
          padding: 12px 16px;
          overflow-x: auto;
          background: #f5f7f5;
          border-top: 1px solid #e8f5e9;
        }

        .vp-thumbnail-item {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          border: 2px solid transparent;
          transition: border-color 0.2s, transform 0.2s;
          flex-shrink: 0;
          background: #e8f5e9;
        }

        .vp-thumbnail-item:hover {
          transform: scale(1.05);
        }

        .vp-thumbnail-item.active {
          border-color: #2E7D32;
        }

        .vp-thumbnail-item img,
        .vp-thumbnail-item video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .vp-thumbnail-item .thumb-badge {
          position: absolute;
          bottom: 2px;
          right: 2px;
          font-size: 0.5rem;
          background: rgba(0,0,0,0.6);
          color: #fff;
          padding: 1px 6px;
          border-radius: 4px;
        }

        .vp-thumbnail-item .thumb-play {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: rgba(255,255,255,0.8);
          font-size: 16px;
        }

        @media (max-width: 968px) {
          .vp-content {
            grid-template-columns: 1fr;
          }
          .vp-gallery {
            min-height: 300px;
          }
          .vp-gallery-image,
          .vp-gallery-video,
          .vp-gallery-video-wrapper,
          .vp-gallery .no-media {
            height: 350px;
          }
          .vp-info {
            padding: 24px;
          }
          .vp-thumbnail-strip {
            padding: 8px 12px;
          }
          .vp-thumbnail-item {
            width: 50px;
            height: 50px;
          }
        }

        @media (max-width: 640px) {
          .vp-header-actions {
            flex-direction: column;
            align-items: stretch;
          }
          .vp-action-btns {
            justify-content: stretch;
          }
          .vp-action-btn {
            flex: 1;
            justify-content: center;
          }
          .vp-info-meta {
            grid-template-columns: 1fr;
          }
          .vp-info-name {
            font-size: 1.4rem;
          }
          .vp-info-price {
            font-size: 1.6rem;
          }
          .vp-gallery-image,
          .vp-gallery-video,
          .vp-gallery-video-wrapper,
          .vp-gallery .no-media {
            height: 250px;
          }
          .vp-gallery-nav {
            width: 36px;
            height: 36px;
            font-size: 16px;
          }
          .vp-info-location {
            flex-direction: column;
            align-items: stretch;
          }
          .vp-modal-actions {
            flex-direction: column;
          }
          .vp-thumbnail-item {
            width: 44px;
            height: 44px;
          }
        }
      `}</style>

      <div className="vp-root">
        <div className="vp-container">
          {/* ── Header Actions ── */}
          <div className="vp-header-actions">
            <button className="vp-back-btn" onClick={handleGoBack}>
              <ArrowLeftIcon size={18} /> Back to Products
            </button>
            <div className="vp-action-btns">
              <button className="vp-action-btn edit" onClick={handleEdit}>
                <EditIcon size={16} /> Edit Product
              </button>
              <button className="vp-action-btn delete" onClick={() => setShowDeleteModal(true)}>
                <TrashIcon size={16} /> Delete
              </button>
            </div>
          </div>

          {/* ── Product Details ── */}
          <div className="vp-card">
            <div className="vp-content">
              {/* ── Media Gallery ── */}
              <div className="vp-gallery">
                {product.images && product.images.length > 0 ? (
                  <>
                    {isVideo ? (
                      <div className="vp-gallery-video-wrapper">
                        <video
                          ref={videoRef}
                          src={getMediaUrl(currentMedia)}
                          className="vp-gallery-video"
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
                          className={`vp-video-overlay ${isVideoPlaying ? 'hidden' : ''}`}
                          onClick={toggleVideoPlay}
                        >
                          {isVideoPlaying ? <PauseIcon size={56} /> : <PlayIcon size={56} />}
                        </div>
                        <span className="vp-media-badge">🎬 Video</span>
                      </div>
                    ) : (
                      <img
                        src={getMediaUrl(currentMedia)}
                        alt={product.name}
                        className="vp-gallery-image"
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
                    
                    {product.images.length > 1 && (
                      <>
                        <button className="vp-gallery-nav prev" onClick={prevMedia}>
                          ‹
                        </button>
                        <button className="vp-gallery-nav next" onClick={nextMedia}>
                          ›
                        </button>
                        <div className="vp-gallery-dots">
                          {product.images.map((_, index) => (
                            <button
                              key={index}
                              className={`vp-gallery-dot ${index === currentMediaIndex ? 'active' : ''}`}
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
                        <span className="vp-media-counter">
                          {currentMediaIndex + 1} / {product.images.length}
                        </span>
                      </>
                    )}
                    
                    <span className="vp-media-badge" style={{ top: '16px', right: '16px', left: 'auto' }}>
                      {isVideo ? '🎬 Video' : '🖼️ Image'}
                    </span>
                  </>
                ) : (
                  <div className="no-media">
                    <div className="icon"><ImageIcon size={48} /></div>
                    <p>No Media Available</p>
                  </div>
                )}
              </div>

              {/* ── Thumbnail Strip ── */}
              {product.images && product.images.length > 1 && (
                <div className="vp-thumbnail-strip">
                  {product.images.map((media, index) => {
                    const isVideoThumb = isVideoUrl(media.url);
                    return (
                      <div
                        key={index}
                        className={`vp-thumbnail-item ${index === currentMediaIndex ? 'active' : ''}`}
                        onClick={() => {
                          if (videoRef.current && isVideoPlaying) {
                            videoRef.current.pause();
                            setIsVideoPlaying(false);
                          }
                          setCurrentMediaIndex(index);
                        }}
                        style={{ position: 'relative' }}
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
              <div className="vp-info">
                <span className="vp-info-category">{product.category}</span>
                
                <div className={`vp-status-badge ${product.isAvailable ? 'available' : 'unavailable'}`}>
                  {product.isAvailable ? <CheckIcon size={14} /> : <XIcon size={14} />}
                  {product.isAvailable ? 'Available for Sale' : 'Unavailable'}
                </div>

                <h1 className="vp-info-name">{product.name}</h1>
                <div className="vp-info-price">
                  ₱{Number(product.price).toFixed(2)}
                  <span className="unit-label"> / {unitLabel}</span>
                </div>

                {/* Stock Status */}
                <div 
                  className="vp-stock-info" 
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

                <p className="vp-info-description">{product.description}</p>

                <div className="vp-info-meta">
                  <div className="vp-meta-item">
                    <span className="vp-meta-label">Total Stock</span>
                    <span className="vp-meta-value">
                      {product.quantity} <span className="unit">{unitLabel}</span>
                    </span>
                  </div>
                  <div className="vp-meta-item">
                    <span className="vp-meta-label">Posted</span>
                    <span className="vp-meta-value">{formatDate(product.createdAt)}</span>
                  </div>
                  <div className="vp-meta-item">
                    <span className="vp-meta-label">Unit</span>
                    <span className="vp-meta-value">{unitLabel}</span>
                  </div>
                  <div className="vp-meta-item">
                    <span className="vp-meta-label">Category</span>
                    <span className="vp-meta-value">{product.category}</span>
                  </div>
                </div>

                {/* ── Location ── */}
                {product.location && (
                  <div className="vp-info-location">
                    <MapPinIcon size={18} color="#2E7D32" />
                    <div className="vp-location-text">
                      <strong>Location:</strong> {product.location.address || 'Location set'}
                    </div>
                    <button 
                      className="vp-map-btn"
                      onClick={() => navigate('/mapping', {
                        state: {
                          location: product.location,
                          product: {
                            id: product._id,
                            name: product.name,
                            price: product.price
                          }
                        }
                      })}
                    >
                      <MapPinIcon size={14} /> View on Map
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteModal && (
        <div className="vp-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="vp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="vp-modal-icon">
              <AlertTriangleIcon size={48} />
            </div>
            <h3>Delete Product?</h3>
            <p>
              Are you sure you want to delete <strong>"{product.name}"</strong>? 
              This action cannot be undone.
            </p>
            <div className="vp-modal-actions">
              <button 
                className="vp-modal-btn confirm" 
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button 
                className="vp-modal-btn cancel" 
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ViewProduct;