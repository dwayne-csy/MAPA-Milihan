import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FarmerHeader from '../../layouts/FarmerHeader';

// ── Icons ───────────────────────────────────────────────────────────────
const PlusIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);

const EditIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const TrashIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

const PackageIcon = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"/>
  </svg>
);

const SearchIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

const EyeIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

// ── Component ───────────────────────────────────────────────────────────
const ProductList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/v1/products/farmer/products`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setProducts(data.products || []);
      } else {
        setError(data.message || 'Failed to fetch products');
      }
    } catch (err) {
      console.error('Fetch products error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId, e) => {
    e.stopPropagation(); // Prevent navigation to view product
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/v1/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setProducts(products.filter(p => p._id !== productId));
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to delete product');
      }
    } catch (err) {
      console.error('Delete product error:', err);
      setError('Network error. Please try again.');
    }
  };

  const handleProductClick = (productId) => {
    navigate(`/farmer/view-product/${productId}`);
  };

  const handleEditClick = (productId, e) => {
    e.stopPropagation(); // Prevent navigation to view product
    navigate(`/farmer/update-product/${productId}`);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <>
        <FarmerHeader />
        <style>{`
          @keyframes pl-spin { to { transform: rotate(360deg); } }
        `}</style>
        <div style={{
          minHeight: '100vh',
          background: '#f5f7f5',
          paddingTop: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #c8e6c9',
              borderTopColor: '#2E7D32',
              borderRadius: '50%',
              animation: 'pl-spin 0.9s linear infinite',
              margin: '0 auto 16px'
            }} />
            <p style={{ color: '#546e7a', fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem' }}>
              Loading your products...
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <FarmerHeader />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        @keyframes pl-fadeup {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .pl-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          background: #f5f7f5;
          padding-top: 80px;
        }

        .pl-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 20px 60px;
        }

        .pl-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 28px;
          animation: pl-fadeup 0.3s ease both;
        }

        .pl-header-left h1 {
          font-family: 'DM Serif Display', serif;
          font-size: 1.8rem;
          color: #1a3d2b;
          margin: 0;
        }

        .pl-header-left p {
          margin: 2px 0 0;
          color: #78909c;
          font-size: 0.92rem;
        }

        .pl-header-actions {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .pl-search-wrap {
          position: relative;
        }

        .pl-search-wrap .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #a5b8a5;
        }

        .pl-search-input {
          padding: 10px 16px 10px 40px;
          border: 1.5px solid #e0e7e0;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          background: #fff;
          width: 220px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .pl-search-input:focus {
          outline: none;
          border-color: #66BB6A;
          box-shadow: 0 0 0 4px rgba(46, 125, 50, 0.08);
        }

        .pl-add-btn {
          padding: 10px 22px;
          background: linear-gradient(135deg, #2E7D32, #43A047);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 7px;
          transition: opacity 0.2s, transform 0.15s;
          box-shadow: 0 4px 14px rgba(46, 125, 50, 0.2);
          white-space: nowrap;
        }

        .pl-add-btn:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }

        .pl-alert {
          padding: 14px 18px;
          border-radius: 10px;
          margin-bottom: 20px;
          font-size: 0.92rem;
          background: #ffebee;
          border-left: 4px solid #ef5350;
          color: #c62828;
          animation: pl-fadeup 0.3s ease both;
        }

        .pl-empty {
          background: #fff;
          border-radius: 16px;
          padding: 60px 20px;
          text-align: center;
          border: 1.5px solid #e8f5e9;
          box-shadow: 0 2px 12px rgba(27, 94, 32, 0.06);
          animation: pl-fadeup 0.3s ease both;
        }

        .pl-empty .icon {
          color: #a5d6a7;
          margin-bottom: 14px;
        }

        .pl-empty h3 {
          font-family: 'DM Serif Display', serif;
          color: #2E7D32;
          margin: 0 0 8px;
          font-size: 1.3rem;
        }

        .pl-empty p {
          color: #78909c;
          margin: 0 0 20px;
          font-size: 0.95rem;
        }

        .pl-empty-btn {
          padding: 12px 28px;
          background: linear-gradient(135deg, #2E7D32, #43A047);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.92rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s;
        }

        .pl-empty-btn:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }

        .pl-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 22px;
          animation: pl-fadeup 0.4s ease both;
        }

        .pl-product-card {
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          border: 1.5px solid #e8f5e9;
          box-shadow: 0 2px 12px rgba(27, 94, 32, 0.06);
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
          cursor: pointer;
        }

        .pl-product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 28px rgba(27, 94, 32, 0.12);
          border-color: #a5d6a7;
        }

        .pl-product-image {
          height: 200px;
          background: #e8f5e9;
          overflow: hidden;
        }

        .pl-product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .pl-product-image .no-image {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #a5b8a5;
          font-size: 0.9rem;
        }

        .pl-product-body {
          padding: 18px 20px 20px;
        }

        .pl-product-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 6px;
        }

        .pl-product-name {
          font-weight: 600;
          font-size: 1.05rem;
          color: #263238;
          margin: 0;
          flex: 1;
        }

        .pl-product-status {
          font-size: 0.68rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 4px 12px;
          border-radius: 20px;
          white-space: nowrap;
        }

        .pl-product-status.available {
          background: #e8f5e9;
          color: #2E7D32;
        }

        .pl-product-status.unavailable {
          background: #ffebee;
          color: #c62828;
        }

        .pl-product-desc {
          font-size: 0.85rem;
          color: #78909c;
          margin: 6px 0 14px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.5;
        }

        .pl-product-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0 14px;
          border-top: 1px solid #e8f5e9;
          border-bottom: 1px solid #e8f5e9;
          margin-bottom: 14px;
        }

        .pl-product-price {
          font-family: 'DM Serif Display', serif;
          font-size: 1.3rem;
          color: #2E7D32;
        }

        .pl-product-qty {
          font-size: 0.82rem;
          color: #78909c;
        }

        .pl-product-qty strong {
          color: #37474f;
        }

        .pl-product-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.72rem;
          color: #a5b8a5;
          margin-bottom: 14px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .pl-product-actions {
          display: flex;
          gap: 10px;
        }

        .pl-action-btn {
          flex: 1;
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          transition: opacity 0.2s, transform 0.15s;
        }

        .pl-action-btn:hover {
          opacity: 0.85;
          transform: translateY(-1px);
        }

        .pl-action-btn.view {
          background: #e3f2fd;
          color: #0d47a1;
        }

        .pl-action-btn.view:hover {
          background: #bbdefb;
        }

        .pl-action-btn.edit {
          background: #e8f5e9;
          color: #2E7D32;
        }

        .pl-action-btn.edit:hover {
          background: #c8e6c9;
        }

        .pl-action-btn.delete {
          background: #ffebee;
          color: #c62828;
        }

        .pl-action-btn.delete:hover {
          background: #ffcdd2;
        }

        @media (max-width: 640px) {
          .pl-header { flex-direction: column; align-items: stretch; }
          .pl-header-actions { flex-direction: column; }
          .pl-search-input { width: 100%; }
          .pl-grid { grid-template-columns: 1fr; }
          .pl-product-actions { flex-wrap: wrap; }
          .pl-action-btn { flex: 1; min-width: 80px; }
        }
      `}</style>

      <div className="pl-root">
        <div className="pl-container">
          {/* ── Header ── */}
          <div className="pl-header">
            <div className="pl-header-left">
              <h1>My Products</h1>
              <p>{products.length} product{products.length !== 1 ? 's' : ''} listed</p>
            </div>
            <div className="pl-header-actions">
              <div className="pl-search-wrap">
                <span className="search-icon"><SearchIcon /></span>
                <input
                  type="text"
                  className="pl-search-input"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                className="pl-add-btn"
                onClick={() => navigate('/farmer/create-product')}
              >
                <PlusIcon size={18} /> Add Product
              </button>
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="pl-alert">
              {error}
            </div>
          )}

          {/* ── Content ── */}
          {filteredProducts.length === 0 ? (
            <div className="pl-empty">
              <div className="icon"><PackageIcon size={48} /></div>
              <h3>{searchTerm ? 'No matching products' : 'No Products Yet'}</h3>
              <p>
                {searchTerm
                  ? `No products found matching "${searchTerm}"`
                  : 'Start selling by adding your first product.'}
              </p>
              <button
                className="pl-empty-btn"
                onClick={() => navigate('/farmer/create-product')}
              >
                + Create Your First Product
              </button>
            </div>
          ) : (
            <div className="pl-grid">
              {filteredProducts.map((product) => (
                <div 
                  key={product._id} 
                  className="pl-product-card"
                  onClick={() => handleProductClick(product._id)}
                >
                  {/* Image */}
                  <div className="pl-product-image">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0].url}
                        alt={product.name}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = `<div class="no-image">No Image</div>`;
                        }}
                      />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="pl-product-body">
                    <div className="pl-product-top">
                      <h3 className="pl-product-name">{product.name}</h3>
                      <span className={`pl-product-status ${product.isAvailable ? 'available' : 'unavailable'}`}>
                        {product.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <p className="pl-product-desc">{product.description}</p>

                    <div className="pl-product-meta">
                      <span className="pl-product-price">₱{Number(product.price).toFixed(2)}</span>
                      <span className="pl-product-qty">Qty: <strong>{product.quantity}</strong> {product.unit}</span>
                    </div>

                    <div className="pl-product-footer">
                      <span>{product.category}</span>
                      <span>{new Date(product.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>

                    <div className="pl-product-actions">
                      <button
                        className="pl-action-btn view"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProductClick(product._id);
                        }}
                      >
                        <EyeIcon size={14} /> View
                      </button>
                      <button
                        className="pl-action-btn edit"
                        onClick={(e) => handleEditClick(product._id, e)}
                      >
                        <EditIcon size={14} /> Edit
                      </button>
                      <button
                        className="pl-action-btn delete"
                        onClick={(e) => handleDelete(product._id, e)}
                      >
                        <TrashIcon size={14} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProductList;