import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import UserHeader from '../layouts/Header';
import { 
  FiPackage, 
  FiClock, 
  FiCheckCircle, 
  FiXCircle, 
  FiTruck, 
  FiMapPin,
  FiDollarSign,
  FiCreditCard
} from 'react-icons/fi';
import { MdWallet } from 'react-icons/md';

const OrderHistory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const token = localStorage.getItem('token');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/v1/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setOrders(response.data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
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
      case 'Wallet': return <MdWallet className="text-green-500" />;
      case 'Cash on Delivery': return <FiCreditCard className="text-blue-500" />;
      default: return <FiDollarSign className="text-gray-500" />;
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

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.orderStatus === filter);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOrderCount = (status) => {
    return orders.filter(order => order.orderStatus === status).length;
  };

  return (
    <div className="full-bleed w-full min-h-screen bg-gray-50 flex flex-col">
      <UserHeader />

      <div className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Order History</h1>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-green-500 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            All ({orders.length})
          </button>
          <button
            onClick={() => setFilter('Processing')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'Processing' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Processing ({getOrderCount('Processing')})
          </button>
          <button
            onClick={() => setFilter('Accepted')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'Accepted' 
                ? 'bg-indigo-500 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Accepted ({getOrderCount('Accepted')})
          </button>
          <button
            onClick={() => setFilter('Out for Delivery')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'Out for Delivery' 
                ? 'bg-purple-500 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Out for Delivery ({getOrderCount('Out for Delivery')})
          </button>
          <button
            onClick={() => setFilter('Delivered')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'Delivered' 
                ? 'bg-green-500 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Delivered ({getOrderCount('Delivered')})
          </button>
          <button
            onClick={() => setFilter('Cancelled')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'Cancelled' 
                ? 'bg-red-500 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Cancelled ({getOrderCount('Cancelled')})
          </button>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-green-200 border-t-green-500 rounded-full animate-spin"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <FiPackage className="text-4xl text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No orders found</p>
            <button
              onClick={() => navigate('/products')}
              className="mt-2 text-green-600 hover:text-green-700 font-medium"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div 
                key={order._id} 
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/orders/${order._id}`)}
              >
                {/* Order Header */}
                <div className="flex flex-wrap items-center justify-between p-4 border-b border-gray-100">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-600">
                      Order #{order._id.slice(-8).toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {getPaymentMethodIcon(order.paymentMethod)}
                      <span className="text-xs text-gray-600">{order.paymentMethod}</span>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)} flex items-center gap-1`}>
                      {getStatusIcon(order.orderStatus)}
                      <span>{order.orderStatus}</span>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-4">
                  <div className="space-y-2">
                    {order.orderItems.slice(0, 3).map((item, index) => (
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
                        <p className="text-sm font-semibold text-gray-800">
                          ₱{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                    {order.orderItems.length > 3 && (
                      <p className="text-xs text-gray-400 text-center">
                        +{order.orderItems.length - 3} more items
                      </p>
                    )}
                  </div>
                </div>

                {/* Order Footer */}
                <div className="flex flex-wrap items-center justify-between p-4 bg-gray-50 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-gray-600">
                      <FiMapPin className="text-gray-400" />
                      <span className="text-xs">{order.shippingInfo?.barangay || order.shippingAddress?.barangay || ''}, {order.shippingInfo?.city || order.shippingAddress?.city || ''}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <FiTruck className="text-gray-400" />
                      <span className="text-xs">₱{order.shippingPrice?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className={`text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                      {order.paymentStatus}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-lg font-bold text-green-600">₱{order.totalPrice?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;