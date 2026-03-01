import React, { useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import './Calendar.css';

function parseDateStr(str) {
  if (!str || str.length < 10) return undefined;
  const [y, m, d] = str.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toDateStr(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const Calendar = ({ value, onChange, minDate, maxDate }) => {
  const selectedDate = useMemo(() => parseDateStr(value), [value]);
  const defaultMonth = selectedDate || new Date();

  const disabled = useMemo(() => {
    const matchers = [];
    if (minDate) {
      const d = parseDateStr(minDate);
      if (d) matchers.push({ before: d });
    }
    if (maxDate) {
      const d = parseDateStr(maxDate);
      if (d) matchers.push({ after: d });
    }
    return matchers.length ? matchers : undefined;
  }, [minDate, maxDate]);

  const handleSelect = date => {
    onChange(date ? toDateStr(date) : '');
  };

  return (
    <div className="calendar">
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={handleSelect}
        defaultMonth={defaultMonth}
        disabled={disabled}
        required
        animate
        className="calendar-rdp"
      />
    </div>
  );
};

export default Calendar;
