import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../db/supabaseClient';
import { useAuth } from '../context/AuthContext';
import yellowStarIcon from '../assets/yellow-star.svg';
import blueStarIcon from '../assets/blue-star.svg';
import redStarIcon from '../assets/red-star.svg';
import Calendar from './Calendar';
import './AddStarsModal.css';

const STAR_ICONS = {
  yellow: yellowStarIcon,
  blue: blueStarIcon,
  red: redStarIcon,
};

const STAR_LABELS = {
  yellow: 'Activity',
  blue: 'Daily challenge',
  red: 'Bonus challenge',
};

const STAR_TOOLTIP =
  'Activity (yellow): 1 star per 20 min continuous activity, max 6 per day. ' +
  'Daily challenge (blue): 50 push-ups or squats (or combo), weekdays 9am–5pm, 1 per day. ' +
  'Bonus challenge (red): Time-bound challenges set by commissioners, 1 per day.';

function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

const MARCH_START = () => `${new Date().getFullYear()}-03-01`;
const MARCH_END = () => `${new Date().getFullYear()}-03-31`;

function clampToMarch(dateStr) {
  const start = MARCH_START();
  const end = MARCH_END();
  if (dateStr < start) return start;
  if (dateStr > end) return end;
  return dateStr;
}

const AddStarsModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => clampToMarch(todayStr()));
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

  const fetchEntries = useCallback(
    async starTypesList => {
      if (!user || !isOpen) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('daily_star_entries')
        .select('star_type_id, checked, quantity')
        .eq('user_id', user.id)
        .eq('date', selectedDate);
      setLoading(false);
      if (error) {
        setEntries({});
        return;
      }
      const byStar = {};
      (data || []).forEach(row => {
        const st = (starTypesList || []).find(s => s.id === row.star_type_id);
        if (!st) return;
        if (st.name === 'yellow') {
          const q = Number(row.quantity);
          byStar[row.star_type_id] = Math.min(6, Math.max(0, isNaN(q) ? 0 : q));
        } else {
          const q = Number(row.quantity);
          byStar[row.star_type_id] = isNaN(q) ? row.checked : q > 0;
        }
      });
      setEntries(byStar);
    },
    [user, selectedDate, isOpen]
  );

  useEffect(() => {
    if (isOpen) fetchStarTypes();
  }, [isOpen, fetchStarTypes]);

  useEffect(() => {
    if (isOpen && user && starTypes.length > 0) fetchEntries(starTypes);
  }, [isOpen, user, selectedDate, starTypes, fetchEntries]);

  useEffect(() => {
    if (isOpen) setSelectedDate(prev => clampToMarch(prev));
  }, [isOpen]);

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
    const quantity = checked ? 1 : 0;
    const { error } = await supabase.from('daily_star_entries').upsert(
      {
        user_id: user.id,
        date: selectedDate,
        star_type_id: starTypeId,
        checked: quantity > 0,
        quantity,
      },
      { onConflict: 'user_id,date,star_type_id' }
    );
    setSaving(false);
    if (!error) setEntries(prev => ({ ...prev, [starTypeId]: checked }));
  };

  const handleYellowQuantity = async (starTypeId, count) => {
    if (!user) return;
    const quantity = Math.min(6, Math.max(0, count));
    setSaving(true);
    const { error } = await supabase.from('daily_star_entries').upsert(
      {
        user_id: user.id,
        date: selectedDate,
        star_type_id: starTypeId,
        checked: quantity > 0,
        quantity,
      },
      { onConflict: 'user_id,date,star_type_id' }
    );
    setSaving(false);
    if (!error) setEntries(prev => ({ ...prev, [starTypeId]: quantity }));
  };

  if (!isOpen) return null;

  return (
    <div className="add-stars-overlay" onClick={onClose}>
      <div className="add-stars-modal" onClick={e => e.stopPropagation()}>
        <div className="add-stars-header">
          <h2>
            Log stars
            <span
              className="add-stars-tooltip-trigger"
              title={STAR_TOOLTIP}
              aria-label={STAR_TOOLTIP}
            >
              ?
            </span>
          </h2>
          <button type="button" className="add-stars-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="add-stars-body">
          <div className="add-stars-calendar-wrap">
            <Calendar
              value={selectedDate}
              onChange={setSelectedDate}
              minDate={MARCH_START()}
              maxDate={MARCH_END()}
            />
          </div>
          {loading ? (
            <p className="add-stars-loading">Loading...</p>
          ) : (
            <div className="add-stars-checkboxes">
              {starTypes
                .filter(st => ['yellow', 'blue', 'red'].includes(st.name))
                .map(st => {
                  const available = isAvailable(st);
                  const isYellow = st.name === 'yellow';
                  const label = STAR_LABELS[st.name] || st.name;

                  if (isYellow) {
                    const count = Math.min(6, Math.max(0, Number(entries[st.id]) || 0));
                    return (
                      <div
                        key={st.id}
                        className={`add-stars-row add-stars-row-yellow ${!available ? 'add-stars-row-disabled' : ''}`}
                      >
                        <img
                          src={STAR_ICONS[st.name] || yellowStarIcon}
                          alt=""
                          className="add-stars-row-icon"
                        />
                        <span className="add-stars-row-name">{label}</span>
                        <div
                          className="add-stars-yellow-group"
                          aria-label={`${label}, up to 6 stars`}
                        >
                          {[1, 2, 3, 4, 5, 6].map(n => (
                            <label key={n} className="add-stars-yellow-check">
                              <input
                                type="checkbox"
                                checked={count >= n}
                                disabled={!available || saving}
                                onChange={() => {
                                  const newCount = count >= n ? (count > n ? n : n - 1) : n;
                                  handleYellowQuantity(st.id, newCount);
                                }}
                              />
                              <span className="add-stars-yellow-num">{n}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  }

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
                      <span className="add-stars-row-name">{label}</span>
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
