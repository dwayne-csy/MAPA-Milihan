import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import LogoutIcon from '@mui/icons-material/Logout';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import logo from '../logo/logo.png';

const Header = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (response.ok && data.user) {
          setUser(data.user);
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate, API_BASE_URL]);

  const toggleProfileMenu = () => setProfileMenuOpen(!profileMenuOpen);
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  const navigationItems = [
    { label: 'Home', path: '/home' },
    { label: 'Products', path: '/product' },
    { label: 'Forums', path: '/forums' },
    { label: 'Mapping', path: '/maps' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const profileMenuItems = [
    { 
      label: 'Edit Profile', 
      icon: EditIcon, 
      action: () => navigate('/edit-profile')
    },
    { 
      label: 'Logout', 
      icon: LogoutIcon, 
      isLogout: true, 
      action: handleLogout
    }
  ];

  const getUserInitials = (name) =>
    name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  const getUserDisplayName = () =>
    user?.name || user?.username || user?.email?.split('@')[0] || 'User';

  const getUserEmail = () => user?.email || 'No email provided';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuOpen && !event.target.closest('.profile-dropdown')) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [profileMenuOpen]);

  const isNavActive = (path) => location.pathname === path;

  if (loading) {
    return (
      <header className="user-header">
        <div className="header-container">Loading...</div>
      </header>
    );
  }

  return (
    <>
      <style>{`
        /* Reset button styles */
        button {
          margin: 0;
          padding: 0;
          background: none;
          border: none;
          font: inherit;
          color: inherit;
          cursor: pointer;
          appearance: none !important;
          -webkit-appearance: none !important;
          -moz-appearance: none !important;
        }

        .user-header {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        .header-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 70px;
        }

        /* System Title */
        .system-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: white;
          font-size: 1.5rem;
          font-weight: 700;
          cursor: pointer;
          letter-spacing: 1px;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .system-title:hover {
          transform: scale(1.02);
          text-shadow: 0 2px 10px rgba(255, 255, 255, 0.3);
        }

        .system-title .title-logo {
          height: 40px;
          width: auto;
          border-radius: 8px;
        }

        .system-title .title-text {
          background: linear-gradient(to right, #ffffff, #a7f3d0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .nav-links {
          display: flex;
          gap: 0.5rem;
          margin: 0 2rem;
          flex: 1;
          justify-content: center;
        }

        .nav-link {
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
          cursor: pointer;
          padding: 8px 20px;
          border-radius: 50px;
          transition: all 0.3s ease;
          font-size: 0.95rem;
          position: relative;
          background: transparent;
          letter-spacing: 0.3px;
        }

        .nav-link:hover {
          color: white;
          background: rgba(255, 255, 255, 0.12);
          transform: translateY(-2px);
        }

        .nav-link.active {
          color: white;
          background: rgba(255, 255, 255, 0.2);
          font-weight: 600;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
        }

        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: 4px;
          left: 50%;
          transform: translateX(-50%);
          width: 24px;
          height: 3px;
          background: #4ade80;
          border-radius: 2px;
        }

        .profile-dropdown {
          position: relative;
        }

        .profile-trigger {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 6px 12px 6px 6px;
          border-radius: 50px;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
        }

        .profile-trigger:hover {
          background: rgba(255, 255, 255, 0.18);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          border: 2px solid rgba(255, 255, 255, 0.3);
          font-size: 0.85rem;
        }

        .avatar-image {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          text-align: left;
        }

        .user-name {
          font-size: 0.85rem;
          font-weight: 600;
          color: white;
        }

        .user-email {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.75);
        }

        .dropdown-arrow {
          width: 20px;
          height: 20px;
          color: rgba(255, 255, 255, 0.7);
          transition: transform 0.3s ease;
        }

        .dropdown-arrow.open {
          transform: rotate(180deg);
          color: white;
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          min-width: 200px;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-15px);
          transition: all 0.3s ease;
          border: 1px solid #e5e7eb;
          overflow: hidden;
          z-index: 1001;
        }

        .dropdown-menu.show {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .dropdown-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          font-size: 0.95rem;
          color: #374151;
          text-align: left;
          transition: all 0.2s ease;
          border-bottom: 1px solid #f3f4f6;
        }

        .dropdown-item:hover {
          background: #f9fafb;
          color: #1f2937;
        }

        .dropdown-item:last-child {
          border-bottom: none;
        }

        .dropdown-item.logout {
          color: #dc2626;
        }

        .dropdown-item.logout:hover {
          background: #fee2e2;
          color: #b91c1c;
        }

        .dropdown-item .icon {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .user-section {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        /* Mobile Menu Button */
        .mobile-menu-btn {
          display: none;
          color: white;
          cursor: pointer;
          padding: 6px 8px;
          border-radius: 8px;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.08);
          font-size: 1.8rem;
          line-height: 1;
        }

        .mobile-menu-btn:hover {
          background: rgba(255, 255, 255, 0.18);
        }

        /* Mobile Navigation */
        .mobile-nav {
          display: none;
          flex-direction: column;
          background: rgba(4, 120, 87, 0.98);
          backdrop-filter: blur(10px);
          padding: 0.5rem 0;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
        }

        .mobile-nav.open {
          display: flex;
          max-height: 500px;
        }

        .mobile-nav-link {
          color: rgba(255, 255, 255, 0.85);
          padding: 14px 2rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          text-align: center;
          font-size: 1rem;
          letter-spacing: 0.5px;
        }

        .mobile-nav-link:hover {
          background: rgba(255, 255, 255, 0.08);
          color: white;
        }

        .mobile-nav-link.active {
          background: rgba(255, 255, 255, 0.12);
          color: white;
          font-weight: 600;
        }

        @media (max-width: 1024px) {
          .nav-links {
            gap: 0.25rem;
            margin: 0 0.5rem;
          }

          .nav-link {
            padding: 6px 14px;
            font-size: 0.85rem;
          }
        }

        @media (max-width: 768px) {
          .nav-links {
            display: none;
          }

          .header-container {
            padding: 0 1rem;
            height: 60px;
          }

          .system-title {
            font-size: 1.2rem;
          }

          .system-title .title-logo {
            height: 32px;
          }

          .user-info {
            display: none;
          }

          .dropdown-menu {
            min-width: 180px;
            right: -10px;
          }

          .mobile-menu-btn {
            display: flex;
            align-items: center;
          }

          .profile-trigger {
            padding: 4px 8px 4px 4px;
          }

          .user-avatar {
            width: 30px;
            height: 30px;
            font-size: 0.7rem;
          }
        }

        @media (max-width: 480px) {
          .system-title {
            font-size: 1rem;
          }

          .system-title .title-logo {
            height: 28px;
          }

          .header-container {
            padding: 0 0.75rem;
            height: 55px;
          }

          .mobile-nav-link {
            padding: 12px 1.5rem;
            font-size: 0.9rem;
          }
        }
      `}</style>

      <header className="user-header">
        <div className="header-container">
          {/* System Title with Logo */}
          <div className="system-title" onClick={() => navigate('/home')}>
            {!logoError ? (
              <img 
                src={logo} 
                alt="MAPA-Milihan Logo" 
                className="title-logo"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span style={{ fontSize: '1.8rem', color: 'white' }}>📍</span>
            )}
            <span className="title-text">MAPA-Milihan</span>
          </div>

          {/* Navigation Links - Desktop */}
          <nav className="nav-links">
            {navigationItems.map((item, i) => (
              <div
                key={i}
                className={`nav-link ${isNavActive(item.path) ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                {item.label}
              </div>
            ))}
          </nav>

          {/* User Profile Section */}
          <div className="user-section">
            <div className="profile-dropdown">
              <button className="profile-trigger" onClick={toggleProfileMenu}>
                <div className="user-avatar">
                  {user?.avatar?.url ? (
                    <img src={user.avatar.url} alt="avatar" className="avatar-image" />
                  ) : (
                    getUserInitials(getUserDisplayName())
                  )}
                </div>

                <div className="user-info">
                  <div className="user-name">{getUserDisplayName()}</div>
                  <div className="user-email">{getUserEmail()}</div>
                </div>

                <ExpandMoreIcon className={`dropdown-arrow ${profileMenuOpen ? 'open' : ''}`} />
              </button>

              <div className={`dropdown-menu ${profileMenuOpen ? 'show' : ''}`}>
                {profileMenuItems.map((item, i) => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={i}
                      className={`dropdown-item ${item.isLogout ? 'logout' : ''}`}
                      onClick={() => {
                        setProfileMenuOpen(false);
                        item.action();
                      }}
                    >
                      <span className="icon">
                        <IconComponent fontSize="small" />
                      </span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="mobile-menu-btn" 
              onClick={toggleMobileMenu}
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`mobile-nav ${mobileMenuOpen ? 'open' : ''}`}>
          {navigationItems.map((item, i) => (
            <div
              key={i}
              className={`mobile-nav-link ${isNavActive(item.path) ? 'active' : ''}`}
              onClick={() => {
                navigate(item.path);
                setMobileMenuOpen(false);
              }}
            >
              {item.label}
            </div>
          ))}
        </div>
      </header>
    </>
  );
};

export default Header;