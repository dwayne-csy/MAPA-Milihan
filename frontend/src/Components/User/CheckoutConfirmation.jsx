// frontend/src/Components/User/CheckoutConfirmation.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import UserHeader from '../layouts/Header';
import { 
  FiCheckCircle, 
  FiPackage, 
  FiTruck, 
  FiMapPin, 
  FiDollarSign, 
  FiCreditCard,
  FiNavigation
} from 'react-icons/fi';
import { MdWallet } from 'react-icons/md';

const CheckoutConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shippingDistance, setShippingDistance] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const token = localStorage.getItem('token');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  const orderId = location.state?.orderId;

  useEffect(() => {
    if (!orderId) {
      toast.error('No order found');
      navigate('/orders');
      return;
    }

    // Get shipping info from location state
    if (location.state?.shippingDistance) {
      setShippingDistance(location.state.shippingDistance);
    }
    if (location.state?.shippingCost) {
      setShippingCost(location.state.shippingCost);
    }

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
      console.error('Error fetching order:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
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

      <div className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <FiCheckCircle className="text-5xl text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Order Placed Successfully!</h1>
          <p className="text-gray-500 mt-1">Thank you for your order</p>
        </div>

        {/* Order Summary Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800">Order #{order._id.slice(-8).toUpperCase()}</h2>
              <span className="text-xs text-gray-500">{formatDate(order.createdAt)}</span>
            </div>
          </div>

          {/* Order Items */}
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Items</h3>
            <div className="space-y-3">
              {order.orderItems.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <img 
                    src={item.image || '/default-product.png'} 
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">₱{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Order Details */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <FiMapPin className="text-gray-400" />
              <div>
                <p className="text-gray-700">Shipping Address</p>
                <p className="text-xs text-gray-500">
                  {order.shippingInfo?.address || order.shippingAddress?.address || 
                   `${order.shippingInfo?.street || ''}, ${order.shippingInfo?.barangay || ''}, ${order.shippingInfo?.city || ''}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <FiNavigation className="text-blue-500" />
              <div>
                <p className="text-gray-700">Shipping Distance</p>
                <p className="text-xs text-gray-500">
                  {shippingDistance > 0 ? `${shippingDistance.toFixed(1)} km` : 'Distance calculated'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <FiTruck className="text-gray-400" />
              <div>
                <p className="text-gray-700">Shipping Fee</p>
                <p className="text-xs text-gray-500">₱{shippingCost > 0 ? shippingCost.toFixed(2) : (order.shippingPrice?.toFixed(2) || '0.00')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              {order.paymentMethod === 'Wallet' ? (
                <MdWallet className="text-green-500 text-lg" />
              ) : (
                <FiCreditCard className="text-blue-500 text-lg" />
              )}
              <div>
                <p className="text-gray-700">Payment Method</p>
                <p className="text-xs text-gray-500">
                  {order.paymentMethod} 
                  {order.paymentStatus === 'Paid' && (
                    <span className="text-green-600 ml-1">(Paid)</span>
                  )}
                  {order.paymentMethod === 'Cash on Delivery' && (
                    <span className="text-blue-600 ml-1">(Pay on Delivery)</span>
                  )}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">₱{order.itemsPrice?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping Fee</span>
                <span className="font-medium">₱{shippingCost > 0 ? shippingCost.toFixed(2) : (order.shippingPrice?.toFixed(2) || '0.00')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Distance</span>
                <span className="font-medium">{shippingDistance > 0 ? `${shippingDistance.toFixed(1)} km` : 'N/A'}</span>
              </div>
              <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span className="text-green-600">₱{order.totalPrice?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            onClick={() => navigate(`/orders/${order._id}`)}
            className="flex-1 py-3 px-4 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
          >
            View Order Details
          </button>
          <button
            onClick={() => navigate('/product')}
            className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutConfirmation;