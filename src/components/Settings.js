import React, { useState, useEffect } from 'react';
import { supabase } from '../db/supabaseClient';
import bcrypt from 'bcryptjs';
import './Settings.css';

const Settings = ({ isOpen, onClose }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [nameList, setNameList] = useState([]);
  const [updateName, setUpdateName] = useState('');
  const [updateScore, setUpdateScore] = useState('');
  const [updateMessage, setUpdateMessage] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    fetchNameList();
  }, []);

  const handleAuthenticate = async e => {
    e.preventDefault();

    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch the account data from the database
      const { data, error } = await supabase.from('account').select('*').single();

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

  const fetchNameList = async () => {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('name')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching name list:', error);
      setError('Failed to fetch name list. Please try again later.');
    } else {
      setNameList(data.map(item => item.name));
    }
  };

  const handleUpdateScoreClick = () => {
    setShowUpdateForm(true);
    setUpdateMessage(null);
    setUpdateName('');
    setUpdateScore('');
  };

  // TODO: Enable RLS and ensure triggers run when inserting using anon key
  const handleUpdateScore = async e => {
    e.preventDefault();

    if (!updateName.trim() || !updateScore.trim()) {
      setUpdateMessage({ type: 'error', text: 'Please enter both name and score' });
      return;
    }

    // Validate score is a number
    const scoreNum = parseFloat(updateScore);
    if (isNaN(scoreNum)) {
      setUpdateMessage({ type: 'error', text: 'Score must be a number' });
      return;
    }

    try {
      setUpdateLoading(true);
      setUpdateMessage(null);

      // First check if the user exists
      const { data: userData, error: userError } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('name', updateName)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        // PGRST116 is "no rows returned"
        throw userError;
      }

      if (!userData) {
        setUpdateMessage({ type: 'error', text: 'User not found. Please enter a valid name.' });
        return;
      }

      //   const date = Date.now()
      //   const dateString = new Date(date).toISOString()
      //   console.log(dateString)

      // Update the user's score
      const { error: updateError } = await supabase
        .from('leaderboard')
        .update({ scores: scoreNum })
        .eq('name', updateName);

      if (updateError) {
        throw updateError;
      }

      setUpdateMessage({ type: 'success', text: `Score updated successfully for ${updateName}` });
      setUpdateName('');
      setUpdateScore('');
    } catch (error) {
      console.error('Update error:', error);
      setUpdateMessage({ type: 'error', text: 'Failed to update score. Please try again.' });
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleCancelUpdate = () => {
    setShowUpdateForm(false);
    setUpdateMessage(null);
  };

  if (!isOpen) return null;
  return (
    <div className="settings-modal-overlay">
      <div className="settings-modal">
        <div className="settings-modal-header">
          <h2>Admin Settings</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        {!authenticated ? (
          <form onSubmit={handleAuthenticate} className="auth-form">
            <div className="form-group">
              <label htmlFor="password">Admin Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter admin password"
                disabled={loading}
              />
            </div>
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Authenticating...' : 'Authenticate'}
            </button>
          </form>
        ) : (
          <div className="settings-content">
            <h3>Admin Panel</h3>
            <p>You are now authenticated as an admin.</p>
            <div className="update-score-form">
              <h4>Update User Score</h4>
              <form onSubmit={handleUpdateScore}>
                <div className="form-group">
                  <label htmlFor="update-name">
                    User Name
                    <span className="tooltip-icon" title="Contact Mohammed to add a new user">
                      i
                    </span>
                  </label>
                  <select
                    id="update-name"
                    value={updateName}
                    onChange={e => setUpdateName(e.target.value)}
                    placeholder="Select a user"
                  >
                    <option value="" disabled>
                      Select a user
                    </option>
                    {nameList.map(name => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="update-score">New Score</label>
                  <input
                    type="text"
                    id="update-score"
                    value={updateScore}
                    onChange={e => setUpdateScore(e.target.value)}
                    placeholder="Enter new score"
                    disabled={updateLoading}
                  />
                </div>

                {updateMessage && (
                  <p className={`message ${updateMessage.type}`}>{updateMessage.text}</p>
                )}

                <div className="form-buttons">
                  <button type="submit" className="update-button" disabled={updateLoading}>
                    {updateLoading ? 'Updating...' : 'Update'}
                  </button>
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={onClose}
                    disabled={updateLoading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
