import React, { useCallback, useEffect, useRef, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { supabase } from '../db/supabaseClient';
import './Leaderboard.css';
import Stars from './Stars';

const LEADERBOARD_SKELETON_ROWS = 6;

function LeaderboardSkeleton() {
  return (
    <div className="leaderboard" aria-hidden="true">
      <div className="leaderboard-header">
        <div className="rank">
          <Skeleton width={28} height={18} />
        </div>
        <div className="name">
          <Skeleton width={60} height={18} />
        </div>
        <div className="stars-header">
          <Skeleton width={50} height={18} />
        </div>
        <div className="score">
          <Skeleton width={36} height={18} />
        </div>
      </div>
      {Array.from({ length: LEADERBOARD_SKELETON_ROWS }, (_, i) => (
        <div key={i} className="leaderboard-row leaderboard-row-skeleton">
          <div className="rank">
            <Skeleton width={28} height={24} />
          </div>
          <div className="name">
            <Skeleton width={100} height={20} />
          </div>
          <div className="stars-cell">
            <Skeleton width={72} height={16} />
          </div>
          <div className="score">
            <Skeleton width={32} height={20} />
          </div>
        </div>
      ))}
    </div>
  );
}

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaderboardData = useCallback(async () => {
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
      const [usersResult, entriesResult] = await Promise.all([
        supabase.from('users').select('id, username').in('id', userIds),
        supabase
          .from('daily_star_entries')
          .select('user_id, quantity, star_types(name)')
          .in('user_id', userIds),
      ]);

      const { data: usersData, error: usersError } = usersResult;
      if (usersError) throw usersError;

      const userMap = (usersData || []).reduce((acc, u) => {
        acc[u.id] = u.username;
        return acc;
      }, {});

      // Aggregate per-user star counts: [yellow, blue, red] (order matches Stars.js icons)
      const starOrder = ['yellow', 'blue', 'red'];
      const starCountsByUser = (entriesResult.data || []).reduce((acc, row) => {
        const uid = row.user_id;
        const name = row.star_types?.name;
        if (!acc[uid]) acc[uid] = { yellow: 0, blue: 0, red: 0 };
        if (starOrder.includes(name))
          acc[uid][name] = (acc[uid][name] || 0) + Number(row.quantity || 0);
        return acc;
      }, {});

      const merged = scoresData.map(row => {
        const uid = row.user_id;
        const counts = starCountsByUser[uid];
        return {
          id: uid,
          name: userMap[uid] || 'Unknown',
          total_score: Number(row.total_score),
          updated_at: row.updated_at,
          starCounts: counts ? [counts.yellow || 0, counts.blue || 0, counts.red || 0] : [0, 0, 0],
        };
      });
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
  }, []);

  const updateLastUpdated = useCallback(async () => {
    const { data } = await supabase
      .from('user_scores')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1);
    if (data && data[0]) setLastUpdated(data[0].updated_at);
  }, []);

  useEffect(() => {
    fetchLeaderboardData();
    updateLastUpdated();
  }, [fetchLeaderboardData, updateLastUpdated]);

  const refreshTimerRef = useRef(null);
  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => {
      fetchLeaderboardData();
      updateLastUpdated();
    }, 250);
  }, [fetchLeaderboardData, updateLastUpdated]);

  useEffect(() => {
    // Auto-refresh when the app regains focus (common "background stale" case).
    const onFocus = () => scheduleRefresh();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') scheduleRefresh();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [scheduleRefresh]);

  useEffect(() => {
    // Supabase Realtime works fine from GitHub Pages since it's browser→Supabase.
    // This removes the need for manual "Refresh Leaderboard" in most cases.
    const channel = supabase
      .channel('leaderboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_scores' }, () =>
        scheduleRefresh()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_star_entries' }, () =>
        scheduleRefresh()
      )
      .subscribe();

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [scheduleRefresh]);

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
        <LeaderboardSkeleton />
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
                  <Stars score={entry.total_score} starCounts={entry.starCounts} />
                </span>
              </div>
              <div className="stars-cell">
                <Stars score={entry.total_score} starCounts={entry.starCounts} />
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
