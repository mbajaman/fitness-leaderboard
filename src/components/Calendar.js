import React, { useState, useMemo, useEffect } from 'react';
import './Calendar.css';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDateStr(year, month, day) {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function todayDateStr() {
  return new Date().toISOString().slice(0, 10);
}

function getDaysGrid(year, month) {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  const firstDayOfWeek = first.getDay();
  const daysInMonth = last.getDate();
  const leadingEmpty = firstDayOfWeek;
  const totalCells = leadingEmpty + daysInMonth;
  const rows = Math.ceil(totalCells / 7);
  const grid = [];
  let day = 1;
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < 7; c++) {
      const i = r * 7 + c;
      if (i < leadingEmpty || day > daysInMonth) {
        row.push({ empty: true });
      } else {
        row.push({ empty: false, day, dateStr: toDateStr(year, month, day) });
        day++;
      }
    }
    grid.push(row);
  }
  return grid;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const Calendar = ({ value, onChange, minDate, maxDate }) => {
  const valueDate = value ? value.slice(0, 10) : todayDateStr();
  const [viewYear, setViewYear] = useState(() => parseInt(valueDate.slice(0, 4), 10));
  const [viewMonth, setViewMonth] = useState(() => parseInt(valueDate.slice(5, 7), 10));

  useEffect(() => {
    if (valueDate) {
      setViewYear(parseInt(valueDate.slice(0, 4), 10));
      setViewMonth(parseInt(valueDate.slice(5, 7), 10));
    }
  }, [valueDate]);

  const today = todayDateStr();

  const grid = useMemo(() => getDaysGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const goPrev = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const goNext = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const isDisabled = (dateStr) => {
    if (!minDate && !maxDate) return false;
    if (minDate && dateStr < minDate) return true;
    if (maxDate && dateStr > maxDate) return true;
    return false;
  };

  const handleDayClick = (dateStr) => {
    if (isDisabled(dateStr)) return;
    onChange(dateStr);
  };

  const monthLabel = `${MONTH_NAMES[viewMonth - 1]} ${viewYear}`;

  return (
    <div className="calendar" role="application" aria-label="Calendar">
      <div className="calendar-header">
        <button
          type="button"
          className="calendar-nav"
          onClick={goPrev}
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="calendar-month-label">{monthLabel}</span>
        <button
          type="button"
          className="calendar-nav"
          onClick={goNext}
          aria-label="Next month"
        >
          ›
        </button>
      </div>
      <div className="calendar-weekdays">
        {DAY_LABELS.map((label, i) => (
          <span key={i} className="calendar-weekday">
            {label}
          </span>
        ))}
      </div>
      <div className="calendar-grid">
        {grid.map((row, ri) =>
          row.map((cell, ci) => {
            if (cell.empty) {
              return <div key={`${ri}-${ci}`} className="calendar-day calendar-day-empty" />;
            }
            const { day, dateStr } = cell;
            const selected = dateStr === valueDate;
            const isToday = dateStr === today;
            const disabled = isDisabled(dateStr);
            return (
              <button
                key={`${ri}-${ci}`}
                type="button"
                className={`calendar-day ${selected ? 'calendar-day-selected' : ''} ${isToday ? 'calendar-day-today' : ''} ${disabled ? 'calendar-day-disabled' : ''}`}
                onClick={() => handleDayClick(dateStr)}
                disabled={disabled}
                aria-label={`${day} ${monthLabel}${selected ? ', selected' : ''}${isToday ? ', today' : ''}`}
                aria-pressed={selected}
              >
                {day}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Calendar;
