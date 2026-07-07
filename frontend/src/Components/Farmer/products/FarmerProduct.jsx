// Mapa-Milihan/frontend/src/Components/Farmer/FarmerProduct.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FarmerHeader from '../../layouts/FarmerHeader';
import { getUnitLabel, getPricePerUnit, getQuantityDisplay } from '../../utils/unitHelpers';

// ── Icons ───────────────────────────────────────────────────────────────
const SearchIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

const MapPinIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const GridIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
  </svg>
);

const ListIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

const ShoppingCartIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/>
    <circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);

const CartPlusIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/>
    <circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="7" y1="14" x2="13" y2="14"/>
  </svg>
);

const ClockIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const RefreshIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

const PlayIcon = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="12" fill="rgba(0,0,0,0.5)"/>
    <polygon points="10,8 16,12 10,16" fill="white"/>
  </svg>
);

const VideoIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="2.18"/>
    <line x1="8" y1="2" x2="8" y2="22"/>
    <line x1="16" y1="2" x2="16" y2="22"/>
    <line x1="2" y1="8" x2="22" y2="8"/>
    <line x1="2" y1="16" x2="22" y2="16"/>
    <polygon points="10 10 14 12 10 14 10 10"/>
  </svg>
);

const ChevronLeftIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const ChevronRightIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const EditIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const TrashIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

const PlusIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const EyeIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const StoreIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);

const UsersIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

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

// ── Helper: Decode JWT token to get user info ──────────────────────
const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

