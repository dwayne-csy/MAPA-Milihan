import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import FarmerHeader from '../../layouts/FarmerHeader';

// ── Icons ───────────────────────────────────────────────────────────────
const ArrowLeftIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
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

const MapPinIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const UserIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const PhoneIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.07 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3 2.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21 16.92z"/>
  </svg>
);

const EmailIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
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
const ViewOrder = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Please login to view order details');
        setLoading(false);
        return;
      }
      
      console.log('🔍 Fetching order details for ID:', id);
      
      const response = await fetch(`${API_BASE_URL}/api/v1/manage-orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setOrder(data.order);
      } else {
        setError(data.message || 'Failed to fetch order details');
        console.error('❌ Error response:', data);
      }
    } catch (err) {
      console.error('❌ Fetch order error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate('/farmer/orders');
  };

  const handleStatusUpdate = async () => {
    if (!selectedStatus) return;

    try {
      setUpdating(true);
      const token = localStorage.getItem('token');
      
      console.log('📝 Updating order status to:', selectedStatus);
      
      const response = await fetch(`${API_BASE_URL}/api/v1/manage-orders/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: selectedStatus })
      });

      const data = await response.json();

      if (response.ok) {
        setOrder(data.order);
        setShowStatusModal(false);
        setSelectedStatus('');
        setSuccessMessage(`Order status updated to "${selectedStatus}" successfully!`);
        // Refresh order details after a short delay
        setTimeout(() => {
          fetchOrderDetails();
        }, 500);
      } else {
        setError(data.message || 'Failed to update order status');
        console.error('❌ Error response:', data);
      }
    } catch (err) {
      console.error('❌ Update status error:', err);
      setError('Network error. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const openStatusModal = (status) => {
    setSelectedStatus(status);
    setShowStatusModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusActions = (currentStatus) => {
    const actions = {
      'Processing': ['Accepted', 'Cancelled'],
      'Accepted': ['Out for Delivery'],
      'Out for Delivery': ['Delivered'],
      'Delivered': [],
      'Cancelled': []
    };
    return actions[currentStatus] || [];
  };

  // Check if status can be changed
  const canChangeStatus = (currentStatus) => {
    return currentStatus !== 'Delivered' && currentStatus !== 'Cancelled';
  };

  // ── Loading State ──
  if (loading) {
    return (
      <div className="full-bleed w-full min-h-screen bg-[#f5f7f5] flex flex-col">
        <FarmerHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#c8e6c9] border-t-[#2E7D32] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#546e7a] font-['DM_Sans'] text-sm">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Error State ──
  if (error || !order) {
    return (
      <div className="full-bleed w-full min-h-screen bg-[#f5f7f5] flex flex-col">
        <FarmerHeader />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center border border-red-100 shadow-lg">
            <AlertTriangleIcon size={48} className="text-red-500 mx-auto" />
            <h3 className="text-red-700 text-xl font-bold mt-4 mb-2">
              {error || 'Order not found'}
            </h3>
            <p className="text-gray-500 text-sm">
              The order you're looking for might have been removed or is no longer available.
            </p>
            <button
              onClick={handleGoBack}
              className="mt-6 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors"
            >
              Back to Orders
            </button>
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

        @keyframes vo-fadeup {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .vo-root {
          font-family: 'DM Sans', sans-serif;
          flex: 1;
          padding: 32px 20px;
        }

        .vo-container {
          max-width: 1000px;
          margin: 0 auto;
        }

        .vo-back-btn {
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

        .vo-back-btn:hover {
          border-color: #66BB6A;
          color: #2E7D32;
          transform: translateX(-4px);
        }

        .vo-card {
          background: #fff;
          border-radius: 16px;
          border: 1.5px solid #e8f5e9;
          box-shadow: 0 2px 20px rgba(27, 94, 32, 0.08);
          animation: vo-fadeup 0.4s ease both;
          overflow: hidden;
        }

        .vo-card-header {
          padding: 24px 32px;
          background: linear-gradient(135deg, #f8faf8, #e8f5e9);
          border-bottom: 1.5px solid #e8f5e9;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .vo-card-header h2 {
          font-family: 'DM Serif Display', serif;
          font-size: 1.3rem;
          color: #1a3d2b;
          margin: 0;
        }

        .vo-card-header .order-id {
          color: #78909c;
          font-size: 0.9rem;
          font-weight: 400;
        }

        .vo-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          border: 1px solid;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .vo-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }

        .vo-card-body {
          padding: 32px;
        }

        .vo-section {
          margin-bottom: 32px;
        }

        .vo-section:last-child {
          margin-bottom: 0;
        }

        .vo-section-title {
          font-size: 0.8rem;
          font-weight: 600;
          color: #78909c;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 12px;
        }

        /* ── Customer Info ── */
        .vo-customer-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .vo-customer-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: #f8faf8;
          border-radius: 10px;
        }

        .vo-customer-item .icon {
          color: #66BB6A;
          flex-shrink: 0;
        }

        .vo-customer-item .info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .vo-customer-item .label {
          font-size: 0.7rem;
          color: #78909c;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .vo-customer-item .value {
          font-size: 0.95rem;
          color: #263238;
          font-weight: 500;
          word-break: break-word;
        }

        /* ── Order Items ── */
        .vo-items-table {
          width: 100%;
          border-collapse: collapse;
        }

        .vo-items-table thead th {
          text-align: left;
          padding: 10px 12px;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #78909c;
          font-weight: 600;
          border-bottom: 2px solid #e8f5e9;
        }

        .vo-items-table tbody td {
          padding: 10px 12px;
          font-size: 0.92rem;
          color: #37474f;
          border-bottom: 1px solid #f5f7f5;
        }

        .vo-items-table tbody tr:last-child td {
          border-bottom: none;
        }

        .vo-items-table .item-name {
          font-weight: 500;
        }

        .vo-items-table .item-qty {
          text-align: center;
          color: #78909c;
        }

        .vo-items-table .item-price {
          text-align: right;
          font-weight: 500;
          color: #2E7D32;
        }

        .vo-items-total {
          display: flex;
          justify-content: flex-end;
          padding: 16px 12px 0;
          border-top: 2px solid #e8f5e9;
          margin-top: 8px;
        }

        .vo-items-total .total-row {
          display: flex;
          justify-content: space-between;
          gap: 40px;
          font-size: 0.95rem;
          color: #37474f;
        }

        .vo-items-total .total-row .grand-total {
          font-weight: 700;
          font-size: 1.1rem;
          color: #2E7D32;
        }

        /* ── Status Actions ── */
        .vo-status-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .vo-status-btn {
          padding: 10px 24px;
          border: none;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s;
          color: #fff;
        }

        .vo-status-btn:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }

        .vo-status-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .vo-status-btn.accepted {
          background: #3b82f6;
        }

        .vo-status-btn.out-for-delivery {
          background: #8b5cf6;
        }

        .vo-status-btn.delivered {
          background: #22c55e;
        }

        .vo-status-btn.cancelled {
          background: #ef4444;
        }

        .vo-no-actions {
          color: #78909c;
          font-size: 0.92rem;
        }

        .vo-success-message {
          padding: 12px 16px;
          background: #e8f5e9;
          border-left: 4px solid #22c55e;
          color: #2E7D32;
          border-radius: 8px;
          margin-top: 12px;
          font-weight: 500;
          animation: slideDown 0.3s ease both;
        }

        /* ── Modal ── */
        .vo-modal-overlay {
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
          animation: vo-fadeup 0.25s ease both;
        }

        .vo-modal {
          background: #fff;
          border-radius: 16px;
          max-width: 440px;
          width: 100%;
          padding: 32px;
          box-shadow: 0 24px 64px rgba(27, 94, 32, 0.2);
          text-align: center;
        }

        .vo-modal-icon {
          margin: 0 auto 16px;
        }

        .vo-modal h3 {
          font-family: 'DM Serif Display', serif;
          font-size: 1.3rem;
          color: #1a3d2b;
          margin: 0 0 8px;
        }

        .vo-modal p {
          color: #78909c;
          font-size: 0.95rem;
          margin: 0 0 24px;
          line-height: 1.5;
        }

        .vo-modal-actions {
          display: flex;
          gap: 12px;
        }

        .vo-modal-btn {
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

        .vo-modal-btn:hover {
          opacity: 0.85;
        }

        .vo-modal-btn.confirm {
          background: linear-gradient(135deg, #2E7D32, #43A047);
          color: #fff;
        }

        .vo-modal-btn.cancel {
          background: #e8f5e9;
          color: #2E7D32;
        }

        .vo-modal-btn.confirm.danger {
          background: linear-gradient(135deg, #c62828, #d32f2f);
        }

        .vo-modal-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .vo-card-header {
            flex-direction: column;
            align-items: stretch;
            text-align: center;
          }
          .vo-customer-grid {
            grid-template-columns: 1fr;
          }
          .vo-items-table {
            font-size: 0.85rem;
          }
          .vo-items-table thead th,
          .vo-items-table tbody td {
            padding: 8px;
          }
          .vo-status-actions {
            justify-content: center;
          }
          .vo-root {
            padding: 16px;
          }
          .vo-card-body {
            padding: 20px;
          }
          .vo-modal-actions {
            flex-direction: column;
          }
        }
      `}</style>

      <div className="vo-root">
        <div className="vo-container">
          {/* ── Back Button ── */}
          <button className="vo-back-btn" onClick={handleGoBack}>
            <ArrowLeftIcon size={18} /> Back to Orders
          </button>

          {/* ── Order Card ── */}
          <div className="vo-card">
            {/* Card Header */}
            <div className="vo-card-header">
              <div>
                <h2>
                  Order #{order._id.slice(-6)}
                  <span className="order-id"> • {formatDate(order.createdAt)}</span>
                </h2>
              </div>
              <span className={`vo-status-badge ${getStatusColor(order.orderStatus)}`}>
                <span className={`vo-status-dot ${getStatusDot(order.orderStatus)}`} />
                {order.orderStatus}
              </span>
            </div>

            {/* Card Body */}
            <div className="vo-card-body">
              {/* ── Success Message ── */}
              {successMessage && (
                <div className="vo-success-message">
                  <CheckIcon size={16} style={{ display: 'inline', marginRight: '8px' }} />
                  {successMessage}
                </div>
              )}

              {/* ── Customer Information ── */}
              <div className="vo-section">
                <div className="vo-section-title">Customer Information</div>
                <div className="vo-customer-grid">
                  <div className="vo-customer-item">
                    <span className="icon"><UserIcon size={18} /></span>
                    <div className="info">
                      <span className="label">Name</span>
                      <span className="value">{order.user?.name || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="vo-customer-item">
                    <span className="icon"><EmailIcon size={18} /></span>
                    <div className="info">
                      <span className="label">Email</span>
                      <span className="value">{order.user?.email || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="vo-customer-item">
                    <span className="icon"><PhoneIcon size={18} /></span>
                    <div className="info">
                      <span className="label">Contact</span>
                      <span className="value">{order.user?.contact || order.shippingInfo?.phoneNo || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="vo-customer-item" style={{ gridColumn: '1 / -1' }}>
                    <span className="icon"><MapPinIcon size={18} /></span>
                    <div className="info">
                      <span className="label">Shipping Address</span>
                      <span className="value">{order.shippingInfo?.address || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Order Items ── */}
              <div className="vo-section">
                <div className="vo-section-title">Order Items</div>
                <table className="vo-items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th style={{ textAlign: 'center' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Unit Price</th>
                      <th style={{ textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.orderItems.map((item, index) => (
                      <tr key={index}>
                        <td className="item-name">{item.name}</td>
                        <td className="item-qty">×{item.quantity}</td>
                        <td className="item-price" style={{ textAlign: 'right' }}>₱{item.price.toFixed(2)}</td>
                        <td className="item-price" style={{ textAlign: 'right' }}>₱{(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="vo-items-total">
                  <div className="total-row">
                    <div>
                      <div>Subtotal: ₱{order.itemsPrice?.toFixed(2) || '0.00'}</div>
                      <div>Shipping: ₱{order.shippingPrice?.toFixed(2) || '0.00'}</div>
                      <div>Tax (12%): ₱{order.taxPrice?.toFixed(2) || '0.00'}</div>
                    </div>
                    <div className="grand-total">
                      Total: ₱{order.totalPrice?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Status Actions ── */}
              <div className="vo-section">
                <div className="vo-section-title">Update Order Status</div>
                {canChangeStatus(order.orderStatus) ? (
                  <div className="vo-status-actions">
                    {getStatusActions(order.orderStatus).map((status) => {
                      const statusClass = status.toLowerCase().replace(/\s/g, '-');
                      const isDanger = status === 'Cancelled';
                      return (
                        <button
                          key={status}
                          className={`vo-status-btn ${statusClass}`}
                          onClick={() => openStatusModal(status)}
                          disabled={updating}
                        >
                          Mark as {status}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <span className="vo-no-actions">
                    {order.orderStatus === 'Delivered' 
                      ? '✅ Order has been delivered. No further actions available.'
                      : order.orderStatus === 'Cancelled'
                      ? '❌ Order has been cancelled. No further actions available.'
                      : 'No actions available for this order.'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Status Update Modal ── */}
      {showStatusModal && (
        <div className="vo-modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="vo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="vo-modal-icon">
              {selectedStatus === 'Cancelled' ? (
                <AlertTriangleIcon size={48} className="text-red-500" />
              ) : (
                <CheckIcon size={48} className="text-emerald-500" />
              )}
            </div>
            <h3>Update Order Status</h3>
            <p>
              Are you sure you want to mark this order as <strong>"{selectedStatus}"</strong>?
              {selectedStatus === 'Cancelled' && (
                <span style={{ color: '#ef4444', display: 'block', marginTop: '8px' }}>
                  ⚠️ This will restore product quantities to stock.
                </span>
              )}
            </p>
            <div className="vo-modal-actions">
              <button 
                className="vo-modal-btn cancel" 
                onClick={() => setShowStatusModal(false)}
                disabled={updating}
              >
                Cancel
              </button>
              <button 
                className={`vo-modal-btn confirm ${selectedStatus === 'Cancelled' ? 'danger' : ''}`}
                onClick={handleStatusUpdate}
                disabled={updating}
              >
                {updating ? 'Updating...' : `Confirm ${selectedStatus}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewOrder;