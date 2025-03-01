import React, { useEffect, useState } from 'react';
import { supabase } from '../db/supabaseClient';
import './Leaderboard.css';

const Leaderboard = () => {
  // Sample data that you can use before connecting to Supabase
  const sampleData = [
    { id: 1, name: "John Doe", score: 1250 },
    { id: 2, name: "Jane Smith", score: 1100 },
    { id: 3, name: "Alex Johnson", score: 950 },
    { id: 4, name: "Sarah Williams", score: 820 },
    { id: 5, name: "Michael Brown", score: 780 },
    { id: 6, name: "Emily Davis", score: 720 },
    { id: 7, name: "Robert Wilson", score: 650 },
    { id: 8, name: "Jessica Taylor", score: 600 },
    { id: 9, name: "David Martinez", score: 550 },
    { id: 10, name: "Jennifer Anderson", score: 500 }
  ];

  const [leaderboardData, setLeaderboardData] = useState(sampleData); // Use sample data initially
  const [loading, setLoading] = useState(false); // Set to false since we're using sample data
  const [error, setError] = useState(null);

  // Uncomment this useEffect when you're ready to fetch from Supabase
  
  useEffect(() => {
    fetchLeaderboardData();
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
              <div className="name">{entry.name}</div>
              <div className="score">{entry.scores}</div>
            </div>
          ))}
        </div>
      )}
      
      {/* Uncomment this when you're ready to fetch from Supabase */}
      {/* <button className="refresh-button" onClick={fetchLeaderboardData} disabled={loading}> */}
      <button className="refresh-button" disabled={loading}>
        {loading ? 'Refreshing...' : 'Refresh Leaderboard'}
      </button>
    </div>
  );
};

export default Leaderboard; 