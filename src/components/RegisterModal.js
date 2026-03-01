import React, { useState } from 'react';
import './AuthModals.css';

const RegisterModal = ({ isOpen, onClose, onSuccess, switchToLogin }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) {
      setError('Please enter a username');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onSuccess(trimmed);
      onClose();
    } catch (err) {
      if (err.code === '23505') {
        setError('Username is already taken. Please choose another or login.');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <div className="auth-modal-header">
          <h2>Register</h2>
          <button type="button" className="auth-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="register-username">Username</label>
            <input
              id="register-username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Choose a username"
              disabled={loading}
              autoComplete="username"
            />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
          <p className="auth-switch">
            Already have an account?{' '}
            <button type="button" className="auth-link" onClick={switchToLogin}>
              Login
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterModal;
