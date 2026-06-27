import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import UserHeader from '../layouts/Header';
import { getUnitLabel } from '../utils/unitHelpers';

// ── Icons ───────────────────────────────────────────────────────────────
const ArrowLeftIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);

const TrashIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);

const ShoppingBagIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);

const CreditCardIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);

const MinusIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const PlusIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const ShoppingCartIcon = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/>
    <circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);

const CheckCircleIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const AlertCircleIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#ef5350" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

// ── Helper Functions ────────────────────────────────────────────────────
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
const Cart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], totalItems: 0, totalPrice: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  const fetchCart = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/cart`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setCart(data.cart || { items: [], totalItems: 0, totalPrice: 0 });
      } else {
        setError(data.message || 'Failed to fetch cart');
      }
    } catch (err) {
      console.error('Fetch cart error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, navigate]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      setUpdating(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/api/v1/cart/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId, quantity: newQuantity })
      });

      const data = await response.json();

      if (response.ok) {
        setCart(data.cart);
        showNotification('Cart updated successfully');
      } else {
        showNotification(data.message || 'Failed to update quantity', 'error');
      }
    } catch (err) {
      console.error('Update quantity error:', err);
      showNotification('Network error. Please try again.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const removeItem = async (productId) => {
    try {
      setUpdating(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/api/v1/cart/remove/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setCart(data.cart);
        showNotification('Item removed from cart');
      } else {
        showNotification(data.message || 'Failed to remove item', 'error');
      }
    } catch (err) {
      console.error('Remove item error:', err);
      showNotification('Network error. Please try again.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const clearCart = async () => {
    if (!confirm('Are you sure you want to clear your entire cart?')) return;

    try {
      setUpdating(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/api/v1/cart/clear`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setCart({ items: [], totalItems: 0, totalPrice: 0 });
        showNotification('Cart cleared successfully');
      } else {
        showNotification(data.message || 'Failed to clear cart', 'error');
      }
    } catch (err) {
      console.error('Clear cart error:', err);
      showNotification('Network error. Please try again.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleCheckout = () => {
    if (cart.items.length === 0) {
      showNotification('Your cart is empty', 'error');
      return;
    }
    // Navigate to checkout with cart data
    navigate('/checkout', { 
      state: { 
        cart: cart,
        isSoloCheckout: false 
      } 
    });
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) {
      const image = product.images[0];
      // Check if it's a video
      if (image.url && isVideoUrl(image.url)) {
        return null; // Will show video icon instead
      }
      const url = image.url;
      return url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    }
    return null;
  };

  const getFarmerAvatar = (product) => {
    // Check if product has farmerAvatar directly
    if (product.farmerAvatar) {
      return product.farmerAvatar.startsWith('http') ? product.farmerAvatar : `${API_BASE_URL}${product.farmerAvatar}`;
    }
    // Check if product has farmer object with avatar
    if (product.farmer?.avatar?.url) {
      return product.farmer.avatar.url.startsWith('http') ? product.farmer.avatar.url : `${API_BASE_URL}${product.farmer.avatar.url}`;
    }
    if (product.farmer?.profilePicture?.url) {
      return product.farmer.profilePicture.url.startsWith('http') ? product.farmer.profilePicture.url : `${API_BASE_URL}${product.farmer.profilePicture.url}`;
    }
    return null;
  };

  const hasVideo = (product) => {
    if (!product.images || product.images.length === 0) return false;
    return product.images.some(img => isVideoUrl(img.url));
  };

  const getVideoCount = (product) => {
    if (!product.images) return 0;
    return product.images.filter(img => isVideoUrl(img.url)).length;
  };

  const getFarmerInitial = (name) => {
    return name?.charAt(0)?.toUpperCase() || 'F';
  };

  // ── Loading State ──
  if (loading) {
    return (
      <div className="full-bleed w-full min-h-screen bg-white flex flex-col">
        <UserHeader />
        <style>{`@keyframes cart-spin { to { transform: rotate(360deg); } }`}</style>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your cart...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="full-bleed w-full min-h-screen bg-gray-50 flex flex-col">
      <UserHeader />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        @keyframes cart-fadeup {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes cart-slidein {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .cart-root {
          font-family: 'DM Sans', sans-serif;
          flex: 1;
          padding: 32px 20px 60px;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }

        .cart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 24px;
          animation: cart-fadeup 0.3s ease both;
        }

        .cart-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .cart-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #fff;
          border: 1.5px solid #e0e7e0;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          color: #546e7a;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cart-back-btn:hover {
          border-color: #66BB6A;
          color: #2E7D32;
        }

        .cart-header-left h1 {
          font-family: 'DM Serif Display', serif;
          font-size: 1.8rem;
          color: #1a3d2b;
          margin: 0;
        }

        .cart-header-left .badge {
          background: #e8f5e9;
          color: #2E7D32;
          padding: 2px 12px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .cart-actions {
          display: flex;
          gap: 10px;
        }

        .cart-clear-btn {
          padding: 8px 16px;
          border: 1.5px solid #ffebee;
          border-radius: 10px;
          background: #fff;
          color: #c62828;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .cart-clear-btn:hover {
          background: #ffebee;
          border-color: #ef5350;
        }

        .cart-clear-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ── Notification ── */
        .cart-notification {
          position: fixed;
          top: 90px;
          right: 20px;
          padding: 14px 24px;
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 500;
          z-index: 1000;
          animation: cart-slidein 0.3s ease both;
          box-shadow: 0 4px 20px rgba(0,0,0,0.12);
          max-width: 400px;
        }

        .cart-notification.success {
          background: #e8f5e9;
          color: #1b5e20;
          border-left: 4px solid #4CAF50;
        }

        .cart-notification.error {
          background: #ffebee;
          color: #c62828;
          border-left: 4px solid #ef5350;
        }

        /* ── Empty State ── */
        .cart-empty {
          background: #fff;
          border-radius: 16px;
          padding: 80px 20px;
          text-align: center;
          border: 1.5px solid #e8f5e9;
          box-shadow: 0 2px 12px rgba(27, 94, 32, 0.06);
        }

        .cart-empty .icon {
          color: #c8e6c9;
          margin-bottom: 16px;
        }

        .cart-empty h3 {
          font-family: 'DM Serif Display', serif;
          color: #2E7D32;
          margin: 0 0 8px;
          font-size: 1.4rem;
        }

        .cart-empty p {
          color: #78909c;
          margin: 0 0 20px;
          font-size: 0.95rem;
        }

        .cart-empty .shop-btn {
          padding: 12px 32px;
          background: linear-gradient(135deg, #2E7D32, #43A047);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s;
        }

        .cart-empty .shop-btn:hover {
          opacity: 0.88;
          transform: translateY(-2px);
        }

        /* ── Cart Content ── */
        .cart-content {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 24px;
          animation: cart-fadeup 0.4s ease both;
        }

        /* ── Cart Items ── */
        .cart-items {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .cart-item {
          background: #fff;
          border-radius: 14px;
          padding: 16px 20px;
          border: 1.5px solid #e8f5e9;
          display: flex;
          gap: 16px;
          transition: border-color 0.2s, box-shadow 0.2s;
          position: relative;
        }

        .cart-item:hover {
          border-color: #a5d6a7;
          box-shadow: 0 2px 12px rgba(27, 94, 32, 0.06);
        }

        .cart-item-image {
          width: 80px;
          height: 80px;
          border-radius: 10px;
          overflow: hidden;
          flex-shrink: 0;
          background: #e8f5e9;
          cursor: pointer;
        }

        .cart-item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .cart-item-image .no-image {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #a5b8a5;
          font-size: 0.7rem;
        }

        .cart-item-image .video-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          background: #1a1a2e;
          color: white;
        }

        .cart-item-image .video-placeholder .video-icon {
          font-size: 2rem;
        }

        .cart-item-image .video-placeholder .video-label {
          font-size: 0.55rem;
          margin-top: 4px;
          opacity: 0.7;
        }

        .cart-item-info {
          flex: 1;
          min-width: 0;
        }

        .cart-item-name {
          font-weight: 600;
          font-size: 0.95rem;
          color: #263238;
          margin: 0 0 2px;
          cursor: pointer;
        }

        .cart-item-name:hover {
          color: #2E7D32;
        }

        .cart-item-farmer {
          font-size: 0.78rem;
          color: #78909c;
          margin: 0 0 6px;
          display: flex;
          align-items: center;
        }

        .cart-item-farmer .farmer-avatar-small {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          object-fit: cover;
          margin-right: 6px;
          border: 1px solid #e8f5e9;
        }

        .cart-item-farmer .farmer-avatar-fallback {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #e8f5e9;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 6px;
          font-size: 0.5rem;
          font-weight: 700;
          color: #2E7D32;
          flex-shrink: 0;
        }

        .cart-item-price {
          font-family: 'DM Serif Display', serif;
          font-size: 1.1rem;
          color: #2E7D32;
          margin: 0;
        }

        .cart-item-price .unit-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.7rem;
          color: #78909c;
          font-weight: 400;
        }

        .cart-item-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 6px;
        }

        .cart-item-qty {
          display: flex;
          align-items: center;
          gap: 4px;
          background: #f5f7f5;
          border-radius: 8px;
          padding: 2px;
        }

        .cart-qty-btn {
          width: 28px;
          height: 28px;
          border: none;
          border-radius: 6px;
          background: transparent;
          color: #546e7a;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          font-size: 14px;
        }

        .cart-qty-btn:hover {
          background: #e8f5e9;
          color: #2E7D32;
        }

        .cart-qty-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .cart-item-qty .qty-value {
          font-weight: 600;
          font-size: 0.9rem;
          color: #263238;
          min-width: 24px;
          text-align: center;
        }

        .cart-item-total {
          font-weight: 600;
          font-size: 0.95rem;
          color: #263238;
        }

        .cart-item-remove {
          padding: 6px 8px;
          border: none;
          background: transparent;
          color: #ef5350;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
        }

        .cart-item-remove:hover {
          background: #ffebee;
        }

        /* ── Cart Summary ── */
        .cart-summary {
          background: #fff;
          border-radius: 14px;
          padding: 24px;
          border: 1.5px solid #e8f5e9;
          height: fit-content;
          position: sticky;
          top: 100px;
        }

        .cart-summary h3 {
          font-family: 'DM Serif Display', serif;
          font-size: 1.2rem;
          color: #1a3d2b;
          margin: 0 0 16px;
        }

        .cart-summary-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 0.92rem;
          color: #546e7a;
        }

        .cart-summary-row.total {
          border-top: 2px solid #e8f5e9;
          margin-top: 8px;
          padding-top: 16px;
          font-weight: 600;
          font-size: 1.1rem;
          color: #263238;
        }

        .cart-summary-row.total .total-price {
          font-family: 'DM Serif Display', serif;
          color: #2E7D32;
          font-size: 1.3rem;
        }

        .cart-checkout-btn {
          width: 100%;
          padding: 14px;
          margin-top: 16px;
          background: linear-gradient(135deg, #2E7D32, #43A047);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .cart-checkout-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(46, 125, 50, 0.3);
        }

        .cart-checkout-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        /* ── Responsive ── */
        @media (max-width: 968px) {
          .cart-content {
            grid-template-columns: 1fr;
          }
          .cart-summary {
            position: static;
          }
        }

        @media (max-width: 640px) {
          .cart-root { padding: 16px 12px; }
          .cart-header { flex-direction: column; align-items: stretch; }
          .cart-header-left h1 { font-size: 1.4rem; }
          .cart-actions { justify-content: flex-start; }
          
          .cart-item {
            flex-direction: column;
            padding: 14px 16px;
          }
          .cart-item-image {
            width: 100%;
            height: 120px;
          }
          .cart-item-actions {
            flex-wrap: wrap;
          }
          .cart-item-total {
            margin-left: auto;
          }
          .cart-summary { padding: 18px; }
        }

        @media (max-width: 400px) {
          .cart-item-actions {
            flex-direction: column;
            align-items: flex-start;
          }
          .cart-item-total {
            margin-left: 0;
          }
        }
      `}</style>

      {/* ── Notification ── */}
      {notification.show && (
        <div className={`cart-notification ${notification.type || 'success'}`}>
          {notification.type === 'success' ? '✅ ' : '⚠️ '}
          {notification.message}
        </div>
      )}

      <div className="cart-root">
        {/* ── Header ── */}
        <div className="cart-header">
          <div className="cart-header-left">
            <button className="cart-back-btn" onClick={() => navigate('/products')}>
              <ArrowLeftIcon size={16} /> Continue Shopping
            </button>
            <h1>Your Cart</h1>
            <span className="badge">{cart.totalItems} items</span>
          </div>
          <div className="cart-actions">
            {cart.items.length > 0 && (
              <button 
                className="cart-clear-btn" 
                onClick={clearCart}
                disabled={updating}
              >
                <TrashIcon size={16} /> Clear Cart
              </button>
            )}
          </div>
        </div>

        {/* ── Cart Content ── */}
        {cart.items.length === 0 ? (
          <div className="cart-empty">
            <div className="icon"><ShoppingCartIcon size={64} /></div>
            <h3>Your cart is empty</h3>
            <p>Browse our marketplace and add fresh products from local farmers.</p>
            <button className="shop-btn" onClick={() => navigate('/products')}>
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="cart-content">
            {/* ── Cart Items ── */}
            <div className="cart-items">
              {cart.items.map((item) => {
                const product = item.product;
                const imageUrl = getProductImage(product);
                const farmerAvatar = getFarmerAvatar(product);
                const farmerName = product.farmerName || product.farmer?.name || 'Unknown Farmer';
                const unitLabel = getUnitLabel(product.unit);
                const itemTotal = product.price * item.quantity;
                const hasVideoMedia = hasVideo(product);
                const videoCount = getVideoCount(product);

                return (
                  <div key={product._id} className="cart-item">
                    <div 
                      className="cart-item-image"
                      onClick={() => handleProductClick(product._id)}
                    >
                      {imageUrl ? (
                        <img src={imageUrl} alt={product.name} />
                      ) : hasVideoMedia ? (
                        <div className="video-placeholder">
                          <span className="video-icon">🎬</span>
                          <span className="video-label">{videoCount} Video{videoCount > 1 ? 's' : ''}</span>
                        </div>
                      ) : (
                        <div className="no-image">No Image</div>
                      )}
                    </div>

                    <div className="cart-item-info">
                      <p 
                        className="cart-item-name"
                        onClick={() => handleProductClick(product._id)}
                      >
                        {product.name}
                      </p>
                      <p className="cart-item-farmer">
                        {farmerAvatar ? (
                          <img 
                            src={farmerAvatar} 
                            alt={farmerName}
                            className="farmer-avatar-small"
                          />
                        ) : (
                          <span className="farmer-avatar-fallback">
                            {getFarmerInitial(farmerName)}
                          </span>
                        )}
                        {farmerName}
                      </p>
                      <p className="cart-item-price">
                        ₱{Number(product.price).toFixed(2)}
                        <span className="unit-label"> / {unitLabel}</span>
                      </p>

                      <div className="cart-item-actions">
                        <div className="cart-item-qty">
                          <button 
                            className="cart-qty-btn"
                            onClick={() => updateQuantity(product._id, item.quantity - 1)}
                            disabled={updating || item.quantity <= 1}
                          >
                            <MinusIcon size={14} />
                          </button>
                          <span className="qty-value">{item.quantity}</span>
                          <button 
                            className="cart-qty-btn"
                            onClick={() => updateQuantity(product._id, item.quantity + 1)}
                            disabled={updating}
                          >
                            <PlusIcon size={14} />
                          </button>
                        </div>

                        <span className="cart-item-total">
                          ₱{itemTotal.toFixed(2)}
                        </span>

                        <button 
                          className="cart-item-remove"
                          onClick={() => removeItem(product._id)}
                          disabled={updating}
                          title="Remove from cart"
                        >
                          <TrashIcon size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Summary ── */}
            <div className="cart-summary">
              <h3>Order Summary</h3>
              <div className="cart-summary-row">
                <span>Subtotal</span>
                <span>₱{cart.totalPrice.toFixed(2)}</span>
              </div>
              <div className="cart-summary-row">
                <span>Items</span>
                <span>{cart.totalItems} items</span>
              </div>
              <div className="cart-summary-row total">
                <span>Total</span>
                <span className="total-price">₱{cart.totalPrice.toFixed(2)}</span>
              </div>
              <button 
                className="cart-checkout-btn"
                onClick={handleCheckout}
                disabled={cart.items.length === 0 || updating}
              >
                <CreditCardIcon size={18} /> Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;