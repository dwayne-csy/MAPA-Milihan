import React from 'react';
import FarmerHeader from '../layouts/FarmerHeader';

const Dashboard = () => {
  return (
    <div className="full-bleed w-full min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col">
      <FarmerHeader />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center px-4">
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