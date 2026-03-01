import React, { useState } from 'react';
import './AuthModals.css';

const TAB_SOLO = 'solo';
const TAB_TAG_TEAM = 'tag_team';

const RegisterModal = ({ isOpen, onClose, onSuccess, switchToLogin }) => {
  const [username, setUsername] = useState('');
  const [tab, setTab] = useState(TAB_SOLO);
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
      await onSuccess(trimmed, tab === TAB_TAG_TEAM);
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
        <div className="auth-tabs" role="tablist" aria-label="Registration type">
          <button
            type="button"
            role="tab"
            aria-selected={tab === TAB_SOLO}
            aria-controls="register-form-panel"
            id="register-tab-solo"
            className={`auth-tab ${tab === TAB_SOLO ? 'active' : ''}`}
            onClick={() => setTab(TAB_SOLO)}
          >
            Solo
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === TAB_TAG_TEAM}
            aria-controls="register-form-panel"
            id="register-tab-tag-team"
            className={`auth-tab ${tab === TAB_TAG_TEAM ? 'active' : ''}`}
            onClick={() => setTab(TAB_TAG_TEAM)}
          >
            Tag-Team
          </button>
        </div>
        <form
          id="register-form-panel"
          role="tabpanel"
          aria-labelledby={tab === TAB_SOLO ? 'register-tab-solo' : 'register-tab-tag-team'}
          onSubmit={handleSubmit}
          className="auth-form"
        >
          <div className="form-group">
            <label htmlFor="register-username">
              {tab === TAB_TAG_TEAM ? 'Team name or both names' : 'Username'}
            </label>
            <input
              id="register-username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder={
                tab === TAB_TAG_TEAM ? 'e.g. BILL+TED or TEAM AL(L)AN' : 'Choose a username'
              }
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
