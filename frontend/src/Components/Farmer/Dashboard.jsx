import React from 'react';
import FarmerHeader from '../layouts/FarmerHeader';

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Farmer Header */}
      <FarmerHeader />

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