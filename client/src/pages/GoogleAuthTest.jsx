import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const GoogleAuthTest = () => {
  const [status, setStatus] = useState('Checking authentication...');
  const [details, setDetails] = useState({});
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Parse URL parameters
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const success = params.get('success');
    const encodedUserData = params.get('userData');

    setStatus(`URL Parameters: token=${token ? 'present' : 'missing'}, success=${success}, userData=${encodedUserData ? 'present' : 'missing'}`);

    // Check cookies
    const cookies = document.cookie.split(';').map(c => c.trim());
    setDetails(prev => ({ ...prev, cookies }));

    // Check localStorage
    const authToken = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    setDetails(prev => ({
      ...prev,
      localStorage: {
        authToken: authToken ? 'present' : 'missing',
        userData: userData ? JSON.parse(userData) : 'missing'
      }
    }));

    // If we have a token from Google OAuth callback, store it
    if (token && success === 'true') {
      try {
        console.log('Google authentication successful, storing token');

        // Store token in localStorage for the API interceptor to use
        localStorage.setItem('authToken', token);

        // Set isLoggedIn cookie for client-side detection
        document.cookie = `isLoggedIn=true; path=/; max-age=${7 * 24 * 60 * 60}`;

        // If we have user data, store it
        if (encodedUserData) {
          try {
            const userData = JSON.parse(decodeURIComponent(encodedUserData));
            console.log('Received user data from Google auth:', userData);

            // Store user data in localStorage for persistence
            localStorage.setItem('userData', JSON.stringify(userData));

            setStatus('Authentication successful! User data stored.');
            setDetails(prev => ({ ...prev, userData }));
          } catch (error) {
            console.error('Error parsing user data:', error);
            setStatus(`Error parsing user data: ${error.message}`);
          }
        } else {
          setStatus('No user data received from Google auth');
        }

        // Clean up URL parameters
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      } catch (error) {
        setStatus(`Error processing authentication: ${error.message}`);
      }
    }
  }, [location]);

  const handleGoogleSignIn = () => {
    // Clear any existing auth data before starting Google auth flow
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');

    // Clear cookies
    document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'isLoggedIn=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

    // Try direct Google authentication without server
    const handleDirectAuth = () => {
      // Store mock data for testing
      const mockToken = 'mock_token_' + Date.now();
      localStorage.setItem('authToken', mockToken);
      localStorage.setItem('userData', JSON.stringify({
        id: 'mock_id',
        username: 'Test User',
        email: 'test@example.com'
      }));
      document.cookie = `isLoggedIn=true; path=/; max-age=${7 * 24 * 60 * 60}`;

      setStatus('Direct authentication successful (mock data)');
      setDetails(prev => ({
        ...prev,
        mockAuth: true,
        localStorage: {
          authToken: 'mock_token',
          userData: {
            id: 'mock_id',
            username: 'Test User',
            email: 'test@example.com'
          }
        }
      }));
    };

    // Add timestamp to prevent caching issues
    const timestamp = Date.now();

    // Try the server that's working
    const serverUrl = 'https://s89-akhil-bookaura-3.onrender.com';
    const googleAuthUrl = `${serverUrl}/router/auth/google?t=${timestamp}&test=true`;

    // Show options to the user
    if (confirm('The server might be experiencing issues. Choose an option:\n\nOK: Try Google authentication (might fail)\nCancel: Use direct authentication (mock data)')) {
      // Redirect to Google auth endpoint
      window.location.href = googleAuthUrl;
    } else {
      // Use direct authentication
      handleDirectAuth();
    }
  };

  return (
    <div>
      <Navbar />
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h1>Google Authentication Test</h1>

        <div style={{ marginBottom: '20px' }}>
          <h2>Status</h2>
          <p>{status}</p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h2>Authentication Details</h2>
          <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px', overflow: 'auto' }}>
            {JSON.stringify(details, null, 2)}
          </pre>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h2>Test Google Authentication</h2>
          <button
            onClick={handleGoogleSignIn}
            style={{
              padding: '10px 20px',
              background: '#4285F4',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Sign in with Google (Test)
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h2>Navigation</h2>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '10px 20px',
              background: '#333',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Go to Home
          </button>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '10px 20px',
              background: '#333',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default GoogleAuthTest;
