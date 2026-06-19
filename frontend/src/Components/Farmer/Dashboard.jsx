import React from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../utils/helper';

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(() => {
      navigate('/login');
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Navbar with Logout Button */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-green-700">🌾 Farmer Portal</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414l-4-4H3z" clipRule="evenodd" />
                <path d="M10 8v4m0 4h.01" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-green-800 mb-4">
            🌾 Welcome Farmers!
          </h1>
          <p className="text-xl text-green-600">
            Your farming dashboard is ready.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;