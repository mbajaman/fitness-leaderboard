import React from 'react';
import './Stars.css';
import blueStarIcon from '../assets/blue-star.svg';
import redStarIcon from '../assets/red-star.svg';
import yellowStarIcon from '../assets/yellow-star.svg';
import greenStarIcon from '../assets/gree-star.svg';

const Stars = ({ count = 42, name }) => {
  return (
    <div className="stars-container">
      <img src={yellowStarIcon} alt="Yellow star" className="star-icon" />
      <span className="star-count">{count}</span>
      <img src={blueStarIcon} alt="Blue star" className="star-icon" />
      <span className="star-count">{count}</span>
      <img src={redStarIcon} alt="Red star" className="star-icon" />
      <span className="star-count">{count}</span>
      <img src={greenStarIcon} alt="Green star" className="star-icon" />
      <span className="star-count">{count}</span>
    </div>
  );
};

export default Stars;
