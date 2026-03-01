import React from 'react';
import './Stars.css';
import blueStarIcon from '../assets/blue-star.svg';
import redStarIcon from '../assets/red-star.svg';
import yellowStarIcon from '../assets/yellow-star.svg';

// starCounts: [yellow, blue, red] — per-type totals. If missing, fallback shows score in each (legacy).
const Stars = ({ score, starCounts }) => {
  const counts =
    Array.isArray(starCounts) && starCounts.length >= 3
      ? starCounts
      : [score ?? 0, score ?? 0, score ?? 0];
  const icons = [yellowStarIcon, blueStarIcon, redStarIcon];
  const labels = ['Activity stars', 'Daily challenge stars', 'Bonus challenge stars'];
  return (
    <div className="stars-container" role="list" aria-label="Star counts by type">
      {icons.map((icon, i) => (
        <div
          key={i}
          className="star-pair"
          role="listitem"
          aria-label={`${labels[i]}: ${counts[i]}`}
        >
          <img src={icon} alt="" className="star-icon" aria-hidden="true" />
          <span className="star-count">{counts[i]}</span>
        </div>
      ))}
    </div>
  );
};

export default Stars;
