import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import UserHeader from '../layouts/Header';
import { 
  FiArrowLeft, 
  FiPackage, 
  FiClock, 
  FiCheckCircle, 
  FiXCircle, 
  FiTruck, 
  FiMapPin,
  FiDollarSign,
  FiCreditCard,
  FiUser,
  FiCalendar
} from 'react-icons/fi';
import { MdWallet } from 'react-icons/md';

const OrderDetails = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const token = localStorage.getItem('token');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/v1/orders/my-orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setOrder(response.data.order);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to load order details');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    try {
      setCancelling(true);
      const response = await axios.put(
        `${API_BASE_URL}/api/v1/orders/${orderId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Order cancelled successfully');
        fetchOrderDetails();
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Processing': return 'bg-blue-100 text-blue-800';
      case 'Accepted': return 'bg-indigo-100 text-indigo-800';
      case 'Out for Delivery': return 'bg-purple-100 text-purple-800';
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return <FiClock className="text-yellow-600" />;
      case 'Processing': return <FiPackage className="text-blue-600" />;
      case 'Accepted': return <FiCheckCircle className="text-indigo-600" />;
      case 'Out for Delivery': return <FiTruck className="text-purple-600" />;
      case 'Delivered': return <FiCheckCircle className="text-green-600" />;
      case 'Cancelled': return <FiXCircle className="text-red-600" />;
      default: return <FiClock className="text-gray-600" />;
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'Wallet': return <MdWallet className="text-green-500 text-lg" />;
      case 'Cash on Delivery': return <FiCreditCard className="text-blue-500 text-lg" />;
      default: return <FiDollarSign className="text-gray-500 text-lg" />;
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'text-green-600';
      case 'Pending': return 'text-yellow-600';
      case 'Failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="full-bleed w-full min-h-screen bg-gray-50 flex flex-col">
        <UserHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-green-200 border-t-green-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="full-bleed w-full min-h-screen bg-gray-50 flex flex-col">
        <UserHeader />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Order not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="full-bleed w-full min-h-screen bg-gray-50 flex flex-col">
      <UserHeader />

      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/orders')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
        >
          <FiArrowLeft size={20} />
          <span className="text-sm font-medium">Back to Orders</span>
        </button>

        {/* Order Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                Order #{order._id.slice(-8).toUpperCase()}
              </h1>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <FiCalendar className="text-gray-400" />
                {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(order.orderStatus)} flex items-center gap-2`}>
                {getStatusIcon(order.orderStatus)}
                <span>{order.orderStatus}</span>
              </div>
              {order.orderStatus === 'Processing' && (
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Items & Shipping */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-gray-800 mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.orderItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <img 
                      src={item.image || '/default-product.png'} 
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-800">{item.name}</h3>
                      <p className="text-xs text-gray-500">Farmer: {item.farmerName}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      <p className="text-sm font-semibold text-green-600">₱{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FiMapPin className="text-green-500" />
                Shipping Address
              </h2>
              <div className="space-y-1 text-sm text-gray-700">
                <p><span className="font-medium">Street:</span> {order.shippingInfo?.street || order.shippingAddress?.street || ''}</p>
                <p><span className="font-medium">Barangay:</span> {order.shippingInfo?.barangay || order.shippingAddress?.barangay || ''}</p>
                <p><span className="font-medium">City:</span> {order.shippingInfo?.city || order.shippingAddress?.city || ''}</p>
                <p><span className="font-medium">Zipcode:</span> {order.shippingInfo?.zipcode || order.shippingAddress?.zipcode || ''}</p>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-gray-800 mb-4">Order Summary</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₱{order.itemsPrice?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <FiTruck className="text-green-500" />
                    Shipping Fee
                  </span>
                  <span className="font-medium">₱{order.shippingPrice?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-green-600">₱{order.totalPrice?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-gray-800 mb-4">Payment Details</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getPaymentMethodIcon(order.paymentMethod)}
                    <span className="text-sm text-gray-700">{order.paymentMethod}</span>
                  </div>
                  <span className={`text-sm font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                    {order.paymentStatus}
                  </span>
                </div>
                {order.paymentMethod === 'Wallet' && order.paymentDetails && (
                  <div className="bg-green-50 rounded-lg p-3 text-sm">
                    <p className="text-gray-700">
                      <span className="font-medium">Transaction ID:</span> {order.paymentDetails.walletTransactionId}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Amount Used:</span> ₱{order.paymentDetails.walletAmountUsed?.toFixed(2)}
                    </p>
                    {order.paymentDetails.paymentDate && (
                      <p className="text-gray-700">
                        <span className="font-medium">Date:</span> {formatDate(order.paymentDetails.paymentDate)}
                      </p>
                    )}
                  </div>
                )}
                {order.paymentMethod === 'Cash on Delivery' && (
                  <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
                    <p>Pay when you receive the order</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;