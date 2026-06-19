import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../layouts/Header';
import ChatbotWidget from './ChatbotWidget';

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // API Base URL from environment variable
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setLoading(false);
    fetchUserProfile(token);
  }, [navigate]);

  const fetchUserProfile = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (response.ok && data.user) {
        setUser(data.user);
        // Update localStorage with fresh user data
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  if (loading) {
    return (
      <div className="full-bleed w-full min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="full-bleed w-full min-h-screen bg-white flex flex-col">
      {/* Header Component */}
      <Header />

      {/* Main Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Home</h1>
          <p className="text-lg text-gray-600">
            Welcome, {user?.name || 'User'}!
          </p>
          
          {/* Placeholder content - you can add more here */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Dashboard</h3>
              <p className="text-gray-600 mt-2">View your farming dashboard</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Products</h3>
              <p className="text-gray-600 mt-2">Browse agricultural products</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Community</h3>
              <p className="text-gray-600 mt-2">Connect with other farmers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chatbot Widget */}
      <ChatbotWidget 
        isOpen={isChatOpen} 
        onClose={toggleChat} 
        sessionId={`user-${user?.id || 'guest'}-${Date.now()}`}
      />
    </div>
  );
};

export default Home;