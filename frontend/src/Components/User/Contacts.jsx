import React from 'react';
import Header from '../layouts/Header';

const Contacts = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-center mb-6">Contact Us</h1>
          
          <div className="space-y-4">
            <p className="text-lg">
              <strong>Phone:</strong> 09120930219312
            </p>
            <p className="text-lg">
              <strong>Email:</strong> tup@gmail.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contacts;