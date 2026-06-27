import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FarmerHeader from '../../layouts/FarmerHeader';

// ── Icons ───────────────────────────────────────────────────────────────
const EyeIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const SearchIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

const RefreshIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

const PackageIcon = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"/>
  </svg>
);

const CheckIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5"/>
  </svg>
);

// ── Status Badge Colors ──────────────────────────────────────────────
const getStatusColor = (status) => {
  const colors = {
    'Processing': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'Accepted': 'bg-blue-100 text-blue-800 border-blue-300',
    'Out for Delivery': 'bg-purple-100 text-purple-800 border-purple-300',
    'Delivered': 'bg-green-100 text-green-800 border-green-300',
    'Cancelled': 'bg-red-100 text-red-800 border-red-300'
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
};

const getStatusDot = (status) => {
  const colors = {
    'Processing': 'bg-yellow-500',
    'Accepted': 'bg-blue-500',
    'Out for Delivery': 'bg-purple-500',
    'Delivered': 'bg-green-500',
    'Cancelled': 'bg-red-500'
  };
  return colors[status] || 'bg-gray-500';
};

// ── Component ───────────────────────────────────────────────────────────
const OrderList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, searchTerm]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Please login to view orders');
        setLoading(false);
        return;
      }
      
      const params = new URLSearchParams();
      
      if (statusFilter && statusFilter !== 'All') {
        params.append('status', statusFilter);
      }
      
      if (searchTerm) {
        params.append('search', searchTerm.trim());
      }
      
      const url = `${API_BASE_URL}/api/v1/manage-orders${params.toString() ? `?${params.toString()}` : ''}`;

      console.log('🔍 Fetching orders from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setOrders(data.orders || []);
      } else {
        setError(data.message || 'Failed to fetch orders');
        console.error('❌ Error response:', data);
      }
    } catch (err) {
      console.error('❌ Fetch orders error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (orderId) => {
    navigate(`/farmer/order/${orderId}`);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingOrderId(orderId);
      const token = localStorage.getItem('token');
      
      console.log(`📝 Updating order ${orderId} status to: ${newStatus}`);
      
      const response = await fetch(`${API_BASE_URL}/api/v1/manage-orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (response.ok) {
        // Update the order in the local state
        setOrders(orders.map(order => 
          order._id === orderId ? { ...order, orderStatus: newStatus } : order
        ));
        console.log(`✅ Order ${orderId} status updated to: ${newStatus}`);
      } else {
        setError(data.message || 'Failed to update order status');
        console.error('❌ Error response:', data);
      }
    } catch (err) {
      console.error('❌ Update status error:', err);
      setError('Network error. Please try again.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get available status options based on current status
  const getAvailableStatuses = (currentStatus) => {
    const allStatuses = [
      'Processing',
      'Accepted',
      'Out for Delivery',
      'Delivered',
      'Cancelled'
    ];

    // If status is not Processing, Cancelled is disabled
    if (currentStatus !== 'Processing') {
      return allStatuses.filter(status => status !== 'Cancelled');
    }

    return allStatuses;
  };

  // ── Loading State ──
  if (loading) {
    return (
      <div className="full-bleed w-full min-h-screen bg-[#f5f7f5] flex flex-col">
        <FarmerHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#c8e6c9] border-t-[#2E7D32] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#546e7a] font-['DM_Sans'] text-sm">Loading orders...</p>
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

        @keyframes ol-fadeup {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .ol-root {
          font-family: 'DM Sans', sans-serif;
          flex: 1;
          padding: 32px 20px;
        }

        .ol-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .ol-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 28px;
          animation: ol-fadeup 0.3s ease both;
        }

        .ol-header-left h1 {
          font-family: 'DM Serif Display', serif;
          font-size: 1.8rem;
          color: #1a3d2b;
          margin: 0;
        }

        .ol-header-left p {
          margin: 2px 0 0;
          color: #78909c;
          font-size: 0.92rem;
        }

        .ol-filters {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .ol-search-wrap {
          position: relative;
        }

        .ol-search-wrap .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #a5b8a5;
        }

        .ol-search-input {
          padding: 10px 16px 10px 40px;
          border: 1.5px solid #e0e7e0;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          background: #fff;
          width: 220px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .ol-search-input:focus {
          outline: none;
          border-color: #66BB6A;
          box-shadow: 0 0 0 4px rgba(46, 125, 50, 0.08);
        }

        .ol-status-select {
          padding: 10px 16px;
          border: 1.5px solid #e0e7e0;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          background: #fff;
          color: #263238;
          transition: border-color 0.2s, box-shadow 0.2s;
          cursor: pointer;
        }

        .ol-status-select:focus {
          outline: none;
          border-color: #66BB6A;
          box-shadow: 0 0 0 4px rgba(46, 125, 50, 0.08);
        }

        .ol-refresh-btn {
          padding: 10px 14px;
          background: #fff;
          border: 1.5px solid #e0e7e0;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          color: #546e7a;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .ol-refresh-btn:hover {
          border-color: #66BB6A;
          color: #2E7D32;
        }

        .ol-alert {
          padding: 14px 18px;
          border-radius: 10px;
          margin-bottom: 20px;
          font-size: 0.92rem;
          background: #ffebee;
          border-left: 4px solid #ef5350;
          color: #c62828;
          animation: ol-fadeup 0.3s ease both;
        }

        .ol-empty {
          background: #fff;
          border-radius: 16px;
          padding: 60px 20px;
          text-align: center;
          border: 1.5px solid #e8f5e9;
          box-shadow: 0 2px 12px rgba(27, 94, 32, 0.06);
          animation: ol-fadeup 0.3s ease both;
        }

        .ol-empty .icon {
          color: #a5d6a7;
          margin-bottom: 14px;
        }

        .ol-empty h3 {
          font-family: 'DM Serif Display', serif;
          color: #2E7D32;
          margin: 0 0 8px;
          font-size: 1.3rem;
        }

        .ol-empty p {
          color: #78909c;
          margin: 0;
          font-size: 0.95rem;
        }

        .ol-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          animation: ol-fadeup 0.4s ease both;
        }

        .ol-order-card {
          background: #fff;
          border-radius: 12px;
          border: 1.5px solid #e8f5e9;
          box-shadow: 0 2px 8px rgba(27, 94, 32, 0.06);
          transition: all 0.3s ease;
          overflow: hidden;
        }

        .ol-order-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(27, 94, 32, 0.1);
          border-color: #a5d6a7;
        }

        .ol-order-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: #f8faf8;
          border-bottom: 1px solid #e8f5e9;
          flex-wrap: wrap;
          gap: 8px;
        }

        .ol-order-id {
          font-weight: 600;
          color: #1a3d2b;
          font-size: 0.95rem;
          cursor: pointer;
        }

        .ol-order-id span {
          color: #78909c;
          font-weight: 400;
        }

        .ol-order-date {
          font-size: 0.82rem;
          color: #78909c;
        }

        .ol-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 14px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          border: 1px solid;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .ol-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }

        .ol-order-body {
          padding: 16px 20px;
        }

        .ol-order-items {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .ol-order-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 0;
          font-size: 0.9rem;
          color: #37474f;
          border-bottom: 1px solid #f5f7f5;
        }

        .ol-order-item:last-child {
          border-bottom: none;
        }

        .ol-item-name {
          flex: 1;
        }

        .ol-item-qty {
          color: #78909c;
          margin: 0 12px;
        }

        .ol-item-price {
          font-weight: 500;
          color: #2E7D32;
        }

        .ol-order-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          background: #f8faf8;
          border-top: 1px solid #e8f5e9;
          flex-wrap: wrap;
          gap: 12px;
        }

        .ol-order-total {
          font-weight: 600;
          color: #1a3d2b;
        }

        .ol-order-total span {
          color: #2E7D32;
          font-size: 1.1rem;
        }

        .ol-status-dropdown {
          padding: 6px 12px;
          border: 1.5px solid #e0e7e0;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          background: #fff;
          color: #263238;
          cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s;
          min-width: 140px;
        }

        .ol-status-dropdown:focus {
          outline: none;
          border-color: #66BB6A;
          box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.1);
        }

        .ol-status-dropdown:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .ol-status-dropdown option:disabled {
          color: #ccc;
        }

        .ol-view-btn {
          padding: 6px 16px;
          background: linear-gradient(135deg, #2E7D32, #43A047);
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
          transition: opacity 0.2s, transform 0.15s;
          white-space: nowrap;
        }

        .ol-view-btn:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }

        .ol-customer-name {
          font-size: 0.85rem;
          color: #546e7a;
          cursor: pointer;
        }

        .ol-customer-name strong {
          color: #263238;
        }

        .ol-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        @media (max-width: 768px) {
          .ol-header {
            flex-direction: column;
            align-items: stretch;
          }
          .ol-filters {
            flex-direction: column;
          }
          .ol-search-input {
            width: 100%;
          }
          .ol-status-select {
            width: 100%;
          }
          .ol-order-header {
            flex-direction: column;
            align-items: stretch;
            text-align: center;
          }
          .ol-order-footer {
            flex-direction: column;
            align-items: stretch;
            text-align: center;
          }
          .ol-actions {
            justify-content: center;
          }
          .ol-root {
            padding: 16px;
          }
        }
      `}</style>

      <div className="ol-root">
        <div className="ol-container">
          {/* ── Header ── */}
          <div className="ol-header">
            <div className="ol-header-left">
              <h1>📦 Manage Orders</h1>
              <p>{orders.length} order{orders.length !== 1 ? 's' : ''} found</p>
            </div>
            <div className="ol-filters">
              <div className="ol-search-wrap">
                <span className="search-icon"><SearchIcon /></span>
                <input
                  type="text"
                  className="ol-search-input"
                  placeholder="Search by order ID or customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="ol-status-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Processing">Processing</option>
                <option value="Accepted">Accepted</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <button className="ol-refresh-btn" onClick={fetchOrders}>
                <RefreshIcon size={16} /> Refresh
              </button>
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="ol-alert">
              {error}
            </div>
          )}

          {/* ── Content ── */}
          {orders.length === 0 ? (
            <div className="ol-empty">
              <div className="icon"><PackageIcon size={48} /></div>
              <h3>{searchTerm || statusFilter !== 'All' ? 'No matching orders' : 'No Orders Yet'}</h3>
              <p>
                {searchTerm || statusFilter !== 'All'
                  ? 'Try adjusting your filters or search terms.'
                  : 'Orders from customers will appear here once they place an order.'}
              </p>
            </div>
          ) : (
            <div className="ol-grid">
              {orders.map((order) => {
                const availableStatuses = getAvailableStatuses(order.orderStatus);
                const isUpdating = updatingOrderId === order._id;

                return (
                  <div key={order._id} className="ol-order-card">
                    {/* Order Header */}
                    <div className="ol-order-header">
                      <div>
                        <div 
                          className="ol-order-id"
                          onClick={() => handleViewOrder(order._id)}
                        >
                          Order #{order._id.slice(-6)}
                          <span> • {order.orderItems.length} item{order.orderItems.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div 
                          className="ol-customer-name"
                          onClick={() => handleViewOrder(order._id)}
                        >
                          <strong>{order.user?.name || 'Unknown Customer'}</strong>
                          {' • '}{order.user?.email || 'No email'}
                        </div>
                      </div>
                      <div className="ol-order-date">
                        {formatDate(order.createdAt)}
                      </div>
                    </div>

                    {/* Order Body */}
                    <div 
                      className="ol-order-body"
                      onClick={() => handleViewOrder(order._id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="ol-order-items">
                        {order.orderItems.slice(0, 3).map((item, index) => (
                          <div key={index} className="ol-order-item">
                            <span className="ol-item-name">{item.name}</span>
                            <span className="ol-item-qty">×{item.quantity}</span>
                            <span className="ol-item-price">₱{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                        {order.orderItems.length > 3 && (
                          <div className="ol-order-item" style={{ color: '#78909c', fontSize: '0.82rem' }}>
                            <span>+ {order.orderItems.length - 3} more item{order.orderItems.length - 3 !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Footer */}
                    <div className="ol-order-footer">
                      <div className="ol-order-total">
                        Total: <span>₱{order.totalPrice?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="ol-actions">
                        <span className={`ol-status-badge ${getStatusColor(order.orderStatus)}`}>
                          <span className={`ol-status-dot ${getStatusDot(order.orderStatus)}`} />
                          {order.orderStatus}
                        </span>

                        {/* Status Dropdown */}
                        <select
                          className="ol-status-dropdown"
                          value={order.orderStatus}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          disabled={isUpdating || order.orderStatus === 'Delivered' || order.orderStatus === 'Cancelled'}
                        >
                          {availableStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                          {/* Show disabled Cancelled option if not available */}
                          {order.orderStatus !== 'Processing' && order.orderStatus !== 'Cancelled' && (
                            <option value="Cancelled" disabled>
                              Cancelled (Not Allowed)
                            </option>
                          )}
                        </select>

                        <button 
                          className="ol-view-btn"
                          onClick={() => handleViewOrder(order._id)}
                        >
                          <EyeIcon size={16} /> View
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

export default OrderList;