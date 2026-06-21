import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserHeader from '../layouts/Header';
import { getUnitLabel, getPricePerUnit, getQuantityDisplay } from '../utils/unitHelpers';

// ── Icons ───────────────────────────────────────────────────────────────
const SearchIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

const MapPinIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const GridIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
  </svg>
);

const ListIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
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

const RefreshIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

const PlayIcon = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="12" fill="rgba(0,0,0,0.5)"/>
    <polygon points="10,8 16,12 10,16" fill="white"/>
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
const Product = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState('grid');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  const categories = ['All', 'Fruits', 'Vegetables', 'Grains', 'Livestock', 'Others'];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/v1/products`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : {}
        }
      });

      const data = await response.json();

      if (response.ok) {
        const availableProducts = (data.products || []).filter(p => p.isAvailable !== false);
        setProducts(availableProducts);
      } else {
        setError(data.message || 'Failed to fetch products');
      }
    } catch (err) {
      console.error('Fetch products error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  const handleViewOnMap = (e, product) => {
    e.stopPropagation();
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
  };

  const handlePurchase = (e, product) => {
    e.stopPropagation();
    alert('Purchase functionality coming soon!');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) {
      const url = product.images[0].url;
      return url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    }
    return null;
  };

  const getFirstMedia = (product) => {
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    return null;
  };

  const getFarmerAvatar = (product) => {
    if (product.farmerAvatar) {
      return product.farmerAvatar.startsWith('http') ? product.farmerAvatar : `${API_BASE_URL}${product.farmerAvatar}`;
    }
    if (product.farmer?.avatar?.url) {
      return product.farmer.avatar.url.startsWith('http') ? product.farmer.avatar.url : `${API_BASE_URL}${product.farmer.avatar.url}`;
    }
    if (product.farmer?.profilePicture?.url) {
      return product.farmer.profilePicture.url.startsWith('http') ? product.farmer.profilePicture.url : `${API_BASE_URL}${product.farmer.profilePicture.url}`;
    }
    return null;
  };

  const getFarmerInitial = (name) => {
    return name?.charAt(0)?.toUpperCase() || 'F';
  };

  const getLocationDisplay = (product) => {
    if (product.location?.address) {
      return product.location.address;
    }
    if (product.location?.barangay && product.location?.city) {
      return `${product.location.barangay}, ${product.location.city}`;
    }
    if (product.farmerAddress?.barangay && product.farmerAddress?.city) {
      return `${product.farmerAddress.barangay}, ${product.farmerAddress.city}`;
    }
    return null;
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.farmer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // ── Media Thumbnail Component ──────────────────────────────────────
  const MediaThumbnail = ({ product }) => {
    const media = getFirstMedia(product);
    
    if (!media || !media.url) {
      return <div className="prod-no-image">No Media</div>;
    }

    const isVideo = isVideoUrl(media.url);
    const mediaUrl = media.url.startsWith('http') ? media.url : `${API_BASE_URL}${media.url}`;

    if (isVideo) {
      return (
        <div className="prod-video-thumbnail">
          <video
            src={mediaUrl}
            muted
            playsInline
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = `<div class="prod-no-image">Video Error</div>`;
            }}
          />
          <div className="prod-video-overlay">
            <PlayIcon size={40} />
            <span className="prod-video-badge">VIDEO</span>
          </div>
        </div>
      );
    }

    return (
      <img
        src={mediaUrl}
        alt={product.name}
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.parentElement.innerHTML = `<div class="prod-no-image">No Image</div>`;
        }}
      />
    );
  };

  // ── Loading State ──
  if (loading) {
    return (
      <div className="full-bleed w-full min-h-screen bg-white flex flex-col">
        <UserHeader />
        <style>{`
          @keyframes prod-spin { to { transform: rotate(360deg); } }
        `}</style>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="full-bleed w-full min-h-screen bg-white flex flex-col">
      <UserHeader />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        @keyframes prod-fadeup {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes prod-spin {
          to { transform: rotate(360deg); }
        }

        .prod-root {
          font-family: 'DM Sans', sans-serif;
          flex: 1;
          background: #f9fafb;
          padding: 32px 20px 60px;
        }

        .prod-container {
          max-width: 1280px;
          margin: 0 auto;
        }

        /* ── Header ── */
        .prod-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 24px;
          animation: prod-fadeup 0.3s ease both;
        }

        .prod-header-left h1 {
          font-family: 'DM Serif Display', serif;
          font-size: 1.8rem;
          color: #1a3d2b;
          margin: 0;
        }

        .prod-header-left p {
          margin: 2px 0 0;
          color: #78909c;
          font-size: 0.92rem;
        }

        .prod-header-actions {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .prod-refresh-btn {
          padding: 10px 14px;
          border: 1.5px solid #e0e7e0;
          border-radius: 10px;
          background: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          color: #546e7a;
          transition: all 0.2s;
        }

        .prod-refresh-btn:hover {
          border-color: #66BB6A;
          color: #2E7D32;
        }

        /* ── Search ── */
        .prod-search-wrap {
          position: relative;
        }

        .prod-search-wrap .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #a5b8a5;
        }

        .prod-search-input {
          padding: 10px 16px 10px 44px;
          border: 1.5px solid #e0e7e0;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          background: #fff;
          width: 260px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .prod-search-input:focus {
          outline: none;
          border-color: #66BB6A;
          box-shadow: 0 0 0 4px rgba(46, 125, 50, 0.08);
        }

        /* ── View Toggle ── */
        .prod-view-toggle {
          display: flex;
          gap: 4px;
          background: #fff;
          border: 1.5px solid #e0e7e0;
          border-radius: 10px;
          padding: 4px;
        }

        .prod-view-btn {
          padding: 8px 10px;
          border: none;
          border-radius: 7px;
          background: transparent;
          color: #78909c;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
        }

        .prod-view-btn:hover {
          background: #e8f5e9;
          color: #2E7D32;
        }

        .prod-view-btn.active {
          background: linear-gradient(135deg, #2E7D32, #43A047);
          color: #fff;
        }

        /* ── Category Filter ── */
        .prod-categories {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 28px;
          animation: prod-fadeup 0.35s ease both;
        }

        .prod-cat-btn {
          padding: 8px 18px;
          border: 1.5px solid #e0e7e0;
          border-radius: 20px;
          background: #fff;
          color: #546e7a;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .prod-cat-btn:hover {
          border-color: #66BB6A;
          color: #2E7D32;
        }

        .prod-cat-btn.active {
          background: linear-gradient(135deg, #2E7D32, #43A047);
          color: #fff;
          border-color: #2E7D32;
        }

        /* ── Error ── */
        .prod-error {
          padding: 14px 18px;
          border-radius: 10px;
          margin-bottom: 20px;
          background: #ffebee;
          border-left: 4px solid #ef5350;
          color: #c62828;
          font-size: 0.92rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .prod-error-retry {
          padding: 4px 16px;
          background: #ef5350;
          color: #fff;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          transition: opacity 0.2s;
        }

        .prod-error-retry:hover {
          opacity: 0.85;
        }

        /* ── Empty State ── */
        .prod-empty {
          background: #fff;
          border-radius: 16px;
          padding: 60px 20px;
          text-align: center;
          border: 1.5px solid #e8f5e9;
          box-shadow: 0 2px 12px rgba(27, 94, 32, 0.06);
        }

        .prod-empty .icon {
          color: #a5d6a7;
          margin-bottom: 14px;
        }

        .prod-empty h3 {
          font-family: 'DM Serif Display', serif;
          color: #2E7D32;
          margin: 0 0 8px;
          font-size: 1.3rem;
        }

        .prod-empty p {
          color: #78909c;
          margin: 0;
          font-size: 0.95rem;
        }

        /* ── Product Grid ── */
        .prod-grid {
          display: grid;
          gap: 22px;
          animation: prod-fadeup 0.4s ease both;
        }

        .prod-grid.grid {
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        }

        .prod-grid.list {
          grid-template-columns: 1fr;
        }

        /* ── Product Card ── */
        .prod-card {
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          border: 1.5px solid #e8f5e9;
          box-shadow: 0 2px 12px rgba(27, 94, 32, 0.06);
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
          cursor: pointer;
        }

        .prod-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 28px rgba(27, 94, 32, 0.12);
          border-color: #a5d6a7;
        }

        .prod-card.list-mode {
          display: flex;
        }

        .prod-card.list-mode .prod-card-image {
          width: 200px;
          min-height: 200px;
          flex-shrink: 0;
        }

        .prod-card.list-mode .prod-card-body {
          flex: 1;
        }

        .prod-card-image {
          height: 200px;
          background: #e8f5e9;
          overflow: hidden;
          position: relative;
        }

        .prod-card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* ── Video Thumbnail ── */
        .prod-video-thumbnail {
          width: 100%;
          height: 100%;
          position: relative;
          background: #1a1a2e;
        }

        .prod-video-thumbnail video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .prod-video-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.2);
          transition: background 0.3s;
        }

        .prod-card:hover .prod-video-overlay {
          background: rgba(0, 0, 0, 0.1);
        }

        .prod-video-overlay svg {
          opacity: 0.9;
          transition: transform 0.3s;
        }

        .prod-card:hover .prod-video-overlay svg {
          transform: scale(1.1);
        }

        .prod-video-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: rgba(0, 0, 0, 0.7);
          color: #fff;
          font-size: 0.6rem;
          font-weight: 700;
          padding: 2px 10px;
          border-radius: 10px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .prod-video-badge svg {
          width: 12px;
          height: 12px;
        }

        .prod-no-image {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #a5b8a5;
          font-size: 0.9rem;
        }

        .prod-card-image .category-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(0, 0, 0, 0.7);
          color: #fff;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          z-index: 2;
        }

        .prod-media-count {
          position: absolute;
          bottom: 12px;
          right: 12px;
          background: rgba(0, 0, 0, 0.6);
          color: #fff;
          padding: 2px 10px;
          border-radius: 10px;
          font-size: 0.65rem;
          font-weight: 500;
          backdrop-filter: blur(4px);
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .prod-card-body {
          padding: 18px 20px 20px;
        }

        .prod-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 6px;
        }

        .prod-card-name {
          font-weight: 600;
          font-size: 1.05rem;
          color: #263238;
          margin: 0;
          flex: 1;
        }

        .prod-card-price {
          font-family: 'DM Serif Display', serif;
          font-size: 1.2rem;
          color: #2E7D32;
          white-space: nowrap;
        }

        .prod-card-price .unit-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.7rem;
          color: #78909c;
          font-weight: 500;
        }

        .prod-card-desc {
          font-size: 0.85rem;
          color: #78909c;
          margin: 6px 0 12px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.5;
        }

        .prod-card-meta {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          font-size: 0.78rem;
          color: #90a4ae;
          margin-bottom: 14px;
          padding-bottom: 14px;
          border-bottom: 1px solid #e8f5e9;
        }

        .prod-card-meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .prod-card-farmer {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 500;
          color: #37474f;
          cursor: pointer;
        }

        .prod-card-farmer:hover {
          color: #2E7D32;
        }

        .prod-farmer-avatar {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          overflow: hidden;
          border: 1.5px solid #e8f5e9;
          background: #e8f5e9;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .prod-farmer-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .prod-farmer-avatar .fallback {
          font-size: 0.55rem;
          font-weight: 700;
          color: #2d6a4f;
        }

        .prod-card-location {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.72rem;
          color: #78909c;
          cursor: pointer;
          transition: color 0.2s;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .prod-card-location:hover {
          color: #0277bd;
          background: #e3f2fd;
        }

        .prod-card-actions {
          display: flex;
          gap: 10px;
        }

        .prod-action-btn {
          flex: 1;
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: opacity 0.2s, transform 0.15s;
        }

        .prod-action-btn:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }

        .prod-action-btn.purchase {
          background: linear-gradient(135deg, #2E7D32, #43A047);
          color: #fff;
          box-shadow: 0 4px 14px rgba(46, 125, 50, 0.25);
          flex: 1;
        }

        /* ── Stats Bar ── */
        .prod-stats {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
          padding: 16px 20px;
          background: #fff;
          border-radius: 12px;
          border: 1.5px solid #e8f5e9;
          margin-bottom: 24px;
        }

        .prod-stat {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: #546e7a;
        }

        .prod-stat strong {
          color: #263238;
          font-size: 1rem;
        }

        /* ── Media Type Indicator ── */
        .prod-media-type {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.6rem;
          color: #78909c;
          background: rgba(0,0,0,0.6);
          padding: 2px 8px;
          border-radius: 10px;
          color: #fff;
          position: absolute;
          bottom: 12px;
          left: 12px;
          z-index: 2;
        }

        .prod-media-type svg {
          width: 12px;
          height: 12px;
        }

        @media (max-width: 768px) {
          .prod-header { flex-direction: column; align-items: stretch; }
          .prod-header-actions { flex-direction: column; }
          .prod-search-input { width: 100%; }
          .prod-card.list-mode { flex-direction: column; }
          .prod-card.list-mode .prod-card-image { width: 100%; min-height: 180px; }
          .prod-grid.grid { grid-template-columns: 1fr; }
          .prod-stats { justify-content: center; }
          .prod-card-actions { flex-wrap: wrap; }
          .prod-action-btn { flex: 1; min-width: 80px; }
        }

        @media (max-width: 480px) {
          .prod-root { padding: 16px 12px; }
          .prod-header-left h1 { font-size: 1.5rem; }
          .prod-header-actions { gap: 8px; }
          .prod-search-input { width: 100%; font-size: 0.85rem; }
          .prod-stats { gap: 12px; padding: 12px 16px; }
          .prod-stat { font-size: 0.78rem; }
          .prod-stat strong { font-size: 0.9rem; }
          .prod-categories { gap: 6px; }
          .prod-cat-btn { padding: 6px 14px; font-size: 0.75rem; }
          .prod-card-body { padding: 14px 16px; }
          .prod-card-name { font-size: 0.95rem; }
          .prod-card-price { font-size: 1rem; }
          .prod-card-image { height: 180px; }
        }
      `}</style>

      <div className="prod-root">
        <div className="prod-container">

          {/* ── Header ── */}
          <div className="prod-header">
            <div className="prod-header-left">
              <h1>Marketplace</h1>
              <p>Discover fresh products from local farmers</p>
            </div>
            <div className="prod-header-actions">
              <div className="prod-search-wrap">
                <span className="search-icon"><SearchIcon size={18} /></span>
                <input
                  type="text"
                  className="prod-search-input"
                  placeholder="Search products or farmers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="prod-refresh-btn" onClick={fetchProducts}>
                <RefreshIcon size={16} /> Refresh
              </button>
              <div className="prod-view-toggle">
                <button
                  className={`prod-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid view"
                >
                  <GridIcon size={18} />
                </button>
                <button
                  className={`prod-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="List view"
                >
                  <ListIcon size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* ── Stats ── */}
          <div className="prod-stats">
            <div className="prod-stat">
              <strong>{products.length}</strong> Total Products
            </div>
            <div className="prod-stat">
              <strong>{filteredProducts.length}</strong> Available
            </div>
            <div className="prod-stat">
              <strong>{new Set(products.map(p => p.farmer?._id || p.farmer)).size}</strong> Farmers
            </div>
          </div>

          {/* ── Categories ── */}
          <div className="prod-categories">
            {categories.map(cat => (
              <button
                key={cat}
                className={`prod-cat-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="prod-error">
              <span>{error}</span>
              <button className="prod-error-retry" onClick={fetchProducts}>
                Retry
              </button>
            </div>
          )}

          {/* ── Products ── */}
          {filteredProducts.length === 0 ? (
            <div className="prod-empty">
              <div className="icon"><ShoppingCartIcon size={48} /></div>
              <h3>{searchTerm || selectedCategory !== 'All' ? 'No matching products' : 'No products available'}</h3>
              <p>
                {searchTerm || selectedCategory !== 'All'
                  ? 'Try adjusting your search or filter criteria'
                  : 'Check back later for fresh products from local farmers'}
              </p>
            </div>
          ) : (
            <div className={`prod-grid ${viewMode}`}>
              {filteredProducts.map((product) => {
                const farmerAvatar = getFarmerAvatar(product);
                const farmerName = product.farmer?.name || 'Unknown Farmer';
                const locationDisplay = getLocationDisplay(product);
                const unitLabel = getUnitLabel(product.unit);
                const media = getFirstMedia(product);
                const isVideo = media ? isVideoUrl(media.url) : false;
                const mediaCount = product.images?.length || 0;
                
                return (
                  <div 
                    key={product._id} 
                    className={`prod-card ${viewMode === 'list' ? 'list-mode' : ''}`}
                    onClick={() => handleProductClick(product._id)}
                  >
                    {/* Media */}
                    <div className="prod-card-image">
                      {media ? (
                        isVideo ? (
                          <div className="prod-video-thumbnail">
                            <video
                              src={media.url.startsWith('http') ? media.url : `${API_BASE_URL}${media.url}`}
                              muted
                              playsInline
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = `<div class="prod-no-image">Video Error</div>`;
                              }}
                            />
                            <div className="prod-video-overlay">
                              <PlayIcon size={40} />
                              <span className="prod-video-badge">
                                <VideoIcon size={12} /> VIDEO
                              </span>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={media.url.startsWith('http') ? media.url : `${API_BASE_URL}${media.url}`}
                            alt={product.name}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = `<div class="prod-no-image">No Image</div>`;
                            }}
                          />
                        )
                      ) : (
                        <div className="prod-no-image">No Media</div>
                      )}
                      <span className="category-badge">{product.category}</span>
                      
                      {mediaCount > 1 && (
                        <span className="prod-media-count">
                          +{mediaCount - 1} more
                        </span>
                      )}
                      
                      {media && isVideo && (
                        <span className="prod-media-type">
                          <VideoIcon size={12} /> Video
                        </span>
                      )}
                    </div>

                    {/* Body */}
                    <div className="prod-card-body">
                      <div className="prod-card-top">
                        <h3 className="prod-card-name">{product.name}</h3>
                        <span className="prod-card-price">
                          ₱{Number(product.price).toFixed(2)}
                          <span className="unit-label"> / {unitLabel}</span>
                        </span>
                      </div>
                      <p className="prod-card-desc">{product.description}</p>

                      <div className="prod-card-meta">
                        <span className="prod-card-meta-item">
                          <ClockIcon size={14} /> {formatDate(product.createdAt)}
                        </span>
                        <span className="prod-card-meta-item">
                          <ShoppingCartIcon size={14} /> {product.quantity} {unitLabel}
                        </span>
                        <span className="prod-card-meta-item">
                          <span className="prod-card-farmer">
                            <span className="prod-farmer-avatar">
                              {farmerAvatar ? (
                                <img src={farmerAvatar} alt={farmerName} />
                              ) : (
                                <span className="fallback">{getFarmerInitial(farmerName)}</span>
                              )}
                            </span>
                            {farmerName}
                          </span>
                        </span>
                        {locationDisplay && (
                          <span className="prod-card-meta-item">
                            <span 
                              className="prod-card-location"
                              onClick={(e) => handleViewOnMap(e, product)}
                              title="View on map"
                            >
                              <MapPinIcon size={12} /> {locationDisplay}
                            </span>
                          </span>
                        )}
                      </div>

                      <div className="prod-card-actions">
                        <button
                          className="prod-action-btn purchase"
                          onClick={(e) => handlePurchase(e, product)}
                        >
                          Purchase
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Product;