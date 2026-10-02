import React from 'react';

const LoadingSpinner = ({ text = 'Loading...' }) => {
  return (
    <div className="loading-spinner-container">
      <div className="spinner"></div>
      {text && <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
