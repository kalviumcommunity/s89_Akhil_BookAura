import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import CronofyService from '../../services/CronofyService';
import './CalendarPage.css';

const CalendarCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(location.search);
      const code = urlParams.get('code');
      
      if (!code) {
        setStatus('error');
        setError('No authorization code found in the URL');
        return;
      }
      
      try {
        await CronofyService.getTokens(code);
        setStatus('success');
        
        // Redirect to calendar page after a short delay
        setTimeout(() => {
          navigate('/calendar', { replace: true });
        }, 2000);
      } catch (err) {
        console.error('Error handling OAuth callback:', err);
        setStatus('error');
        setError('Failed to authenticate with Cronofy. Please try again.');
      }
    };
    
    handleCallback();
  }, [location, navigate]);

  return (
    <div className="calendar-callback">
      <div className="callback-container">
        <h1>Connecting to Cronofy</h1>
        
        {status === 'processing' && (
          <div className="callback-status processing">
            <div className="loading-spinner"></div>
            <p>Connecting to your calendar...</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="callback-status success">
            <div className="success-icon">✓</div>
            <p>Successfully connected to your calendar!</p>
            <p className="redirect-message">Redirecting to calendar page...</p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="callback-status error">
            <div className="error-icon">✗</div>
            <p className="error-message">{error}</p>
            <button 
              className="retry-button"
              onClick={() => navigate('/calendar')}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarCallback;
