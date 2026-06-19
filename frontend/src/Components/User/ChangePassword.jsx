import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../layouts/Header';

// ── Icons ───────────────────────────────────────────────────────────────
const LockIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const CheckIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5"/>
  </svg>
);

const AlertTriangleIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const EyeIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const ArrowLeftIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
);

// ── Component ───────────────────────────────────────────────────────────
const ChangePassword = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (message.text) setMessage({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.oldPassword || !formData.newPassword || !formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }

    if (formData.oldPassword === formData.newPassword) {
      setMessage({ type: 'error', text: 'New password must be different from old password' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/password/update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully! Redirecting...' });
        setFormData({
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        setTimeout(() => {
          navigate('/edit-profile');
        }, 2000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to change password' });
      }
    } catch (error) {
      console.error('Change password error:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/edit-profile');
  };

  return (
    <div className="full-bleed w-full min-h-screen bg-white flex flex-col">
      <Header />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        @keyframes cp-fadeup {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes cp-spin {
          to { transform: rotate(360deg); }
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .cp-root {
          font-family: 'DM Sans', sans-serif;
          flex: 1;
          background: #f9fafb;
          padding: 32px 20px 60px;
        }

        .cp-container {
          max-width: 540px;
          margin: 0 auto;
        }

        .cp-card {
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 2px 20px rgba(5, 150, 105, 0.08);
          border: 1px solid #d1fae5;
          animation: cp-fadeup 0.4s ease both;
          overflow: hidden;
        }

        .cp-header {
          background: linear-gradient(135deg, #059669, #047857);
          padding: 24px 28px;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .cp-header-icon {
          width: 44px;
          height: 44px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          flex-shrink: 0;
        }

        .cp-header h1 {
          font-family: 'DM Serif Display', serif;
          font-size: 1.5rem;
          color: #fff;
          margin: 0;
        }

        .cp-header p {
          margin: 2px 0 0;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .cp-body {
          padding: 28px;
        }

        /* ── Alerts ── */
        .cp-alert {
          padding: 14px 18px;
          border-radius: 10px;
          margin-bottom: 20px;
          font-size: 0.92rem;
          display: flex;
          align-items: center;
          gap: 10px;
          animation: slideDown 0.3s ease both;
        }

        .cp-alert-error {
          background: #ffebee;
          border-left: 4px solid #ef5350;
          color: #c62828;
        }

        .cp-alert-success {
          background: #e8f5e9;
          border-left: 4px solid #43A047;
          color: #2E7D32;
        }

        /* ── Form ── */
        .cp-form-group {
          margin-bottom: 20px;
        }

        .cp-form-label {
          display: block;
          font-size: 0.78rem;
          font-weight: 600;
          color: #37474f;
          margin-bottom: 6px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .cp-form-label .required {
          color: #ef5350;
        }

        .cp-input-wrapper {
          position: relative;
        }

        .cp-form-input {
          width: 100%;
          padding: 12px 44px 12px 16px;
          border: 1.5px solid #e0e7e0;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          color: #263238;
          background: #fafcfa;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .cp-form-input:focus {
          outline: none;
          border-color: #059669;
          box-shadow: 0 0 0 4px rgba(5, 150, 105, 0.1);
          background: #fff;
        }

        .cp-password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #a5b8a5;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }

        .cp-password-toggle:hover {
          color: #059669;
        }

        .cp-hint {
          font-size: 0.75rem;
          color: #a5b8a5;
          margin-top: 4px;
        }

        /* ── Actions ── */
        .cp-actions {
          display: flex;
          gap: 14px;
          margin-top: 8px;
          padding-top: 24px;
          border-top: 1.5px solid #d1fae5;
        }

        .cp-btn {
          padding: 14px 32px;
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          flex: 1;
        }

        .cp-btn:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }

        .cp-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .cp-btn-primary {
          background: linear-gradient(135deg, #059669, #047857);
          color: #fff;
          box-shadow: 0 4px 16px rgba(5, 150, 105, 0.25);
        }

        .cp-btn-secondary {
          background: #ecfdf5;
          color: #059669;
          border: 1.5px solid #a7f3d0;
        }

        .cp-back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #059669;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.2s;
          text-decoration: none;
          font-size: 0.9rem;
          margin-top: 16px;
        }

        .cp-back-link:hover {
          color: #047857;
        }

        .cp-footer {
          text-align: center;
          padding-top: 16px;
          border-top: 1px solid #d1fae5;
          margin-top: 20px;
        }

        .cp-footer p {
          font-size: 0.75rem;
          color: #a5b8a5;
          margin: 0;
        }

        @media (max-width: 640px) {
          .cp-body { padding: 20px; }
          .cp-header { padding: 20px; }
          .cp-header h1 { font-size: 1.2rem; }
          .cp-actions { flex-direction: column; }
          .cp-container { padding: 0 12px; }
        }

        @media (max-width: 480px) {
          .cp-root { padding: 16px 12px; }
          .cp-body { padding: 16px; }
          .cp-card { border-radius: 12px; }
          .cp-btn { padding: 12px 20px; font-size: 0.85rem; }
        }
      `}</style>

      <div className="cp-root">
        <div className="cp-container">
          <div className="cp-card">

            {/* ── Header ── */}
            <div className="cp-header">
              <div className="cp-header-icon">
                <LockIcon size={22} />
              </div>
              <div>
                <h1>Change Password</h1>
                <p>Update your password</p>
              </div>
            </div>

            {/* ── Body ── */}
            <div className="cp-body">

              {/* ── Alerts ── */}
              {message.text && (
                <div className={`cp-alert ${message.type === 'success' ? 'cp-alert-success' : 'cp-alert-error'}`}>
                  {message.type === 'success' ? <CheckIcon size={18} /> : <AlertTriangleIcon size={20} />}
                  {message.text}
                </div>
              )}

              {/* ── Form ── */}
              <form onSubmit={handleSubmit}>
                {/* Current Password */}
                <div className="cp-form-group">
                  <label className="cp-form-label">
                    Current Password <span className="required">*</span>
                  </label>
                  <div className="cp-input-wrapper">
                    <input
                      type={showOldPassword ? "text" : "password"}
                      name="oldPassword"
                      value={formData.oldPassword}
                      onChange={handleChange}
                      required
                      className="cp-form-input"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      className="cp-password-toggle"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                    >
                      {showOldPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="cp-form-group">
                  <label className="cp-form-label">
                    New Password <span className="required">*</span>
                  </label>
                  <div className="cp-input-wrapper">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      required
                      className="cp-form-input"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      className="cp-password-toggle"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                    </button>
                  </div>
                  <p className="cp-hint">Must be at least 6 characters</p>
                </div>

                {/* Confirm New Password */}
                <div className="cp-form-group">
                  <label className="cp-form-label">
                    Confirm New Password <span className="required">*</span>
                  </label>
                  <div className="cp-input-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="cp-form-input"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      className="cp-password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                    </button>
                  </div>
                </div>

                {/* ── Actions ── */}
                <div className="cp-actions">
                  <button
                    type="submit"
                    disabled={loading}
                    className="cp-btn cp-btn-primary"
                  >
                    {loading ? (
                      <>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: '#fff',
                          borderRadius: '50%',
                          animation: 'cp-spin 0.8s linear infinite'
                        }} />
                        Changing...
                      </>
                    ) : (
                      <>
                        <LockIcon size={18} /> Change Password
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="cp-btn cp-btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>

              {/* ── Back Link ── */}
              <div className="cp-back-link" onClick={handleCancel}>
                <ArrowLeftIcon size={16} /> Back to Profile
              </div>

              {/* ── Footer ── */}
              <div className="cp-footer">
                <p>For security reasons, please choose a strong password that you don't use elsewhere.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;