// Mapa-Milihan/frontend/src/Components/User/Wallet.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import UserHeader from '../layouts/Header';
import { 
  FiPlus, 
  FiMinus, 
  FiClock, 
  FiArrowLeft,
  FiXCircle,
  FiRefreshCw,
  FiCreditCard,
  FiDollarSign,
  FiCheck,
  FiChevronDown,
  FiUser,
  FiPhone
} from 'react-icons/fi';
import { 
  MdWallet
} from 'react-icons/md';
import { format } from 'date-fns';

const UserWallet = () => {
  const navigate = useNavigate();
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [user, setUser] = useState(null);
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [quickAmounts, setQuickAmounts] = useState([50, 100, 200, 500, 1000]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('gcash');
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);
  const [totalSpent, setTotalSpent] = useState(0);
  
  // Payment account details
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  const token = localStorage.getItem('token');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  // Payment methods with their fields
  const paymentMethods = [
    { 
      id: 'gcash', 
      name: 'GCash', 
      icon: '📱', 
      color: '#0073E6',
      fields: [
        { key: 'accountNumber', label: 'GCash Number', type: 'text', placeholder: '0917 123 4567', icon: <FiPhone /> },
        { key: 'accountName', label: 'Full Name', type: 'text', placeholder: 'Juan Dela Cruz', icon: <FiUser /> }
      ]
    },
    { 
      id: 'paymaya', 
      name: 'PayMaya', 
      icon: '💳', 
      color: '#1A1A2E',
      fields: [
        { key: 'accountNumber', label: 'PayMaya Number', type: 'text', placeholder: '0917 123 4567', icon: <FiPhone /> },
        { key: 'accountName', label: 'Full Name', type: 'text', placeholder: 'Juan Dela Cruz', icon: <FiUser /> }
      ]
    },
    { 
      id: 'bank', 
      name: 'Bank Account', 
      icon: '🏦', 
      color: '#1e40af',
      fields: [
        { key: 'accountNumber', label: 'Account Number', type: 'text', placeholder: '1234-5678-9012', icon: <FiCreditCard /> },
        { key: 'accountName', label: 'Account Holder Name', type: 'text', placeholder: 'Juan Dela Cruz', icon: <FiUser /> }
      ]
    }
  ];

  // Get current user ID
  const getCurrentUserId = () => {
    try {
      if (token) {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        if (decoded.id) return decoded.id;
        if (decoded.userId) return decoded.userId;
        if (decoded._id) return decoded._id;
      }
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsed = JSON.parse(userData);
        if (parsed._id) return parsed._id;
        if (parsed.id) return parsed.id;
        if (parsed.userId) return parsed.userId;
      }
      return null;
    } catch (error) {
      console.error('Error getting current user ID:', error);
      return null;
    }
  };

  const currentUserId = getCurrentUserId();

  // Calculate totals from transactions
  const calculateTotals = useCallback((transactionsList) => {
    let spent = 0;
    
    transactionsList.forEach(t => {
      if (t.type === 'debit' && t.status === 'completed') {
        spent += t.amount;
      }
    });
    
    setTotalSpent(spent);
    
    return { totalSpent: spent };
  }, []);

  // Fetch wallet balance
  const fetchWalletBalance = useCallback(async () => {
    if (!token) {
      toast.error('Please login to view your wallet');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/v1/users/wallet/balance`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setWalletBalance(response.data.walletBalance);
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      if (error.response?.status === 403) {
        toast.error('Wallet is only available for users, farmers, and riders');
        navigate('/profile');
      } else if (error.response?.status === 401) {
        toast.error('Please login again');
        navigate('/login');
      } else {
        toast.error('Failed to load wallet balance');
      }
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, token, navigate]);

  // Fetch transaction history from API
  const fetchTransactions = useCallback(async () => {
    if (!token) return;

    try {
      setLoadingTransactions(true);
      const response = await axios.get(`${API_BASE_URL}/api/v1/users/wallet/transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const transactionsData = response.data.transactions || [];
        setTransactions(transactionsData);
        calculateTotals(transactionsData);
      } else {
        setTransactions([]);
        setTotalSpent(0);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
      setTotalSpent(0);
    } finally {
      setLoadingTransactions(false);
    }
  }, [API_BASE_URL, token, calculateTotals]);

  // Reset form fields
  const resetForm = () => {
    setTopUpAmount('');
    setAccountNumber('');
    setAccountName('');
    setSelectedPaymentMethod('gcash');
  };

  // Handle top-up
  const handleTopUp = async () => {
    if (!topUpAmount || parseFloat(topUpAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const amount = parseFloat(topUpAmount);
    
    if (amount < 10) {
      toast.error('Minimum top-up amount is ₱10');
      return;
    }

    if (amount > 10000) {
      toast.error('Maximum top-up amount is ₱10,000');
      return;
    }

    const method = paymentMethods.find(m => m.id === selectedPaymentMethod);
    if (!accountNumber.trim()) {
      toast.error(`Please enter your ${method?.fields[0]?.label || 'account number'}`);
      return;
    }
    if (!accountName.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    try {
      setTopUpLoading(true);
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/users/wallet/add`,
        { amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Update wallet balance
        setWalletBalance(response.data.walletBalance);
        
        // Refresh transactions
        await fetchTransactions();
        
        toast.success(`✅ Successfully added ₱${amount} to your wallet via ${method?.name}`);
        setShowTopUpModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error topping up wallet:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to top up wallet. Please try again.');
      }
    } finally {
      setTopUpLoading(false);
    }
  };

  // Handle quick amount selection
  const handleQuickAmountSelect = (amount) => {
    setTopUpAmount(amount.toString());
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return format(new Date(date), 'MMM dd, yyyy • HH:mm');
    } catch {
      return 'Invalid date';
    }
  };

  // Get transaction icon
  const getTransactionIcon = (type) => {
    switch (type) {
      case 'credit':
        return <FiPlus className="text-green-500" />;
      case 'debit':
        return <FiMinus className="text-red-500" />;
      default:
        return <FiClock className="text-gray-500" />;
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Completed</span>;
      case 'pending':
        return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">Pending</span>;
      case 'failed':
        return <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">Failed</span>;
      default:
        return <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">Unknown</span>;
    }
  };

  // Get current payment method fields
  const currentMethod = paymentMethods.find(m => m.id === selectedPaymentMethod);

  // Render payment fields based on selected method
  const renderPaymentFields = () => {
    if (!currentMethod) return null;

    return currentMethod.fields.map((field) => {
      let value = '';
      let setValue = () => {};
      
      switch(field.key) {
        case 'accountNumber':
          value = accountNumber;
          setValue = setAccountNumber;
          break;
        case 'accountName':
          value = accountName;
          setValue = setAccountName;
          break;
        default:
          return null;
      }

      return (
        <div key={field.key} className="mb-3">
          <label className="text-xs font-medium text-gray-700 block mb-1">
            {field.label}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {field.icon}
            </span>
            <input
              type={field.type}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={field.placeholder}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>
        </div>
      );
    });
  };

  useEffect(() => {
    if (currentUserId) {
      fetchWalletBalance();
      fetchTransactions();
    }
  }, [currentUserId, fetchWalletBalance, fetchTransactions]);

  return (
    <div className="full-bleed w-full min-h-screen bg-gray-50 flex flex-col">
      <UserHeader />

      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
        >
          <FiArrowLeft size={20} />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Wallet Balance Card */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MdWallet size={20} />
                <span className="text-sm font-medium opacity-90">Wallet Balance</span>
              </div>
              {loading ? (
                <div className="h-10 w-32 bg-green-400/30 rounded animate-pulse"></div>
              ) : (
                <div className="text-4xl font-bold">
                  {formatCurrency(walletBalance)}
                </div>
              )}
              {user && user.role && (
                <div className="text-sm opacity-80 mt-1">
                  {user.name || 'User'} • {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowTopUpModal(true)}
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-colors backdrop-blur-sm"
            >
              <FiPlus size={18} />
              <span className="font-medium">Top Up</span>
            </button>
          </div>
        </div>

        {/* Quick Stats - Removed Total Top-ups, kept Available Balance and Total Spent */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <FiDollarSign className="text-green-600 text-lg" />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-medium">Available Balance</div>
                <div className="text-lg font-semibold text-gray-800">
                  {formatCurrency(walletBalance)}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <FiRefreshCw className="text-purple-600 text-lg" />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-medium">Total Spent</div>
                <div className="text-lg font-semibold text-gray-800">
                  {formatCurrency(totalSpent)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">Transaction History</h2>
            <button 
              onClick={fetchTransactions}
              className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
            >
              <FiRefreshCw size={14} />
              Refresh
            </button>
          </div>

          <div className="p-4">
            {loadingTransactions ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-green-200 border-t-green-500 rounded-full animate-spin"></div>
                <span className="ml-2 text-sm text-gray-500">Loading transactions...</span>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FiClock className="text-3xl text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-medium">No transactions yet</p>
                <p className="text-xs">Your transaction history will appear here after you top up</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div key={transaction._id || transaction.id || transaction.orderId || Date.now()} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">
                          {transaction.description || transaction.type}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(transaction.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${
                        transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'credit' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </div>
                      <div className="mt-1">
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top-Up Modal */}
      {showTopUpModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowTopUpModal(false);
            resetForm();
          }}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Top Up Wallet</h3>
              <button 
                onClick={() => {
                  setShowTopUpModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiXCircle size={24} />
              </button>
            </div>

            {/* Amount Input */}
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Enter Amount (₱)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg font-medium">₱</span>
                <input
                  type="number"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 text-lg border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  min="10"
                  max="10000"
                  step="1"
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Minimum: ₱10 • Maximum: ₱10,000
              </div>
            </div>

            {/* Quick Amounts */}
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Quick Amounts
              </label>
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleQuickAmountSelect(amount)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      parseFloat(topUpAmount) === amount
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ₱{amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Payment Method
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowPaymentDropdown(!showPaymentDropdown)}
                  className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:border-green-500 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{currentMethod?.icon}</span>
                    <span className="text-gray-700">
                      {currentMethod?.name || 'Select Payment'}
                    </span>
                  </div>
                  <FiChevronDown className={`text-gray-400 transition-transform ${showPaymentDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showPaymentDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => {
                          setSelectedPaymentMethod(method.id);
                          setShowPaymentDropdown(false);
                          setAccountNumber('');
                          setAccountName('');
                        }}
                        className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors ${
                          selectedPaymentMethod === method.id ? 'bg-green-50' : ''
                        }`}
                      >
                        <span className="text-lg">{method.icon}</span>
                        <span className="text-gray-700">{method.name}</span>
                        {selectedPaymentMethod === method.id && (
                          <FiCheck className="ml-auto text-green-500" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic Payment Fields */}
            <div className="mb-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-3">
                  Enter your {currentMethod?.name} details
                </p>
                {renderPaymentFields()}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTopUpModal(false);
                  resetForm();
                }}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTopUp}
                disabled={topUpLoading || !topUpAmount || parseFloat(topUpAmount) <= 0 || !accountNumber || !accountName}
                className="flex-1 py-3 px-4 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {topUpLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <FiPlus size={18} />
                    Top Up
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserWallet;