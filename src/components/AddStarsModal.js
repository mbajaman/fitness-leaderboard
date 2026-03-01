import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../db/supabaseClient';
import { useAuth } from '../context/AuthContext';
import yellowStarIcon from '../assets/yellow-star.svg';
import blueStarIcon from '../assets/blue-star.svg';
import redStarIcon from '../assets/red-star.svg';
import greenStarIcon from '../assets/green-star.svg';
import './AddStarsModal.css';

const STAR_ICONS = {
  yellow: yellowStarIcon,
  blue: blueStarIcon,
  red: redStarIcon,
  green: greenStarIcon,
};

function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

const AddStarsModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [starTypes, setStarTypes] = useState([]);
  const [entries, setEntries] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchStarTypes = useCallback(async () => {
    const { data, error } = await supabase
      .from('star_types')
      .select('id, name, display_order, point_value, available_on_dow')
      .order('display_order', { ascending: true });
    if (!error) setStarTypes(data || []);
  }, []);

  const fetchEntries = useCallback(async () => {
    if (!user || !isOpen) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('daily_star_entries')
      .select('star_type_id, checked')
      .eq('user_id', user.id)
      .eq('date', selectedDate);
    setLoading(false);
    if (error) {
      setEntries({});
      return;
    }
    const byStar = (data || []).reduce((acc, row) => {
      acc[row.star_type_id] = row.checked;
      return acc;
    }, {});
    setEntries(byStar);
  }, [user, selectedDate, isOpen]);

  useEffect(() => {
    if (isOpen) fetchStarTypes();
  }, [isOpen, fetchStarTypes]);

  useEffect(() => {
    if (isOpen && user) fetchEntries();
  }, [isOpen, user, selectedDate, fetchEntries]);

  const dayOfWeek = dateStr => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.getDay();
  };

  const isAvailable = starType => {
    const dow = starType.available_on_dow;
    if (!dow || !Array.isArray(dow) || dow.length === 0) return true;
    return dow.includes(dayOfWeek(selectedDate));
  };

  const handleToggle = async (starTypeId, checked) => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('daily_star_entries').upsert(
      {
        user_id: user.id,
        date: selectedDate,
        star_type_id: starTypeId,
        checked,
      },
      { onConflict: 'user_id,date,star_type_id' }
    );
    setSaving(false);
    if (!error) setEntries(prev => ({ ...prev, [starTypeId]: checked }));
  };

  if (!isOpen) return null;

  return (
    <div className="add-stars-overlay" onClick={onClose}>
      <div className="add-stars-modal" onClick={e => e.stopPropagation()}>
        <div className="add-stars-header">
          <h2>Log stars</h2>
          <button type="button" className="add-stars-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="add-stars-body">
          <div className="add-stars-date">
            <label htmlFor="add-stars-date-picker">Date</label>
            <input
              id="add-stars-date-picker"
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            />
          </div>
          {loading ? (
            <p className="add-stars-loading">Loading...</p>
          ) : (
            <div className="add-stars-checkboxes">
              {starTypes.map(st => {
                const available = isAvailable(st);
                const checked = !!entries[st.id];
                return (
                  <label
                    key={st.id}
                    className={`add-stars-row ${!available ? 'add-stars-row-disabled' : ''}`}
                  >
                    <img
                      src={STAR_ICONS[st.name] || yellowStarIcon}
                      alt=""
                      className="add-stars-row-icon"
                    />
                    <span className="add-stars-row-name">{st.name}</span>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!available || saving}
                      onChange={e => handleToggle(st.id, e.target.checked)}
                    />
                    {!available && (
                      <span className="add-stars-unavailable">Not available this day</span>
                    )}
                  </label>
                );
              })}
            </div>
          )}
          {starTypes.length === 0 && !loading && (
            <p className="add-stars-empty">No star types configured. Run the Supabase schema.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddStarsModal;
