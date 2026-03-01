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
      const { data: scoresData, error: scoresError } = await supabase
        .from('user_scores')
        .select('user_id, total_score, updated_at')
        .order('total_score', { ascending: false });

      if (scoresError) throw scoresError;

      if (!scoresData || scoresData.length === 0) {
        setLeaderboardData([]);
        setLoading(false);
        return;
      }

      const userIds = scoresData.map(r => r.user_id);
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, username')
        .in('id', userIds);

      if (usersError) throw usersError;

      const userMap = (usersData || []).reduce((acc, u) => {
        acc[u.id] = u.username;
        return acc;
      }, {});

      const merged = scoresData.map(row => ({
        id: row.user_id,
        name: userMap[row.user_id] || 'Unknown',
        total_score: Number(row.total_score),
        updated_at: row.updated_at,
      }));
      setLeaderboardData(merged);
      const latest = merged.reduce(
        (a, b) => (new Date(a.updated_at) > new Date(b.updated_at) ? a : b),
        merged[0]
      );
      if (latest) setLastUpdated(latest.updated_at);
    } catch (err) {
      console.error('Error fetching leaderboard data:', err);
      setError('Failed to fetch leaderboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const updateLastUpdated = async () => {
    const { data } = await supabase
      .from('user_scores')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1);
    if (data && data[0]) setLastUpdated(data[0].updated_at);
  };

  const formatDateTime = dateTimeStr => {
    if (!dateTimeStr) return 'N/A';
    try {
      const date = new Date(dateTimeStr);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return 'Date format error';
    }
  };

  const getMedalClass = index => {
    if (index === 0) return 'gold-medal';
    if (index === 1) return 'silver-medal';
    if (index === 2) return 'bronze-medal';
    return '';
  };

  const getMedalEmoji = index => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return index + 1;
  };

  return (
    <div className="leaderboard-container">
      <h2>Leaderboard</h2>
      {lastUpdated && (
        <div className="last-updated-container">
          <span className="last-updated-icon">🕒</span>
          <span className="last-updated-text">
            Last updated: <span className="last-updated-date">{formatDateTime(lastUpdated)}</span>
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
            <div className="stars-header">Stars</div>
            <div className="score">Score</div>
          </div>

          {leaderboardData.map((entry, index) => (
            <div key={entry.id} className={`leaderboard-row ${getMedalClass(index)}`}>
              <div className="rank">{getMedalEmoji(index)}</div>
              <div className="name">
                {entry.name}
                <span className="stars-inline">
                  <Stars score={entry.total_score} name={entry.name} />
                </span>
              </div>
              <div className="stars-cell">
                <Stars score={entry.total_score} name={entry.name} />
              </div>
              <div className="score">{entry.total_score}</div>
            </div>
          ))}
        </div>
      )}

      <button
        className="refresh-button"
        onClick={() => {
          fetchLeaderboardData();
          updateLastUpdated();
        }}
        disabled={loading}
      >
        {loading ? 'Refreshing...' : 'Refresh Leaderboard'}
      </button>
    </div>
  );
};

export default Leaderboard;
