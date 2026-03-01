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

  const setSession = userData => {
    setUser(userData);
    if (userData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const register = async username => {
    const { data, error } = await supabase
      .from('users')
      .insert({ username: username.trim() })
      .select('id, username')
      .single();
    if (error) throw error;
    setSession({ id: data.id, username: data.username });
    return data;
  };

  const login = async username => {
    const { data, error } = await supabase
      .from('users')
      .select('id, username')
      .eq('username', username.trim())
      .single();
    if (error || !data) return null;
    setSession({ id: data.id, username: data.username });
    return data;
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