// ── Component ───────────────────────────────────────────────────────────
const FarmerProduct = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState('grid');
  const [filterType, setFilterType] = useState('all'); // 'all', 'my', 'others'
  const [deletingId, setDeletingId] = useState(null);
  const [addingToCart, setAddingToCart] = useState(null);
  const [imageIndexes, setImageIndexes] = useState({});
  const [currentUserId, setCurrentUserId] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  const categories = ['All', 'Fruits', 'Vegetables', 'Grains', 'Livestock', 'Others'];

  useEffect(() => {
    // Get user ID from token
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = decodeToken(token);
      if (decoded && decoded.id) {
        setCurrentUserId(decoded.id);
      }
    }
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Get user ID from token if not already set
      let userId = currentUserId;
      if (!userId && token) {
        const decoded = decodeToken(token);
        if (decoded && decoded.id) {
          userId = decoded.id;
          setCurrentUserId(userId);
        }
      }

      // Fetch farmer's own products
      const myProductsResponse = await fetch(`${API_BASE_URL}/api/v1/products/farmer/products`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : {}
        }
      });

      let myProducts = [];
      if (myProductsResponse.ok) {
        const myProductsData = await myProductsResponse.json();
        myProducts = myProductsData.products || [];
      } else {
        console.warn('Failed to fetch farmer products:', myProductsResponse.status);
      }

      // Fetch all available products (from all farmers)
      const allProductsResponse = await fetch(`${API_BASE_URL}/api/v1/products`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : {}
        }
      });

      let allProductsList = [];
      if (allProductsResponse.ok) {
        const allProductsData = await allProductsResponse.json();
        allProductsList = allProductsData.products || [];
      } else {
        console.warn('Failed to fetch all products:', allProductsResponse.status);
      }

      // Mark which products are owned by the current farmer
      const productsWithOwnership = allProductsList.map(product => {
        // Check if product belongs to current farmer
        const productFarmerId = product.farmer?._id || product.farmer;
        const isOwn = productFarmerId === userId;
        
        return {
          ...product,
          isOwnProduct: isOwn
        };
      });

      setAllProducts(productsWithOwnership);
      setProducts(myProducts);

      // Initialize image indexes
      const initialIndexes = {};
      productsWithOwnership.forEach(p => {
        initialIndexes[p._id] = 0;
      });
      setImageIndexes(initialIndexes);

    } catch (err) {
      console.error('Fetch data error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Navigation Handlers ──
  const handleProductClick = (product) => {
    navigate(`/farmer/product/${product._id}`);
  };

  const handleEditProduct = (e, productId) => {
    e.stopPropagation();
    navigate(`/farmer/update-product/${productId}`);
  };

  const handleDeleteProduct = async (e, productId) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    setDeletingId(productId);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/v1/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setProducts(prev => prev.filter(p => p._id !== productId));
        setAllProducts(prev => prev.filter(p => p._id !== productId));
        showToast('🗑️ Product deleted successfully!', '#ffebee', '#c62828');
      } else {
        alert(data.message || 'Failed to delete product');
      }
    } catch (err) {
      console.error('Delete product error:', err);
      alert('Network error. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleAvailability = async (e, product) => {
    e.stopPropagation();

    try {
      const token = localStorage.getItem('token');
      const newStatus = !product.isAvailable;
      
      const response = await fetch(`${API_BASE_URL}/api/v1/products/${product._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isAvailable: newStatus })
      });

      const data = await response.json();

      if (response.ok) {
        // Update both product lists
        setProducts(prev => prev.map(p => 
          p._id === product._id ? { ...p, isAvailable: newStatus } : p
        ));
        setAllProducts(prev => prev.map(p => 
          p._id === product._id ? { ...p, isAvailable: newStatus } : p
        ));
        showToast(
          newStatus ? '✅ Product is now available!' : '⛔ Product is now unavailable',
          newStatus ? '#e8f5e9' : '#fff3e0',
          newStatus ? '#1b5e20' : '#e65100'
        );
      } else {
        alert(data.message || 'Failed to update product status');
      }
    } catch (err) {
      console.error('Toggle availability error:', err);
      alert('Network error. Please try again.');
    }
  };

  const handleAddToCart = async (e, product) => {
    e.stopPropagation();
    
    const token = localStorage.getItem('token');
    if (!token) {
      if (window.confirm('Please login to add items to cart. Go to login?')) {
        navigate('/login');
      }
      return;
    }

    setAddingToCart(product._id);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId: product._id, quantity: 1 })
      });

      const data = await response.json();

      if (response.ok) {
        showToast('✅ Product added to cart!', '#e8f5e9', '#1b5e20');
      } else {
        alert(data.message || 'Failed to add to cart');
      }
    } catch (err) {
      console.error('Add to cart error:', err);
      alert('Network error. Please try again.');
    } finally {
      setAddingToCart(null);
    }
  };

  // ── UPDATED: Handle Buy Now - Navigates to Farmer Checkout ──
  const handleBuyNow = (e, product) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) {
      if (window.confirm('Please login to purchase. Go to login?')) {
        navigate('/login');
      }
      return;
    }
    // Navigate to farmer checkout with product data
    navigate('/farmer/checkout', { 
      state: { 
        product: {
          ...product,
          productId: product._id,
          farmerId: product.farmer?._id || product.farmer,
          farmerName: product.farmer?.name || 'Unknown Farmer',
          farmerLocation: product.location || product.farmer?.location,
          quantity: product.quantity || product.stock || 0,
          stock: product.quantity || product.stock || 0
        },
        quantity: 1,
        isSoloCheckout: true 
      } 
    });
  };

  const handleViewOnMap = (e, product) => {
    e.stopPropagation();
    navigate('/maps', {
      state: {
        location: product.location,
        product: {
          id: product._id,
          name: product.name,
          price: product.price,
          description: product.description,
          farmer: product.farmer?.name || 'Unknown Farmer'
        }
      }
    });
  };

  const handleAddNewProduct = () => {
    navigate('/farmer/create-product');
  };

  const showToast = (message, bg, color) => {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: ${bg || '#e8f5e9'};
      color: ${color || '#1b5e20'};
      padding: 14px 24px;
      border-radius: 12px;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.9rem;
      font-weight: 500;
      z-index: 9999;
      box-shadow: 0 4px 20px rgba(0,0,0,0.12);
      border-left: 4px solid ${color || '#4CAF50'};
      animation: slideIn 0.3s ease;
      max-width: 400px;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getLocationDisplay = (product) => {
    if (product.location?.address) {
      return product.location.address;
    }
    if (product.location?.barangay && product.location?.city) {
      return `${product.location.barangay}, ${product.location.city}`;
    }
    if (product.farmerAddress?.barangay && product.farmerAddress?.city) {
      return `${product.farmerAddress.barangay}, ${product.farmerAddress.city}`;
    }
    return null;
  };

  const getFarmerAvatar = (product) => {
    if (product.farmerAvatar) {
      return product.farmerAvatar.startsWith('http') ? product.farmerAvatar : `${API_BASE_URL}${product.farmerAvatar}`;
    }
    if (product.farmer?.avatar?.url) {
      return product.farmer.avatar.url.startsWith('http') ? product.farmer.avatar.url : `${API_BASE_URL}${product.farmer.avatar.url}`;
    }
    if (product.farmer?.profilePicture?.url) {
      return product.farmer.profilePicture.url.startsWith('http') ? product.farmer.profilePicture.url : `${API_BASE_URL}${product.farmer.profilePicture.url}`;
    }
    return null;
  };

  const getFarmerInitial = (name) => {
    return name?.charAt(0)?.toUpperCase() || 'F';
  };

  const navigateImage = (e, productId, direction) => {
    e.stopPropagation();
    const product = getDisplayProducts().find(p => p._id === productId);
    if (!product || !product.images || product.images.length === 0) return;
    
    setImageIndexes(prev => {
      const currentIndex = prev[productId] || 0;
      const total = product.images.length;
      let newIndex;
      if (direction === 'next') {
        newIndex = (currentIndex + 1) % total;
      } else {
        newIndex = (currentIndex - 1 + total) % total;
      }
      return { ...prev, [productId]: newIndex };
    });
  };

  const getDisplayProducts = () => {
    let productsToShow = [];
    
    if (filterType === 'all') {
      productsToShow = allProducts;
    } else if (filterType === 'my') {
      productsToShow = allProducts.filter(p => p.isOwnProduct);
    } else if (filterType === 'others') {
      productsToShow = allProducts.filter(p => !p.isOwnProduct && p.isAvailable !== false);
    }

    // Apply search and category filters
    return productsToShow.filter(product => {
      const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.farmer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  };

  const filteredProducts = getDisplayProducts();

  // ── Loading State ──
  if (loading) {
    return (
      <div className="full-bleed w-full min-h-screen bg-[#f5f7f5] flex flex-col">
        <FarmerHeader />
        <style>{`
          @keyframes prod-spin { to { transform: rotate(360deg); } }
        `}</style>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#c8e6c9] border-t-[#2E7D32] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#546e7a] font-['DM_Sans'] text-sm">Loading products...</p>
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

        @keyframes prod-fadeup {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes prod-spin {
          to { transform: rotate(360deg); }
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .prod-root {
          font-family: 'DM Sans', sans-serif;
          flex: 1;
          background: #f5f7f5;
          padding: 32px 20px 60px;
        }

        .prod-container {
          max-width: 1280px;
          margin: 0 auto;
        }

        /* ── Header ── */
        .prod-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 24px;
          animation: prod-fadeup 0.3s ease both;
        }

        .prod-header-left h1 {
          font-family: 'DM Serif Display', serif;
          font-size: 1.8rem;
          color: #1a3d2b;
          margin: 0;
        }

        .prod-header-left p {
          margin: 2px 0 0;
          color: #78909c;
          font-size: 0.92rem;
        }

        .prod-header-actions {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .prod-add-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, #1565C0, #1E88E5);
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(21, 101, 192, 0.25);
        }

        .prod-add-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(21, 101, 192, 0.35);
        }

        .prod-refresh-btn {
          padding: 10px 14px;
          border: 1.5px solid #e0e7e0;
          border-radius: 10px;
          background: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          color: #546e7a;
          transition: all 0.2s;
        }

        .prod-refresh-btn:hover {
          border-color: #66BB6A;
          color: #2E7D32;
        }

        /* ── Search ── */
        .prod-search-wrap {
          position: relative;
        }

        .prod-search-wrap .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #a5b8a5;
        }

        .prod-search-input {
          padding: 10px 16px 10px 44px;
          border: 1.5px solid #e0e7e0;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          background: #fff;
          width: 260px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .prod-search-input:focus {
          outline: none;
          border-color: #66BB6A;
          box-shadow: 0 0 0 4px rgba(46, 125, 50, 0.08);
        }

        /* ── View Toggle ── */
        .prod-view-toggle {
          display: flex;
          gap: 4px;
          background: #fff;
          border: 1.5px solid #e0e7e0;
          border-radius: 10px;
          padding: 4px;
        }

        .prod-view-btn {
          padding: 8px 10px;
          border: none;
          border-radius: 7px;
          background: transparent;
          color: #78909c;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
        }

        .prod-view-btn:hover {
          background: #e8f5e9;
          color: #2E7D32;
        }

        .prod-view-btn.active {
          background: linear-gradient(135deg, #2E7D32, #43A047);
          color: #fff;
        }

        /* ── Filter Tabs ── */
        .prod-filter-tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 20px;
          animation: prod-fadeup 0.35s ease both;
        }

        .prod-filter-btn {
          padding: 8px 20px;
          border: 1.5px solid #e0e7e0;
          border-radius: 20px;
          background: #fff;
          color: #546e7a;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .prod-filter-btn:hover {
          border-color: #66BB6A;
          color: #2E7D32;
        }

        .prod-filter-btn.active {
          background: linear-gradient(135deg, #2E7D32, #43A047);
          color: #fff;
          border-color: #2E7D32;
        }

        .prod-filter-btn .badge {
          background: rgba(0,0,0,0.1);
          padding: 1px 8px;
          border-radius: 10px;
          font-size: 0.7rem;
          font-weight: 600;
        }

        .prod-filter-btn.active .badge {
          background: rgba(255,255,255,0.2);
          color: #fff;
        }

        /* ── Category Filter ── */
        .prod-categories {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 28px;
          animation: prod-fadeup 0.35s ease both;
        }

        .prod-cat-btn {
          padding: 8px 18px;
          border: 1.5px solid #e0e7e0;
          border-radius: 20px;
          background: #fff;
          color: #546e7a;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .prod-cat-btn:hover {
          border-color: #66BB6A;
          color: #2E7D32;
        }

        .prod-cat-btn.active {
          background: linear-gradient(135deg, #2E7D32, #43A047);
          color: #fff;
          border-color: #2E7D32;
        }

        /* ── Error ── */
        .prod-error {
          padding: 14px 18px;
          border-radius: 10px;
          margin-bottom: 20px;
          background: #ffebee;
          border-left: 4px solid #ef5350;
          color: #c62828;
          font-size: 0.92rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .prod-error-retry {
          padding: 4px 16px;
          background: #ef5350;
          color: #fff;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          transition: opacity 0.2s;
        }

        .prod-error-retry:hover {
          opacity: 0.85;
        }

        /* ── Empty State ── */
        .prod-empty {
          background: #fff;
          border-radius: 16px;
          padding: 60px 20px;
          text-align: center;
          border: 1.5px solid #e8f5e9;
          box-shadow: 0 2px 12px rgba(27, 94, 32, 0.06);
        }

        .prod-empty .icon {
          color: #a5d6a7;
          margin-bottom: 14px;
        }

        .prod-empty h3 {
          font-family: 'DM Serif Display', serif;
          color: #2E7D32;
          margin: 0 0 8px;
          font-size: 1.3rem;
        }

        .prod-empty p {
          color: #78909c;
          margin: 0 0 16px;
          font-size: 0.95rem;
        }

        .prod-empty .prod-add-btn {
          margin: 0 auto;
        }

        /* ── Product Grid ── */
        .prod-grid {
          display: grid;
          gap: 22px;
          animation: prod-fadeup 0.4s ease both;
        }

        .prod-grid.grid {
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        }

        .prod-grid.list {
          grid-template-columns: 1fr;
        }

        /* ── Product Card ── */
        .prod-card {
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          border: 1.5px solid #e8f5e9;
          box-shadow: 0 2px 12px rgba(27, 94, 32, 0.06);
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
          cursor: pointer;
          position: relative;
        }

        .prod-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 28px rgba(27, 94, 32, 0.12);
          border-color: #a5d6a7;
        }

        .prod-card.list-mode {
          display: flex;
        }

        .prod-card.list-mode .prod-card-image {
          width: 200px;
          min-height: 200px;
          flex-shrink: 0;
        }

        .prod-card.list-mode .prod-card-body {
          flex: 1;
        }

        .prod-card-image {
          height: 200px;
          background: #e8f5e9;
          overflow: hidden;
          position: relative;
        }

        .prod-card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* ── Video Thumbnail ── */
        .prod-video-thumbnail {
          width: 100%;
          height: 100%;
          position: relative;
          background: #1a1a2e;
        }

        .prod-video-thumbnail video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .prod-video-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.2);
          transition: background 0.3s;
        }

        .prod-card:hover .prod-video-overlay {
          background: rgba(0, 0, 0, 0.1);
        }

        .prod-video-overlay svg {
          opacity: 0.9;
          transition: transform 0.3s;
        }

        .prod-card:hover .prod-video-overlay svg {
          transform: scale(1.1);
        }

        .prod-video-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: rgba(0, 0, 0, 0.7);
          color: #fff;
          font-size: 0.6rem;
          font-weight: 700;
          padding: 2px 10px;
          border-radius: 10px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .prod-video-badge svg {
          width: 12px;
          height: 12px;
        }

        .prod-no-image {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #a5b8a5;
          font-size: 0.9rem;
        }

        .prod-card-image .category-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(0, 0, 0, 0.7);
          color: #fff;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          z-index: 2;
        }

        .prod-status-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          z-index: 2;
        }

        .prod-status-badge.available {
          background: rgba(46, 125, 50, 0.9);
          color: #fff;
        }

        .prod-status-badge.unavailable {
          background: rgba(198, 40, 40, 0.9);
          color: #fff;
        }

        .prod-ownership-badge {
          position: absolute;
          bottom: 48px;
          left: 12px;
          padding: 3px 10px;
          border-radius: 10px;
          font-size: 0.6rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          z-index: 2;
          background: rgba(21, 101, 192, 0.9);
          color: #fff;
        }

        .prod-media-count {
          position: absolute;
          bottom: 12px;
          right: 12px;
          background: rgba(0, 0, 0, 0.6);
          color: #fff;
          padding: 2px 10px;
          border-radius: 10px;
          font-size: 0.65rem;
          font-weight: 500;
          backdrop-filter: blur(4px);
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .prod-card-body {
          padding: 18px 20px 20px;
        }

        .prod-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 6px;
        }

        .prod-card-name {
          font-weight: 600;
          font-size: 1.05rem;
          color: #263238;
          margin: 0;
          flex: 1;
        }

        .prod-card-price {
          font-family: 'DM Serif Display', serif;
          font-size: 1.2rem;
          color: #2E7D32;
          white-space: nowrap;
        }

        .prod-card-price .unit-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.7rem;
          color: #78909c;
          font-weight: 500;
        }

        .prod-card-desc {
          font-size: 0.85rem;
          color: #78909c;
          margin: 6px 0 12px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.5;
        }

        .prod-card-meta {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          font-size: 0.78rem;
          color: #90a4ae;
          margin-bottom: 14px;
          padding-bottom: 14px;
          border-bottom: 1px solid #e8f5e9;
        }

        .prod-card-meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .prod-card-farmer {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 500;
          color: #37474f;
          cursor: pointer;
        }

        .prod-card-farmer:hover {
          color: #2E7D32;
        }

        .prod-farmer-avatar {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          overflow: hidden;
          border: 1.5px solid #e8f5e9;
          background: #e8f5e9;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .prod-farmer-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .prod-farmer-avatar .fallback {
          font-size: 0.55rem;
          font-weight: 700;
          color: #2d6a4f;
        }

        .prod-card-location {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.72rem;
          color: #78909c;
          cursor: pointer;
          transition: color 0.2s;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .prod-card-location:hover {
          color: #0277bd;
          background: #e3f2fd;
        }

        .prod-card-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .prod-action-btn {
          padding: 8px 14px;
          border: none;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: opacity 0.2s, transform 0.15s;
          flex: 1;
        }

        .prod-action-btn:hover:not(:disabled) {
          opacity: 0.88;
          transform: translateY(-1px);
        }

        .prod-action-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .prod-action-btn.edit {
          background: linear-gradient(135deg, #1565C0, #1E88E5);
          color: #fff;
          box-shadow: 0 4px 14px rgba(21, 101, 192, 0.2);
        }

        .prod-action-btn.delete {
          background: linear-gradient(135deg, #c62828, #ef5350);
          color: #fff;
          box-shadow: 0 4px 14px rgba(198, 40, 40, 0.2);
        }

        .prod-action-btn.toggle-available {
          background: linear-gradient(135deg, #2E7D32, #43A047);
          color: #fff;
          box-shadow: 0 4px 14px rgba(46, 125, 50, 0.2);
        }

        .prod-action-btn.toggle-unavailable {
          background: linear-gradient(135deg, #e65100, #f57c00);
          color: #fff;
          box-shadow: 0 4px 14px rgba(230, 81, 0, 0.2);
        }

        .prod-action-btn.add-to-cart {
          background: linear-gradient(135deg, #1565C0, #1E88E5);
          color: #fff;
          box-shadow: 0 4px 14px rgba(21, 101, 192, 0.25);
        }

        .prod-action-btn.purchase {
          background: linear-gradient(135deg, #2E7D32, #43A047);
          color: #fff;
          box-shadow: 0 4px 14px rgba(46, 125, 50, 0.25);
        }

        /* ── Stats Bar ── */
        .prod-stats {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
          padding: 16px 20px;
          background: #fff;
          border-radius: 12px;
          border: 1.5px solid #e8f5e9;
          margin-bottom: 24px;
        }

        .prod-stat {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: #546e7a;
        }

        .prod-stat strong {
          color: #263238;
          font-size: 1rem;
        }

        /* ── Media Type Indicator ── */
        .prod-media-type {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.6rem;
          color: #78909c;
          background: rgba(0,0,0,0.6);
          padding: 2px 8px;
          border-radius: 10px;
          color: #fff;
          position: absolute;
          bottom: 12px;
          left: 12px;
          z-index: 2;
        }

        .prod-media-type svg {
          width: 12px;
          height: 12px;
        }

        /* ── Loading Spinner ── */
        .spinner-small {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: prod-spin 0.6s linear infinite;
        }

        /* ── Image Navigation Arrows ── */
        .prod-image-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0, 0, 0, 0.6);
          color: white;
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          z-index: 3;
          opacity: 0;
          backdrop-filter: blur(4px);
        }

        .prod-card:hover .prod-image-nav {
          opacity: 1;
        }

        .prod-image-nav:hover {
          background: rgba(0, 0, 0, 0.8);
          transform: translateY(-50%) scale(1.1);
        }

        .prod-image-nav.prev {
          left: 8px;
        }

        .prod-image-nav.next {
          right: 8px;
        }

        .prod-image-nav svg {
          width: 18px;
          height: 18px;
        }

        /* ── Image Dots ── */
        .prod-image-dots {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 6px;
          z-index: 3;
        }

        .prod-image-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          transition: all 0.3s;
          cursor: pointer;
        }

        .prod-image-dot.active {
          background: white;
          transform: scale(1.3);
        }

        .prod-image-dot:hover {
          background: rgba(255, 255, 255, 0.8);
        }

        @media (max-width: 768px) {
          .prod-header { flex-direction: column; align-items: stretch; }
          .prod-header-actions { flex-direction: column; }
          .prod-search-input { width: 100%; }
          .prod-card.list-mode { flex-direction: column; }
          .prod-card.list-mode .prod-card-image { width: 100%; min-height: 180px; }
          .prod-grid.grid { grid-template-columns: 1fr; }
          .prod-stats { justify-content: center; }
          .prod-card-actions { flex-wrap: wrap; }
          .prod-action-btn { flex: 1; min-width: 80px; }
          .prod-image-nav { opacity: 0.7; width: 28px; height: 28px; }
          .prod-image-nav svg { width: 16px; height: 16px; }
        }

        @media (max-width: 480px) {
          .prod-root { padding: 16px 12px; }
          .prod-header-left h1 { font-size: 1.5rem; }
          .prod-header-actions { gap: 8px; }
          .prod-search-input { width: 100%; font-size: 0.85rem; }
          .prod-stats { gap: 12px; padding: 12px 16px; }
          .prod-stat { font-size: 0.78rem; }
          .prod-stat strong { font-size: 0.9rem; }
          .prod-categories { gap: 6px; }
          .prod-cat-btn { padding: 6px 14px; font-size: 0.75rem; }
          .prod-filter-btn { padding: 6px 14px; font-size: 0.75rem; }
          .prod-card-body { padding: 14px 16px; }
          .prod-card-name { font-size: 0.95rem; }
          .prod-card-price { font-size: 1rem; }
          .prod-card-image { height: 180px; }
          .prod-image-nav { opacity: 0.7; width: 24px; height: 24px; }
          .prod-image-nav svg { width: 14px; height: 14px; }
        }
      `}</style>

      <div className="prod-root">
        <div className="prod-container">

          {/* ── Header ── */}
          <div className="prod-header">
            <div className="prod-header-left">
              <h1>Farm Products</h1>
              <p>Browse and manage products from all farmers</p>
            </div>
            <div className="prod-header-actions">
              <button className="prod-add-btn" onClick={handleAddNewProduct}>
                <PlusIcon size={18} /> Add Product
              </button>
              <div className="prod-search-wrap">
                <span className="search-icon"><SearchIcon size={18} /></span>
                <input
                  type="text"
                  className="prod-search-input"
                  placeholder="Search products or farmers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="prod-refresh-btn" onClick={fetchAllData}>
                <RefreshIcon size={16} /> Refresh
              </button>
              <div className="prod-view-toggle">
                <button
                  className={`prod-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid view"
                >
                  <GridIcon size={18} />
                </button>
                <button
                  className={`prod-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="List view"
                >
                  <ListIcon size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* ── Stats ── */}
          <div className="prod-stats">
            <div className="prod-stat">
              <strong>{allProducts.length}</strong> Total Products
            </div>
            <div className="prod-stat">
              <strong>{allProducts.filter(p => p.isAvailable !== false).length}</strong> Available
            </div>
            <div className="prod-stat">
              <strong>{allProducts.filter(p => p.isOwnProduct).length}</strong> My Products
            </div>
            <div className="prod-stat">
              <strong>{allProducts.filter(p => !p.isOwnProduct && p.isAvailable !== false).length}</strong> From Others
            </div>
            <div className="prod-stat">
              <strong>{filteredProducts.length}</strong> Showing
            </div>
          </div>

          {/* ── Filter Tabs ── */}
          <div className="prod-filter-tabs">
            <button
              className={`prod-filter-btn ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              <StoreIcon size={16} /> All Products
              <span className="badge">{allProducts.length}</span>
            </button>
            <button
              className={`prod-filter-btn ${filterType === 'my' ? 'active' : ''}`}
              onClick={() => setFilterType('my')}
            >
              <EditIcon size={16} /> My Products
              <span className="badge">{allProducts.filter(p => p.isOwnProduct).length}</span>
            </button>
            <button
              className={`prod-filter-btn ${filterType === 'others' ? 'active' : ''}`}
              onClick={() => setFilterType('others')}
            >
              <UsersIcon size={16} /> Other Farmers
              <span className="badge">{allProducts.filter(p => !p.isOwnProduct && p.isAvailable !== false).length}</span>
            </button>
          </div>

          {/* ── Categories ── */}
          <div className="prod-categories">
            {categories.map(cat => (
              <button
                key={cat}
                className={`prod-cat-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="prod-error">
              <span>{error}</span>
              <button className="prod-error-retry" onClick={fetchAllData}>
                Retry
              </button>
            </div>
          )}

          {/* ── Products ── */}
          {filteredProducts.length === 0 ? (
            <div className="prod-empty">
              <div className="icon"><ShoppingCartIcon size={48} /></div>
              <h3>
                {filterType === 'my' 
                  ? 'You haven\'t added any products yet' 
                  : filterType === 'others'
                  ? 'No products available from other farmers'
                  : searchTerm || selectedCategory !== 'All'
                  ? 'No matching products'
                  : 'No products available'}
              </h3>
              <p>
                {filterType === 'my' 
                  ? 'Start adding your farm products to reach more customers'
                  : filterType === 'others'
                  ? 'Check back later for products from other farmers'
                  : searchTerm || selectedCategory !== 'All'
                  ? 'Try adjusting your search or filter criteria'
                  : 'Check back later for fresh products from local farmers'}
              </p>
              {filterType === 'my' && (
                <button className="prod-add-btn" onClick={handleAddNewProduct}>
                  <PlusIcon size={18} /> Add Your First Product
                </button>
              )}
            </div>
          ) : (
            <div className={`prod-grid ${viewMode}`}>
              {filteredProducts.map((product) => {
                const farmerAvatar = getFarmerAvatar(product);
                const farmerName = product.farmer?.name || 'Unknown Farmer';
                const locationDisplay = getLocationDisplay(product);
                const unitLabel = getUnitLabel(product.unit);
                const mediaCount = product.images?.length || 0;
                const currentIndex = imageIndexes[product._id] || 0;
                const currentMedia = product.images && product.images.length > 0 ? product.images[currentIndex] : null;
                const isVideo = currentMedia ? isVideoUrl(currentMedia.url) : false;
                const isDeleting = deletingId === product._id;
                const isAdding = addingToCart === product._id;
                const isAvailable = product.isAvailable !== false;
                const isOwnProduct = product.isOwnProduct;
                
                return (
                  <div 
                    key={product._id} 
                    className={`prod-card ${viewMode === 'list' ? 'list-mode' : ''}`}
                    onClick={() => handleProductClick(product)}
                  >
                    {/* Media with Navigation */}
                    <div className="prod-card-image">
                      {currentMedia ? (
                        isVideo ? (
                          <div className="prod-video-thumbnail">
                            <video
                              src={currentMedia.url.startsWith('http') ? currentMedia.url : `${API_BASE_URL}${currentMedia.url}`}
                              muted
                              playsInline
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = `<div class="prod-no-image">Video Error</div>`;
                              }}
                            />
                            <div className="prod-video-overlay">
                              <PlayIcon size={40} />
                              <span className="prod-video-badge">
                                <VideoIcon size={12} /> VIDEO
                              </span>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={currentMedia.url.startsWith('http') ? currentMedia.url : `${API_BASE_URL}${currentMedia.url}`}
                            alt={product.name}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = `<div class="prod-no-image">No Image</div>`;
                            }}
                          />
                        )
                      ) : (
                        <div className="prod-no-image">No Media</div>
                      )}
                      
                      <span className={`prod-status-badge ${isAvailable ? 'available' : 'unavailable'}`}>
                        {isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                      
                      {isOwnProduct && (
                        <span className="prod-ownership-badge">
                          <EditIcon size={12} /> My Product
                        </span>
                      )}
                      
                      <span className="category-badge">{product.category}</span>
                      
                      {/* Navigation Arrows - only show if multiple images */}
                      {mediaCount > 1 && (
                        <>
                          <button
                            className="prod-image-nav prev"
                            onClick={(e) => navigateImage(e, product._id, 'prev')}
                            aria-label="Previous image"
                          >
                            <ChevronLeftIcon size={18} />
                          </button>
                          <button
                            className="prod-image-nav next"
                            onClick={(e) => navigateImage(e, product._id, 'next')}
                            aria-label="Next image"
                          >
                            <ChevronRightIcon size={18} />
                          </button>
                          
                          {/* Image Dots */}
                          <div className="prod-image-dots">
                            {product.images.map((_, idx) => (
                              <span
                                key={idx}
                                className={`prod-image-dot ${idx === currentIndex ? 'active' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setImageIndexes(prev => ({ ...prev, [product._id]: idx }));
                                }}
                              />
                            ))}
                          </div>
                        </>
                      )}
                      
                      {mediaCount > 1 && (
                        <span className="prod-media-count">
                          {currentIndex + 1} / {mediaCount}
                        </span>
                      )}
                      
                      {currentMedia && isVideo && (
                        <span className="prod-media-type">
                          <VideoIcon size={12} /> Video
                        </span>
                      )}
                    </div>

                    {/* Body */}
                    <div className="prod-card-body">
                      <div className="prod-card-top">
                        <h3 className="prod-card-name">{product.name}</h3>
                        <span className="prod-card-price">
                          ₱{Number(product.price).toFixed(2)}
                          <span className="unit-label"> / {unitLabel}</span>
                        </span>
                      </div>
                      <p className="prod-card-desc">{product.description}</p>

                      <div className="prod-card-meta">
                        <span className="prod-card-meta-item">
                          <ClockIcon size={14} /> {formatDate(product.createdAt)}
                        </span>
                        <span className="prod-card-meta-item">
                          <ShoppingCartIcon size={14} /> {product.quantity} {unitLabel}
                        </span>
                        <span className="prod-card-meta-item">
                          <span className="prod-card-farmer">
                            <span className="prod-farmer-avatar">
                              {farmerAvatar ? (
                                <img src={farmerAvatar} alt={farmerName} />
                              ) : (
                                <span className="fallback">{getFarmerInitial(farmerName)}</span>
                              )}
                            </span>
                            {farmerName}
                            {isOwnProduct && (
                              <span style={{ fontSize: '0.6rem', color: '#1565C0', fontWeight: 600, marginLeft: '2px' }}>
                                (You)
                              </span>
                            )}
                          </span>
                        </span>
                        {locationDisplay && (
                          <span className="prod-card-meta-item">
                            <span 
                              className="prod-card-location"
                              onClick={(e) => handleViewOnMap(e, product)}
                              title="View on map"
                            >
                              <MapPinIcon size={12} /> {locationDisplay}
                            </span>
                          </span>
                        )}
                      </div>

                      <div className="prod-card-actions">
                        {isOwnProduct ? (
                          // Actions for own products
                          <>
                            <button
                              className="prod-action-btn edit"
                              onClick={(e) => handleEditProduct(e, product._id)}
                            >
                              <EditIcon size={14} /> Edit
                            </button>
                            <button
                              className={`prod-action-btn ${isAvailable ? 'toggle-unavailable' : 'toggle-available'}`}
                              onClick={(e) => handleToggleAvailability(e, product)}
                            >
                              {isAvailable ? (
                                <>
                                  <EyeOffIcon size={14} /> Mark Unavailable
                                </>
                              ) : (
                                <>
                                  <EyeIcon size={14} /> Mark Available
                                </>
                              )}
                            </button>
                            <button
                              className="prod-action-btn delete"
                              onClick={(e) => handleDeleteProduct(e, product._id)}
                              disabled={isDeleting}
                            >
                              {isDeleting ? (
                                <span className="spinner-small"></span>
                              ) : (
                                <>
                                  <TrashIcon size={14} /> Delete
                                </>
                              )}
                            </button>
                          </>
                        ) : (
                          // Actions for other farmers' products
                          <>
                            <button
                              className="prod-action-btn add-to-cart"
                              onClick={(e) => handleAddToCart(e, product)}
                              disabled={isAdding || !isAvailable}
                            >
                              {isAdding ? (
                                <span className="spinner-small"></span>
                              ) : (
                                <>
                                  <CartPlusIcon size={16} /> Add to Cart
                                </>
                              )}
                            </button>
                            <button
                              className="prod-action-btn purchase"
                              onClick={(e) => handleBuyNow(e, product)}
                              disabled={!isAvailable}
                            >
                              Buy Now
                            </button>
                          </>
                        )}
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

export default FarmerProduct;