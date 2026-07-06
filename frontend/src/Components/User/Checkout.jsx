// frontend/src/Components/User/Checkout.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import UserHeader from '../layouts/Header';
import { 
  FiArrowLeft, 
  FiMapPin, 
  FiCreditCard, 
  FiDollarSign, 
  FiTruck, 
  FiCheckCircle,
  FiPlus,
  FiMinus,
  FiShoppingBag,
  FiUser
} from 'react-icons/fi';
import { MdWallet } from 'react-icons/md';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [singleProduct, setSingleProduct] = useState(null);
  const [isCartCheckout, setIsCartCheckout] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('COD');
  const [walletBalance, setWalletBalance] = useState(0);
  const [shippingDistance, setShippingDistance] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [address, setAddress] = useState({
    city: '',
    barangay: '',
    street: '',
    zipcode: '',
    location: {
      lat: null,
      lng: null
    }
  });
  const [user, setUser] = useState(null);
  const [farmerLocation, setFarmerLocation] = useState(null);
  const [farmerPayments, setFarmerPayments] = useState([]);

  const token = localStorage.getItem('token');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  const RATE_PER_KM = 30;

  useEffect(() => {
    const fetchData = async () => {
      await fetchUserData();
      await fetchWalletBalance();
      
      const state = location.state || {};
      console.log('📍 Checkout location state:', state);
      
      if (state.cartItems && state.cartItems.length > 0) {
        console.log('🛒 Cart items:', state.cartItems);
        setCartItems(state.cartItems);
        setIsCartCheckout(true);
        if (state.shippingAddress) {
          setAddress(state.shippingAddress);
        }
        if (state.cartItems[0]?.farmerLocation) {
          setFarmerLocation(state.cartItems[0].farmerLocation);
        }
        if (state.shippingDistance) {
          setShippingDistance(state.shippingDistance);
          setShippingCost(state.shippingDistance * RATE_PER_KM);
        } else {
          setShippingDistance(5);
          setShippingCost(5 * RATE_PER_KM);
        }
        
        // Calculate farmer payments for display
        calculateFarmerPayments(state.cartItems);
      } else if (state.product) {
        console.log('📦 Solo product from state:', state.product);
        
        // Fetch the full product details to get correct stock
        try {
          const productId = state.product._id || state.product.productId;
          if (productId) {
            console.log('🔍 Fetching product details for ID:', productId);
            const response = await axios.get(`${API_BASE_URL}/api/v1/products/${productId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
              const fullProduct = response.data.product;
              console.log('✅ Full product data:', fullProduct);
              console.log('📊 Stock from API:', fullProduct.quantity);
              
              setSingleProduct({
                ...fullProduct,
                quantity: 1,
                stock: fullProduct.quantity || fullProduct.stock || 0
              });
            } else {
              setSingleProduct({
                ...state.product,
                quantity: 1,
                stock: state.product.quantity || state.product.stock || 0
              });
            }
          } else {
            setSingleProduct({
              ...state.product,
              quantity: 1,
              stock: state.product.quantity || state.product.stock || 0
            });
          }
        } catch (error) {
          console.error('❌ Error fetching product details:', error);
          setSingleProduct({
            ...state.product,
            quantity: 1,
            stock: state.product.quantity || state.product.stock || 0
          });
        }
        
        setIsCartCheckout(false);
        if (state.product.farmerLocation || state.product.location) {
          setFarmerLocation(state.product.farmerLocation || state.product.location);
        }
        if (state.shippingDistance) {
          setShippingDistance(state.shippingDistance);
          setShippingCost(state.shippingDistance * RATE_PER_KM);
        } else {
          setShippingDistance(5);
          setShippingCost(5 * RATE_PER_KM);
        }
        
        // Calculate farmer payment for solo product
        if (state.product) {
          setFarmerPayments([{
            farmerName: state.product.farmerName || 'Unknown Farmer',
            amount: state.product.price * 1, // quantity will be adjusted
            productName: state.product.name
          }]);
        }
      } else {
        toast.error('No items to checkout');
        navigate('/cart');
      }
    };

    fetchData();
  }, [location]);

  const calculateFarmerPayments = (items) => {
    const farmerMap = {};
    items.forEach(item => {
      const farmerId = item.farmerId || item.farmer || 'unknown';
      const farmerName = item.farmerName || 'Unknown Farmer';
      const itemTotal = item.price * (item.quantity || 1);
      
      if (!farmerMap[farmerId]) {
        farmerMap[farmerId] = {
          farmerName: farmerName,
          amount: 0,
          items: []
        };
      }
      farmerMap[farmerId].amount += itemTotal;
      farmerMap[farmerId].items.push({
        name: item.name,
        quantity: item.quantity || 1,
        price: item.price
      });
    });
    
    setFarmerPayments(Object.values(farmerMap));
  };

  const fetchUserData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.user) {
        setUser(response.data.user);
        if (response.data.user.address) {
          setAddress(prev => ({
            ...prev,
            ...response.data.user.address
          }));
        }
        if (response.data.user.address?.location) {
          if (farmerLocation) {
            calculateDistance(
              response.data.user.address.location.lat,
              response.data.user.address.location.lng,
              farmerLocation.lat,
              farmerLocation.lng
            );
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/users/wallet/balance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setWalletBalance(response.data.walletBalance);
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return;
    
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    setShippingDistance(parseFloat(distance.toFixed(1)));
    setShippingCost(parseFloat((distance * RATE_PER_KM).toFixed(2)));
  };

  // ========== QUANTITY MANAGEMENT FOR SOLO PRODUCT ==========
  const incrementQuantity = () => {
    console.log('➕ Increment button clicked');
    if (!singleProduct) {
      console.log('❌ singleProduct is null');
      return;
    }
    
    const currentQty = singleProduct.quantity || 1;
    const maxStock = singleProduct.stock || singleProduct.quantity || 0;
    console.log(`📊 Current: ${currentQty}, Max Stock: ${maxStock}`);
    console.log('📦 Product data:', singleProduct);
    
    if (maxStock <= 0) {
      toast.error('No stock available');
      return;
    }
    
    if (currentQty >= maxStock) {
      toast.error(`Only ${maxStock} items available`);
      return;
    }
    
    const newQty = currentQty + 1;
    console.log(`✅ New quantity: ${newQty}`);
    
    setSingleProduct({
      ...singleProduct,
      quantity: newQty
    });
    
    // Update farmer payment for solo product
    if (singleProduct) {
      setFarmerPayments([{
        farmerName: singleProduct.farmerName || 'Unknown Farmer',
        amount: singleProduct.price * newQty,
        productName: singleProduct.name
      }]);
    }
  };

  const decrementQuantity = () => {
    console.log('➖ Decrement button clicked');
    if (!singleProduct) {
      console.log('❌ singleProduct is null');
      return;
    }
    
    const currentQty = singleProduct.quantity || 1;
    console.log(`📊 Current: ${currentQty}`);
    
    if (currentQty <= 1) {
      toast.error('Quantity cannot be less than 1');
      return;
    }
    
    const newQty = currentQty - 1;
    console.log(`✅ New quantity: ${newQty}`);
    
    setSingleProduct({
      ...singleProduct,
      quantity: newQty
    });
    
    // Update farmer payment for solo product
    if (singleProduct) {
      setFarmerPayments([{
        farmerName: singleProduct.farmerName || 'Unknown Farmer',
        amount: singleProduct.price * newQty,
        productName: singleProduct.name
      }]);
    }
  };

  // ========== QUANTITY MANAGEMENT FOR CART ITEMS ==========
  const incrementCartQuantity = (index) => {
    console.log('➕ Cart increment clicked for index:', index);
    const item = cartItems[index];
    if (!item) return;
    
    const currentQty = item.quantity || 1;
    const maxStock = item.stock || item.availableQuantity || item.quantity || 999;
    
    if (currentQty >= maxStock) {
      toast.error(`Only ${maxStock} items available`);
      return;
    }
    
    const updatedItems = [...cartItems];
    updatedItems[index] = {
      ...updatedItems[index],
      quantity: currentQty + 1
    };
    setCartItems(updatedItems);
    
    // Recalculate farmer payments
    calculateFarmerPayments(updatedItems);
  };

  const decrementCartQuantity = (index) => {
    console.log('➖ Cart decrement clicked for index:', index);
    const item = cartItems[index];
    if (!item) return;
    
    const currentQty = item.quantity || 1;
    
    if (currentQty <= 1) {
      toast.error('Quantity cannot be less than 1');
      return;
    }
    
    const updatedItems = [...cartItems];
    updatedItems[index] = {
      ...updatedItems[index],
      quantity: currentQty - 1
    };
    setCartItems(updatedItems);
    
    // Recalculate farmer payments
    calculateFarmerPayments(updatedItems);
  };

  // ========== REMOVE ITEM FROM CART ==========
  const removeCartItem = (index) => {
    const updatedItems = cartItems.filter((_, i) => i !== index);
    setCartItems(updatedItems);
    calculateFarmerPayments(updatedItems);
    if (updatedItems.length === 0) {
      toast.info('Cart is empty');
      navigate('/cart');
    }
  };

  const getSubtotal = () => {
    if (isCartCheckout) {
      return cartItems.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
    } else if (singleProduct) {
      return singleProduct.price * (singleProduct.quantity || 1);
    }
    return 0;
  };

  const getTotal = () => {
    return getSubtotal() + shippingCost;
  };

  const handlePlaceOrder = async () => {
    if (!address.city || !address.barangay || !address.street || !address.zipcode) {
      toast.error('Please fill in all address fields');
      return;
    }

    if (!selectedPaymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    if (isCartCheckout && cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (!isCartCheckout && (!singleProduct || (singleProduct.quantity || 1) < 1)) {
      toast.error('Invalid product quantity');
      return;
    }

    if (selectedPaymentMethod === 'Wallet' && walletBalance < getTotal()) {
      toast.error(`Insufficient wallet balance. Available: ₱${walletBalance.toFixed(2)}, Required: ₱${getTotal().toFixed(2)}`);
      return;
    }

    setLoading(true);

    try {
      let endpoint = '';
      let payload = {};

      if (isCartCheckout) {
        endpoint = `${API_BASE_URL}/api/v1/orders/checkout`;
        payload = {
          paymentMethod: selectedPaymentMethod,
          address: address,
          shippingDistance: shippingDistance,
          shippingCost: shippingCost
        };
      } else {
        endpoint = `${API_BASE_URL}/api/v1/orders/checkout/solo`;
        payload = {
          productId: singleProduct.productId || singleProduct._id,
          quantity: singleProduct.quantity || 1,
          paymentMethod: selectedPaymentMethod,
          address: address,
          shippingDistance: shippingDistance,
          shippingCost: shippingCost
        };
      }

      console.log('📤 Sending order payload:', payload);
      console.log('📤 Endpoint:', endpoint);

      const response = await axios.post(endpoint, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ Order response:', response.data);

      if (response.data.success) {
        // Show success message with farmer payment info if wallet was used
        if (selectedPaymentMethod === 'Wallet' && response.data.farmerPayments) {
          const farmerNames = response.data.farmerPayments.map(fp => fp.farmerName).join(', ');
          toast.success(`✅ Order placed! Payments sent to: ${farmerNames}`);
        } else {
          toast.success('Order placed successfully!');
        }
        
        navigate('/checkout/confirmation', {
          state: { 
            orderId: response.data.order._id,
            paymentMethod: selectedPaymentMethod,
            shippingDistance: shippingDistance,
            shippingCost: shippingCost,
            farmerPayments: response.data.farmerPayments
          }
        });
      }
    } catch (error) {
      console.error('❌ Error placing order:', error);
      console.error('❌ Error response:', error.response?.data);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to place order. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="full-bleed w-full min-h-screen bg-gray-50 flex flex-col">
      <UserHeader />

      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
        >
          <FiArrowLeft size={20} />
          <span className="text-sm font-medium">Back</span>
        </button>

        <h1 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Summary */}
          <div className="lg:col-span-2 space-y-4">
            {/* Order Items */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">Order Summary</h2>
              <div className="space-y-3">
                {isCartCheckout ? (
                  cartItems.map((item, index) => {
                    const currentQty = item.quantity || 1;
                    const maxStock = item.stock || item.availableQuantity || item.quantity || 999;
                    return (
                      <div key={index} className="flex items-center gap-3 pb-3 border-b border-gray-100 last:border-0">
                        <img 
                          src={item.image || item.images?.[0]?.url || '/default-product.png'} 
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-800">{item.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1 border border-gray-200 rounded-lg">
                              <button
                                onClick={() => decrementCartQuantity(index)}
                                className="p-1 hover:bg-gray-100 rounded-l-lg transition-colors"
                                type="button"
                              >
                                <FiMinus size={14} className="text-gray-600" />
                              </button>
                              <span className="w-8 text-center text-sm font-medium">{currentQty}</span>
                              <button
                                onClick={() => incrementCartQuantity(index)}
                                className="p-1 hover:bg-gray-100 rounded-r-lg transition-colors"
                                type="button"
                              >
                                <FiPlus size={14} className="text-gray-600" />
                              </button>
                            </div>
                            <span className="text-xs text-gray-400">
                              Stock: {maxStock}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-green-600 mt-1">
                            ₱{(item.price * currentQty).toFixed(2)}
                          </p>
                        </div>
                        <button
                          onClick={() => removeCartItem(index)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                          type="button"
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })
                ) : singleProduct && (
                  <div className="flex items-center gap-3">
                    <img 
                      src={singleProduct.images?.[0]?.url || singleProduct.image || '/default-product.png'} 
                      alt={singleProduct.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-800">{singleProduct.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1 border border-gray-200 rounded-lg">
                          <button
                            onClick={decrementQuantity}
                            className="p-1 hover:bg-gray-100 rounded-l-lg transition-colors"
                            type="button"
                          >
                            <FiMinus size={14} className="text-gray-600" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">{singleProduct.quantity || 1}</span>
                          <button
                            onClick={incrementQuantity}
                            className="p-1 hover:bg-gray-100 rounded-r-lg transition-colors"
                            type="button"
                          >
                            <FiPlus size={14} className="text-gray-600" />
                          </button>
                        </div>
                        <span className="text-xs text-gray-400">
                          Stock: {singleProduct.stock || singleProduct.quantity || 0}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-green-600 mt-1">
                        ₱{(singleProduct.price * (singleProduct.quantity || 1)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Farmer Payment Breakdown - Show when Wallet is selected */}
            {selectedPaymentMethod === 'Wallet' && farmerPayments.length > 0 && (
              <div className="bg-green-50 rounded-xl border border-green-200 p-4">
                <h3 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <FiUser className="text-green-600" />
                  Payment to Farmers
                </h3>
                <div className="space-y-2">
                  {farmerPayments.map((payment, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-green-700">{payment.farmerName}</span>
                      <span className="font-semibold text-green-800">₱{payment.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-green-200 pt-2 mt-2 flex justify-between items-center">
                    <span className="text-sm font-medium text-green-800">Total to Farmers</span>
                    <span className="font-bold text-green-800">₱{farmerPayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}</span>
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-2">
                  💰 This amount will be sent directly to the farmers' wallets
                </p>
              </div>
            )}

            {/* Shipping Address */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FiMapPin className="text-green-500" />
                Shipping Address
              </h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">City</label>
                    <input
                      type="text"
                      value={address.city}
                      onChange={(e) => setAddress({...address, city: e.target.value})}
                      placeholder="Enter city"
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Barangay</label>
                    <input
                      type="text"
                      value={address.barangay}
                      onChange={(e) => setAddress({...address, barangay: e.target.value})}
                      placeholder="Enter barangay"
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">Street</label>
                    <input
                      type="text"
                      value={address.street}
                      onChange={(e) => setAddress({...address, street: e.target.value})}
                      placeholder="Enter street"
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Zipcode</label>
                    <input
                      type="text"
                      value={address.zipcode}
                      onChange={(e) => setAddress({...address, zipcode: e.target.value})}
                      placeholder="Enter zipcode"
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Payment & Summary */}
          <div className="space-y-4">
            {/* Order Total */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">Order Total</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₱{getSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <FiTruck className="text-green-500" />
                    Shipping Fee
                    <span className="text-xs text-gray-400">(₱{RATE_PER_KM}/km)</span>
                  </span>
                  <span className="font-medium">₱{shippingCost.toFixed(2)}</span>
                </div>
                {shippingDistance > 0 && (
                  <div className="text-xs text-gray-400 text-right">
                    Distance: {shippingDistance.toFixed(1)} km
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-green-600">₱{getTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">Payment Method</h2>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedPaymentMethod('COD')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    selectedPaymentMethod === 'COD' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  type="button"
                >
                  <FiCreditCard className={`text-lg ${selectedPaymentMethod === 'COD' ? 'text-green-500' : 'text-gray-400'}`} />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-800">Cash on Delivery</p>
                    <p className="text-xs text-gray-500">Pay when you receive the order</p>
                  </div>
                  {selectedPaymentMethod === 'COD' && (
                    <FiCheckCircle className="text-green-500" />
                  )}
                </button>

                <button
                  onClick={() => setSelectedPaymentMethod('Wallet')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    selectedPaymentMethod === 'Wallet' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  type="button"
                >
                  <MdWallet className={`text-lg ${selectedPaymentMethod === 'Wallet' ? 'text-green-500' : 'text-gray-400'}`} />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-800">Wallet</p>
                    <p className="text-xs text-gray-500">Balance: ₱{walletBalance.toFixed(2)}</p>
                    {selectedPaymentMethod === 'Wallet' && farmerPayments.length > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        Will pay farmers directly
                      </p>
                    )}
                  </div>
                  {selectedPaymentMethod === 'Wallet' && (
                    <FiCheckCircle className="text-green-500" />
                  )}
                </button>
              </div>
              
              {selectedPaymentMethod === 'Wallet' && walletBalance < getTotal() && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-600">
                    Insufficient balance. Need ₱{(getTotal() - walletBalance).toFixed(2)} more.
                    <button 
                      onClick={() => navigate('/wallet')}
                      className="ml-1 text-green-600 hover:underline font-medium"
                      type="button"
                    >
                      Top up now
                    </button>
                  </p>
                </div>
              )}
            </div>

            {/* Place Order Button */}
            <button
              onClick={handlePlaceOrder}
              disabled={loading || (isCartCheckout && cartItems.length === 0)}
              className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white rounded-xl font-semibold text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-green-200 hover:shadow-xl hover:shadow-green-300 transform hover:-translate-y-0.5"
              type="button"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <>
                  <FiShoppingBag size={20} className="text-white" />
                  <span>Place Order</span>
                  <span className="ml-1 text-white/80 text-sm font-normal">
                    ₱{getTotal().toFixed(2)}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;