import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LeftNavigationBar from '../layouts/LeftNavigationBar';
import { getUser, isAuthenticated } from '../utils/helper';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [adminInfo, setAdminInfo] = useState(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    const user = getUser();
    if (user?.role !== 'admin') {
      navigate('/home');
      return;
    }
    
    setAdminInfo(user);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-100">
      <LeftNavigationBar />
      
      <div className="ml-64 p-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome Admin</h1>
          <p className="text-gray-600">{adminInfo?.name ? `Hello, ${adminInfo.name}!` : 'Hello, Administrator!'}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;