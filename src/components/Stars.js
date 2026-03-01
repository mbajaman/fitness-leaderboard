import React from 'react';
import './Stars.css';
import blueStarIcon from '../assets/blue-star.svg';
import redStarIcon from '../assets/red-star.svg';
import yellowStarIcon from '../assets/yellow-star.svg';
import greenStarIcon from '../assets/green-star.svg';

// Supports either single total (score) or per-star counts [yellow, blue, red, green]
const Stars = ({ score, starCounts, name }) => {
  const counts =
    Array.isArray(starCounts) && starCounts.length >= 4
      ? starCounts
      : [score ?? 0, score ?? 0, score ?? 0, score ?? 0];
  const icons = [yellowStarIcon, blueStarIcon, redStarIcon, greenStarIcon];
  const labels = ['Yellow star', 'Blue star', 'Red star', 'Green star'];
  return (
    <div className="stars-container">
      {icons.map((icon, i) => (
        <React.Fragment key={i}>
          <img src={icon} alt={labels[i]} className="star-icon" />
          <span className="star-count">{counts[i]}</span>
        </React.Fragment>
      ))}
    </div>
  );
};

export default Stars;
