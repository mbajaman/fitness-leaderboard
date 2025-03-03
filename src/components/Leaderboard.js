import React, { useEffect, useState } from 'react';
import { supabase } from '../db/supabaseClient';
import './Leaderboard.css';
import Stars from './Stars';
const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 
  useEffect(() => {
    fetchLeaderboardData();
    updateLastUpdated();
  }, []);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      
      // Query the leaderboard data from Supabase
      const { data, error } = await supabase
        .from('leaderboard')
        .select('id, name, scores')
        .order('scores', { ascending: false });
      
      if (error) {
        throw error;
      }

      setLeaderboardData(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
      setError('Failed to fetch leaderboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const updateLastUpdated = async () => {
    const lastUpdated = await supabase
      .from('leaderboard')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1);

    setLastUpdated(lastUpdated);
  };
  
  // Format date and time in a nice, readable format
  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return 'N/A';
    
    try {
      const date = new Date(dateTimeStr);
      
      // Check if date is valid
      if (isNaN(date.getTime())) return 'Invalid date';
      
      // Format options
      const options = { 
        weekday: 'long',
        year: 'numeric',
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit'
      };
      
      return date.toLocaleString('en-US', options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date format error';
    }
  };

  // Function to get medal class based on rank
  const getMedalClass = (index) => {
    if (index === 0) return "gold-medal";
    if (index === 1) return "silver-medal";
    if (index === 2) return "bronze-medal";
    return "";
  };

  // Function to get medal emoji based on rank
  const getMedalEmoji = (index) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return index + 1;
  };

  return (
    <div className="leaderboard-container">
      <h2>Leaderboard</h2>
      {lastUpdated && lastUpdated.data && lastUpdated.data[0] && (
        <div className="last-updated-container">
          <span className="last-updated-icon">🕒</span>
          <span className="last-updated-text">
            Last updated: <span className="last-updated-date">{formatDateTime(lastUpdated.data[0].updated_at)}</span>
          </span>
        </div>
      )}

      {loading ? (
        <p className="loading">Loading leaderboard data...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : leaderboardData.length === 0 ? (
        <p>No leaderboard data available.</p>
      ) : (
        <div className="leaderboard">
          <div className="leaderboard-header">
            <div className="rank">Rank</div>
            <div className="name">Name</div>
            <div className="score">Score</div>
          </div>
          
          {leaderboardData.map((entry, index) => (
            <div key={entry.id} className={`leaderboard-row ${getMedalClass(index)}`}>
              <div className="rank">{getMedalEmoji(index)}</div>
              <div className="name">
                {entry.name}
                <Stars count={entry.scores} name={entry.name}/>
              </div>

              <div className="score">{entry.scores}</div>
            </div>
          ))}
        </div>
      )}
      
      <button className="refresh-button" onClick={() => {
        fetchLeaderboardData();
        updateLastUpdated();
      }} disabled={loading}>
        {loading ? 'Refreshing...' : 'Refresh Leaderboard'}
      </button>
    </div>
  );
};

export default Leaderboard; 