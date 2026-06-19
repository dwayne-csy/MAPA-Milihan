import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../logo/logo.png';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/password/forgot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: data.message || `Password reset email sent to ${email}. Please check your inbox.` 
        });
        setEmail('');
        
        // Redirect to login after 5 seconds
        setTimeout(() => {
          navigate('/login');
        }, 5000);
      } else {
        setMessage({ 
          type: 'error', 
          text: data.message || 'Failed to send reset email. Please try again.' 
        });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setMessage({ 
        type: 'error', 
        text: 'Network error. Please make sure the backend server is running.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="full-bleed w-full min-h-screen bg-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src={logo} 
              alt="MAPA-Milihan Logo" 
              className="h-20 w-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            MAPA-Milihan
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Forgot your password?
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {/* Message Alerts */}
        {message.text && (
          <div className={`p-4 rounded-lg text-sm ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-600'
          }`}>
            {message.text}
          </div>
        )}

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </span>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        {/* Back to Login Link */}
        <div className="text-center">
          <Link to="/login" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
            ← Back to Sign In
          </Link>
        </div>

        {/* Info Box */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            We'll send a password reset link to your email address. 
            The link will expire in 30 minutes for security reasons.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;