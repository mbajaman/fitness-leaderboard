import React, { useState } from 'react';
import { supabase } from '../db/supabaseClient';
import bcrypt from 'bcryptjs';
import './Settings.css';

const Settings = ({ isOpen, onClose }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  const handleAuthenticate = async (e) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Fetch the account data from the database
      const { data, error } = await supabase
        .from('account')
        .select('*')
        .single();
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        setError('Account not found. Please contact an administrator.');
        return;
      }
      
      let isAuthenticated = false;
      
      if (data.password && data.password.startsWith('$2')) {
        isAuthenticated = bcrypt.compareSync(password, data.password);
        if (isAuthenticated) {
          console.log('Authenticated');
        }
      }
      
      if (isAuthenticated) {
        setAuthenticated(true);
      } else {
        setError('Invalid password. Please try again.');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="settings-modal-overlay">
      <div className="settings-modal">
        <div className="settings-modal-header">
          <h2>Admin Settings</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        {!authenticated ? (
          <form onSubmit={handleAuthenticate} className="auth-form">
            <div className="form-group">
              <label htmlFor="password">Admin Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                disabled={loading}
              />
            </div>
            {error && <p className="error-message">{error}</p>}
            <button 
              type="submit" 
              className="auth-button"
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Authenticate'}
            </button>
          </form>
        ) : (
          <div className="settings-content">
            <h3>Admin Panel</h3>
            <p>You are now authenticated as an admin.</p>
            <div className="admin-actions">
              <button className="admin-button">Update Scores</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings; 