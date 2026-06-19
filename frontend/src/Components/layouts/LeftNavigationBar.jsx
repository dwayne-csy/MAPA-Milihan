import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../utils/helper';

const LeftNavigationBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout(() => {
      navigate('/login');
    });
  };

  const menuItems = [
    { 
      label: 'Manage User', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      path: '/admin/users',
      active: location.pathname === '/admin/users'
    },
    { 
      label: 'Reports', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      path: '/admin/reports',
      active: location.pathname === '/admin/reports'
    },
    { 
      label: 'Contacts', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      path: '/admin/contacts',
      active: location.pathname === '/admin/contacts'
    },
    { 
      label: 'Logout', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ),
      action: handleLogout,
      isLogout: true
    }
  ];

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      <style>{`
        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          height: 100vh;
          background: linear-gradient(180deg, #1e3a5f 0%, #0f2b45 100%);
          color: white;
          transition: width 0.3s ease;
          z-index: 1000;
          box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
        }

        .sidebar.expanded {
          width: 250px;
        }

        .sidebar.collapsed {
          width: 70px;
        }

        .toggle-btn {
          position: absolute;
          top: 20px;
          right: -12px;
          width: 24px;
          height: 24px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
          transition: transform 0.3s ease;
          z-index: 1001;
        }

        .toggle-btn:hover {
          transform: scale(1.1);
        }

        .sidebar-header {
          padding: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 20px;
        }

        .sidebar-header h3 {
          font-size: 18px;
          font-weight: bold;
          white-space: nowrap;
          overflow: hidden;
        }

        .nav-menu {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .nav-item {
          margin-bottom: 5px;
        }

        .nav-link {
          display: flex;
          align-items: center;
          padding: 12px 20px;
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none;
          transition: all 0.3s ease;
          cursor: pointer;
          gap: 12px;
        }

        .nav-link:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .nav-link.active {
          background: rgba(255, 255, 255, 0.15);
          color: white;
          border-left: 3px solid #3b82f6;
        }

        .nav-link.logout {
          margin-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.7);
        }

        .nav-link.logout:hover {
          background: rgba(220, 38, 38, 0.2);
          color: #ef4444;
        }

        .nav-icon {
          min-width: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nav-label {
          white-space: nowrap;
          overflow: hidden;
        }

        .sidebar.collapsed .nav-label {
          display: none;
        }

        .sidebar.collapsed .sidebar-header h3 {
          display: none;
        }

        .sidebar.collapsed .nav-link {
          justify-content: center;
          padding: 12px;
        }

        .main-content {
          margin-left: 250px;
          transition: margin-left 0.3s ease;
        }

        .main-content.sidebar-collapsed {
          margin-left: 70px;
        }

        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
          }
          .sidebar.mobile-open {
            transform: translateX(0);
          }
          .main-content {
            margin-left: 0;
          }
        }
      `}</style>

      <div className={`sidebar ${isCollapsed ? 'collapsed' : 'expanded'}`}>
        <div className="toggle-btn" onClick={toggleSidebar}>
          <svg 
            className={`w-4 h-4 text-gray-600 transform transition-transform ${isCollapsed ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </div>

        <div className="sidebar-header">
          <h3>Admin Panel</h3>
        </div>

        <ul className="nav-menu">
          {menuItems.map((item, index) => (
            <li key={index} className="nav-item">
              <div
                className={`nav-link ${item.active ? 'active' : ''} ${item.isLogout ? 'logout' : ''}`}
                onClick={() => item.action ? item.action() : navigate(item.path)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default LeftNavigationBar;