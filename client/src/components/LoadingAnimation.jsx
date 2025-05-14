import React from 'react';
import Loding from '../images/loading.gif';
import './LoadingAnimation.css';

const LoadingAnimation = ({ text = "Loading..." }) => {
  return (
    <div className="loading-container">
      <img src={Loding} alt="Loading..." className="loading-gif" />
      <div className="loading-text">{text}</div>
    </div>
  );
};

export default LoadingAnimation;
