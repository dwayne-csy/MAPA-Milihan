// Mapa-Milihan/frontend/src/Components/User/Checkout.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import UserHeader from '../layouts/Header';
import { getUnitLabel } from '../utils/unitHelpers';

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

// ── Icons ───────────────────────────────────────────────────────────────
const ArrowLeftIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);

const XIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const PlusIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const MinusIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);
  const [cartData, setCartData] = useState(null);
  const [isSoloCheckout, setIsSoloCheckout] = useState(false);
  const [soloProduct, setSoloProduct] = useState(null);
  const [soloQuantity, setSoloQuantity] = useState(1);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  useEffect(() => {
    // Check if it's a solo checkout
    if (location.state?.isSoloCheckout && location.state?.product) {
      setIsSoloCheckout(true);
      setSoloProduct(location.state.product);
      setSoloQuantity(location.state.quantity || 1);
    } else if (location.state?.cart) {
      setCartData(location.state.cart);
    } else {
      // If no data, redirect to cart
      navigate('/cart');
    }
  }, [location, navigate]);

  // ── Quantity Handlers ──
  const handleIncreaseQuantity = () => {
    if (isSoloCheckout && soloProduct) {
      const maxQuantity = soloProduct.stock || 99;
      if (soloQuantity < maxQuantity) {
        setSoloQuantity(prev => prev + 1);
      }
    }
  };

  const handleDecreaseQuantity = () => {
    if (isSoloCheckout && soloProduct) {
      if (soloQuantity > 1) {
        setSoloQuantity(prev => prev - 1);
      }
    }
  };

  const handleQuantityChange = (e) => {
    if (isSoloCheckout && soloProduct) {
      const value = parseInt(e.target.value);
      if (!isNaN(value) && value >= 1) {
        const maxQuantity = soloProduct.stock || 99;
        if (value <= maxQuantity) {
          setSoloQuantity(value);
        }
      }
    }
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      let response;
      let url;

      if (isSoloCheckout) {
        // Solo checkout
        url = `${API_BASE_URL}/api/v1/checkout/solo`;
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            productId: soloProduct._id, 
            quantity: soloQuantity 
          })
        });
      } else {
        // Regular cart checkout
        url = `${API_BASE_URL}/api/v1/checkout`;
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      }

      const data = await response.json();

      if (response.ok) {
        setOrder(data.order);
        // Navigate to confirmation page
        navigate('/checkout/confirmation', { 
          state: { order: data.order } 
        });
      } else {
        setError(data.message || 'Failed to place order');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowCancelConfirm(true);
  };

  const confirmCancel = () => {
    setShowCancelConfirm(false);
    // Navigate back to the appropriate page
    if (isSoloCheckout) {
      navigate('/products');
    } else {
      navigate('/cart');
    }
  };

  const handleBack = () => {
    if (isSoloCheckout) {
      navigate('/products');
    } else {
      navigate('/cart');
    }
  };

  // Helper function to get product image
  const getProductImage = (product) => {
    if (!product) return null;
    
    // Check if product has images array
    if (product.images && product.images.length > 0) {
      const image = product.images[0];
      if (image.url) {
        // Check if it's a video
        if (isVideoUrl(image.url)) {
          return null; // Will show video icon instead
        }
        return image.url.startsWith('http') ? image.url : `${API_BASE_URL}${image.url}`;
      }
    }
    return null;
  };

  // Helper function to check if product has video
  const hasVideo = (product) => {
    if (!product || !product.images) return false;
    return product.images.some(img => isVideoUrl(img.url));
  };

  // Helper function to get video count
  const getVideoCount = (product) => {
    if (!product || !product.images) return 0;
    return product.images.filter(img => isVideoUrl(img.url)).length;
  };

  // Loading state
  if (!cartData && !soloProduct) {
    return (
      <div className="full-bleed w-full min-h-screen bg-gray-50 flex flex-col">
        <UserHeader />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  // Calculate totals for display
  let items = [];
  let subtotal = 0;
  const TAX_RATE = 0.12;
  const SHIPPING_PRICE = 50;

  if (isSoloCheckout && soloProduct) {
    const itemTotal = soloProduct.price * soloQuantity;
    items = [{
      product: soloProduct,
      quantity: soloQuantity,
      total: itemTotal
    }];
    subtotal = itemTotal;
  } else if (cartData) {
    items = cartData.items.map(item => ({
      product: item.product,
      quantity: item.quantity,
      total: item.product.price * item.quantity
    }));
    subtotal = cartData.totalPrice;
  }

  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax + SHIPPING_PRICE;

  // Get back button label
  const backLabel = isSoloCheckout ? 'Back to Products' : 'Back to Cart';

  return (
    <div className="full-bleed w-full min-h-screen bg-gray-50 flex flex-col">
      <UserHeader />
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .checkout-item {
          animation: fadeIn 0.3s ease both;
        }
        
        .checkout-item:nth-child(1) { animation-delay: 0.05s; }
        .checkout-item:nth-child(2) { animation-delay: 0.1s; }
        .checkout-item:nth-child(3) { animation-delay: 0.15s; }
        .checkout-item:nth-child(4) { animation-delay: 0.2s; }
        .checkout-item:nth-child(5) { animation-delay: 0.25s; }

        .cancel-confirm-overlay {
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
          z-index: 9999;
          animation: fadeIn 0.2s ease;
        }

        .cancel-confirm-modal {
          background: white;
          border-radius: 16px;
          padding: 32px;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
          animation: slideIn 0.3s ease;
        }

        .cancel-confirm-modal h3 {
          font-family: 'DM Serif Display', serif;
          font-size: 1.3rem;
          color: #1a3d2b;
          margin: 0 0 8px;
        }

        .cancel-confirm-modal p {
          color: #78909c;
          font-size: 0.95rem;
          margin: 0 0 20px;
        }

        .cancel-confirm-actions {
          display: flex;
          gap: 12px;
        }

        .cancel-confirm-actions button {
          flex: 1;
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cancel-confirm-actions .confirm-btn {
          background: #ef5350;
          color: white;
        }

        .cancel-confirm-actions .confirm-btn:hover {
          background: #c62828;
        }

        .cancel-confirm-actions .cancel-btn {
          background: #e8f5e9;
          color: #2E7D32;
        }

        .cancel-confirm-actions .cancel-btn:hover {
          background: #c8e6c9;
        }

        .checkout-actions {
          display: flex;
          gap: 12px;
          margin-top: 16px;
        }

        .checkout-actions .place-order-btn {
          flex: 2;
          padding: 14px;
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

        .checkout-actions .place-order-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(46, 125, 50, 0.3);
        }

        .checkout-actions .place-order-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .checkout-actions .cancel-order-btn {
          flex: 1;
          padding: 14px 20px;
          border: 1.5px solid #ffebee;
          border-radius: 10px;
          background: #fff;
          color: #c62828;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .checkout-actions .cancel-order-btn:hover {
          background: #ffebee;
          border-color: #ef5350;
        }

        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #fff;
          border: 1.5px solid #e0e7e0;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          color: #546e7a;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 16px;
        }

        .back-btn:hover {
          border-color: #66BB6A;
          color: #2E7D32;
        }

        /* ── Quantity Controls ── */
        .quantity-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
        }

        .quantity-btn {
          width: 28px;
          height: 28px;
          border: 1.5px solid #e0e7e0;
          border-radius: 6px;
          background: #f8faf8;
          color: #2d3748;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          font-size: 1rem;
          font-weight: 600;
          padding: 0;
        }

        .quantity-btn:hover:not(:disabled) {
          background: #e8f5e9;
          border-color: #66BB6A;
          color: #2E7D32;
        }

        .quantity-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .quantity-input {
          width: 48px;
          height: 28px;
          text-align: center;
          border: 1.5px solid #e0e7e0;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 500;
          color: #2d3748;
          background: white;
          outline: none;
          transition: border-color 0.2s;
        }

        .quantity-input:focus {
          border-color: #66BB6A;
        }

        .quantity-input::-webkit-inner-spin-button,
        .quantity-input::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .quantity-input {
          -moz-appearance: textfield;
        }

        .stock-info {
          font-size: 0.7rem;
          color: #94a3b8;
          margin-top: 2px;
        }

        @media (max-width: 640px) {
          .checkout-actions {
            flex-direction: column-reverse;
          }
          .checkout-actions .place-order-btn,
          .checkout-actions .cancel-order-btn {
            flex: 1;
          }
          
          .quantity-controls {
            gap: 6px;
          }
          
          .quantity-btn {
            width: 24px;
            height: 24px;
          }
          
          .quantity-input {
            width: 40px;
            height: 24px;
            font-size: 0.8rem;
          }
        }
      `}</style>

      <div className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-6">
        {/* ── Back Button ── */}
        <button onClick={handleBack} className="back-btn">
          <ArrowLeftIcon size={16} /> {backLabel}
        </button>

        <h1 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            ⚠️ {error}
          </div>
        )}

        {/* ── Order Summary ── */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          
          {items.map((item) => {
            const imageUrl = getProductImage(item.product);
            const hasVideoMedia = hasVideo(item.product);
            const videoCount = getVideoCount(item.product);
            
            return (
              <div key={item.product._id} className="checkout-item flex items-center gap-4 py-3 border-b last:border-b-0">
                <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `
                          <div style="display:flex;align-items:center;justify-content:center;height:100%;color:#a5b8a5;font-size:0.6rem;background:#f5f7f5;">
                            No Image
                          </div>
                        `;
                      }}
                    />
                  ) : hasVideoMedia ? (
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center', 
                      justifyContent: 'center',
                      height: '100%',
                      background: '#1a1a2e',
                      color: 'white'
                    }}>
                      <span style={{ fontSize: '1.5rem' }}>🎬</span>
                      <span style={{ fontSize: '0.5rem', marginTop: '2px', opacity: 0.7 }}>
                        {videoCount} Video{videoCount > 1 ? 's' : ''}
                      </span>
                    </div>
                  ) : (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      height: '100%',
                      color: '#a5b8a5',
                      fontSize: '0.6rem',
                      background: '#f5f7f5'
                    }}>
                      No Image
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.product.name}</p>
                  
                  {/* ── Quantity Controls (only for solo checkout) ── */}
                  {isSoloCheckout && soloProduct && (
                    <div className="quantity-controls">
                      <button 
                        className="quantity-btn"
                        onClick={handleDecreaseQuantity}
                        disabled={soloQuantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        <MinusIcon size={14} />
                      </button>
                      <input
                        type="number"
                        className="quantity-input"
                        value={soloQuantity}
                        onChange={handleQuantityChange}
                        min="1"
                        max={soloProduct.stock || 99}
                        aria-label="Quantity"
                      />
                      <button 
                        className="quantity-btn"
                        onClick={handleIncreaseQuantity}
                        disabled={soloQuantity >= (soloProduct.stock || 99)}
                        aria-label="Increase quantity"
                      >
                        <PlusIcon size={14} />
                      </button>
                      {soloProduct.stock && (
                        <span className="stock-info">
                          Stock: {soloProduct.stock}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* ── Show quantity for cart items (non-editable) ── */}
                  {!isSoloCheckout && (
                    <p className="text-sm text-gray-500">
                      Quantity: {item.quantity}
                    </p>
                  )}
                  
                  <p className="text-sm text-gray-500">
                    ₱{Number(item.product.price).toFixed(2)} per item
                  </p>
                  {item.product.unit && (
                    <p className="text-xs text-gray-400">Unit: {item.product.unit}</p>
                  )}
                </div>
                <p className="font-semibold text-emerald-600">₱{item.total.toFixed(2)}</p>
              </div>
            );
          })}
        </div>

        {/* ── Total Summary ── */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>₱{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span>₱{SHIPPING_PRICE.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax (12%)</span>
              <span>₱{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total</span>
              <span className="text-emerald-600">
                ₱{total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* ── Action Buttons ── */}
          <div className="checkout-actions">
            <button
              className="cancel-order-btn"
              onClick={handleCancel}
            >
              <XIcon size={18} /> Cancel Order
            </button>
            <button
              className="place-order-btn"
              onClick={handlePlaceOrder}
              disabled={loading}
            >
              {loading ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Cancel Confirmation Modal ── */}
      {showCancelConfirm && (
        <div className="cancel-confirm-overlay" onClick={() => setShowCancelConfirm(false)}>
          <div className="cancel-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Cancel Order?</h3>
            <p>
              Are you sure you want to cancel this order? 
              Your cart will be preserved and you can continue shopping.
            </p>
            <div className="cancel-confirm-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowCancelConfirm(false)}
              >
                Continue Checkout
              </button>
              <button 
                className="confirm-btn"
                onClick={confirmCancel}
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;