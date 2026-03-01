import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../db/supabaseClient';

const STORAGE_KEY = 'fitness_leaderboard_user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id && parsed.username) {
          setUser(parsed);
        }
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored || !user?.id) return;
    supabase
      .from('users')
      .select('id, username, is_tag_team, has_slack_linked')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data && data.has_slack_linked !== user.has_slack_linked) {
          setSession({
            id: data.id,
            username: data.username,
            is_tag_team: data.is_tag_team,
            has_slack_linked: data.has_slack_linked,
          });
        }
      })
      .catch(() => {});
  }, [restored, user?.id]);

  const setSession = userData => {
    setUser(userData);
    if (userData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const register = async (username, isTagTeam = false) => {
    const { data, error } = await supabase
      .from('users')
      .insert({
        username: username.trim(),
        is_tag_team: !!isTagTeam,
      })
      .select('id, username, is_tag_team, has_slack_linked')
      .single();
    if (error) throw error;
    setSession({
      id: data.id,
      username: data.username,
      is_tag_team: data.is_tag_team,
      has_slack_linked: data.has_slack_linked,
    });
    return data;
  };

  const login = async username => {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, is_tag_team, has_slack_linked')
      .eq('username', username.trim())
      .single();
    if (error || !data) return null;
    setSession({
      id: data.id,
      username: data.username,
      is_tag_team: data.is_tag_team,
      has_slack_linked: data.has_slack_linked,
    });
    return data;
  };

  const refreshUser = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('users')
      .select('id, username, is_tag_team, has_slack_linked')
      .eq('id', user.id)
      .single();
    if (!error && data) {
      setSession({
        id: data.id,
        username: data.username,
        is_tag_team: data.is_tag_team,
        has_slack_linked: data.has_slack_linked,
      });
    }
  };

  const logout = () => {
    setSession(null);
  };

  const value = {
    user,
    restored,
    register,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
