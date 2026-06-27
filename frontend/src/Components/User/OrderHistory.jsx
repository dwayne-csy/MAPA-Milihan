// Mapa-Milihan/frontend/src/Components/User/OrderHistory.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserHeader from '../layouts/Header';

// ── Icons ───────────────────────────────────────────────────────────────
const PackageIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const CalendarIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const ShoppingBagIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);

const CheckCircleIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const ClockIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#f57c00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const TruckIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#1565C0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 3h15v13H1z"/>
    <path d="M16 8h4l3 3v5h-7V8z"/>
    <circle cx="5.5" cy="18" r="2.5"/>
    <circle cx="18.5" cy="18" r="2.5"/>
  </svg>
);

const XCircleIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#c62828" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);

const ArrowLeftIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);

const OrderHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setOrders(data.orders || []);
      } else {
        setError(data.message || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // ✅ Updated getStatusBadge with new order statuses
  const getStatusBadge = (status) => {
    const statusMap = {
      'Processing': { color: '#f57c00', bg: '#fff3e0', icon: <ClockIcon size={14} /> },
      'Accepted': { color: '#2E7D32', bg: '#e8f5e9', icon: <CheckCircleIcon size={14} /> },
      'Out for Delivery': { color: '#1565C0', bg: '#e3f2fd', icon: <TruckIcon size={14} /> },
      'Delivered': { color: '#2E7D32', bg: '#e8f5e9', icon: <CheckCircleIcon size={14} /> },
      'Cancelled': { color: '#c62828', bg: '#ffebee', icon: <XCircleIcon size={14} /> }
    };
    return statusMap[status] || { color: '#78909c', bg: '#f5f7f5', icon: <ClockIcon size={14} /> };
  };

  const handleOrderClick = (orderId) => {
    navigate(`/orders/${orderId}`);
  };

  // ── Loading State ──
  if (loading) {
    return (
      <div className="full-bleed w-full min-h-screen bg-gray-50 flex flex-col">
        <UserHeader />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your orders...</p>
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

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .orders-root {
          font-family: 'DM Sans', sans-serif;
          flex: 1;
          padding: 32px 20px 60px;
          max-width: 1000px;
          margin: 0 auto;
          width: 100%;
        }

        .orders-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          animation: fadeInUp 0.3s ease both;
        }

        .orders-header h1 {
          font-family: 'DM Serif Display', serif;
          font-size: 1.8rem;
          color: #1a3d2b;
          margin: 0;
        }

        .orders-header .count-badge {
          background: #e8f5e9;
          color: #2E7D32;
          padding: 2px 12px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .orders-back-btn {
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

        .orders-back-btn:hover {
          border-color: #66BB6A;
          color: #2E7D32;
        }

        /* ── Error ── */
        .orders-error {
          background: #ffebee;
          border: 1px solid #ffcdd2;
          color: #c62828;
          padding: 14px 18px;
          border-radius: 10px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .orders-error button {
          padding: 4px 16px;
          background: #ef5350;
          color: #fff;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .orders-error button:hover {
          opacity: 0.85;
        }

        /* ── Empty State ── */
        .orders-empty {
          background: #fff;
          border-radius: 16px;
          padding: 60px 20px;
          text-align: center;
          border: 1.5px solid #e8f5e9;
          box-shadow: 0 2px 12px rgba(27, 94, 32, 0.06);
        }

        .orders-empty .empty-icon {
          color: #c8e6c9;
          margin-bottom: 16px;
        }

        .orders-empty h3 {
          font-family: 'DM Serif Display', serif;
          color: #2E7D32;
          margin: 0 0 8px;
          font-size: 1.3rem;
        }

        .orders-empty p {
          color: #78909c;
          margin: 0 0 20px;
          font-size: 0.95rem;
        }

        .orders-empty .shop-btn {
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

        .orders-empty .shop-btn:hover {
          opacity: 0.88;
          transform: translateY(-2px);
        }

        /* ── Order Cards ── */
        .order-card {
          background: #fff;
          border-radius: 14px;
          border: 1.5px solid #e8f5e9;
          box-shadow: 0 2px 12px rgba(27, 94, 32, 0.06);
          padding: 20px 24px;
          margin-bottom: 16px;
          cursor: pointer;
          transition: all 0.2s;
          animation: fadeInUp 0.3s ease both;
        }

        .order-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(27, 94, 32, 0.1);
          border-color: #a5d6a7;
        }

        .order-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 12px;
        }

        .order-id {
          font-weight: 600;
          color: #263238;
          font-size: 0.95rem;
        }

        .order-id .id-label {
          color: #78909c;
          font-weight: 400;
        }

        .order-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 14px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .order-meta {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          font-size: 0.82rem;
          color: #78909c;
        }

        .order-meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .order-items-preview {
          display: flex;
          gap: 8px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e8f5e9;
          flex-wrap: wrap;
        }

        .order-item-preview {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f5f7f5;
          padding: 4px 10px 4px 6px;
          border-radius: 6px;
          font-size: 0.8rem;
          color: #546e7a;
        }

        .order-item-preview .item-image {
          width: 28px;
          height: 28px;
          border-radius: 4px;
          overflow: hidden;
          background: #e8f5e9;
          flex-shrink: 0;
        }

        .order-item-preview .item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .order-item-preview .item-name {
          max-width: 120px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .order-total {
          font-weight: 600;
          color: #2E7D32;
          font-size: 0.95rem;
          margin-left: auto;
        }

        @media (max-width: 640px) {
          .orders-root { padding: 16px 12px; }
          .orders-header { flex-wrap: wrap; }
          .orders-header h1 { font-size: 1.4rem; }
          .order-card { padding: 16px; }
          .order-card-top { flex-direction: column; }
          .order-meta { gap: 12px; }
          .order-items-preview { flex-direction: column; }
          .order-item-preview { width: 100%; }
          .order-item-preview .item-name { max-width: none; }
        }
      `}</style>

      <div className="orders-root">
        {/* ── Header ── */}
        <div className="orders-header">
          <button className="orders-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeftIcon size={16} /> Back
          </button>
          <h1>Order History</h1>
          <span className="count-badge">{orders.length} orders</span>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="orders-error">
            <span>⚠️ {error}</span>
            <button onClick={fetchOrders}>Retry</button>
          </div>
        )}

        {/* ── Orders ── */}
        {orders.length === 0 ? (
          <div className="orders-empty">
            <div className="empty-icon"><PackageIcon size={64} /></div>
            <h3>No orders yet</h3>
            <p>You haven't placed any orders yet. Start shopping now!</p>
            <button className="shop-btn" onClick={() => navigate('/products')}>
              Start Shopping
            </button>
          </div>
        ) : (
          orders.map((order, index) => {
            const statusInfo = getStatusBadge(order.orderStatus);
            const totalItems = order.orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

            return (
              <div 
                key={order._id} 
                className="order-card"
                onClick={() => handleOrderClick(order._id)}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="order-card-top">
                  <div className="order-id">
                    <span className="id-label">Order #</span>
                    {order._id?.slice(-8) || 'N/A'}
                  </div>
                  <div 
                    className="order-status"
                    style={{ 
                      backgroundColor: statusInfo.bg, 
                      color: statusInfo.color 
                    }}
                  >
                    {statusInfo.icon} {order.orderStatus || 'Processing'}
                  </div>
                </div>

                <div className="order-meta">
                  <span className="order-meta-item">
                    <CalendarIcon size={14} /> {formatDate(order.createdAt)}
                  </span>
                  <span className="order-meta-item">
                    <ShoppingBagIcon size={14} /> {totalItems} item{totalItems > 1 ? 's' : ''}
                  </span>
                  <span className="order-meta-item">
                    💳 {order.paymentMethod || 'Cash on Delivery'}
                  </span>
                </div>

                <div className="order-items-preview">
                  {order.orderItems?.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="order-item-preview">
                      <div className="item-image">
                        {item.image ? (
                          <img src={item.image} alt={item.name} />
                        ) : (
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            height: '100%',
                            color: '#a5b8a5',
                            fontSize: '0.5rem'
                          }}>
                            No img
                          </div>
                        )}
                      </div>
                      <span className="item-name">{item.name}</span>
                      <span style={{ color: '#78909c', fontSize: '0.7rem' }}>
                        ×{item.quantity}
                      </span>
                    </div>
                  ))}
                  {order.orderItems?.length > 4 && (
                    <span style={{ fontSize: '0.8rem', color: '#78909c', padding: '4px 8px' }}>
                      +{order.orderItems.length - 4} more
                    </span>
                  )}
                  <span className="order-total">
                    ₱{order.totalPrice?.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default OrderHistory;