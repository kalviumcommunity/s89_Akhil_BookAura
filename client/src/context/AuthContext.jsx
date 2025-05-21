import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

// Create the context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on component mount
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        console.log('Checking login status...');

        // Check URL parameters for token from Google OAuth
        const params = new URLSearchParams(window.location.search);
        const urlToken = params.get('token');
        const success = params.get('success');

        // If we have a token from Google OAuth callback, store it
        if (urlToken && success === 'true') {
          console.log('Google authentication successful, storing token');
          localStorage.setItem('authToken', urlToken);

          // Also set a non-httpOnly cookie for client-side detection
          document.cookie = `isLoggedIn=true; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=None; ${window.location.protocol === 'https:' ? 'Secure' : ''}`;

          // Clean up URL parameters
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }

        // Check for the non-httpOnly isLoggedIn cookie
        const isLoggedInCookie = document.cookie.split(';').some(cookie =>
          cookie.trim().startsWith('isLoggedIn=true')
        );
        console.log('isLoggedIn cookie present:', isLoggedInCookie);

        // Check if we have a token in localStorage
        const localToken = localStorage.getItem('authToken');
        console.log('Token in localStorage:', localToken ? 'Present' : 'Not present');

        // If either is true, consider the user logged in
        const isAuthenticated = isLoggedInCookie || !!localToken;
        console.log('Authentication status:', isAuthenticated ? 'Logged in' : 'Not logged in');

        setIsLoggedIn(isAuthenticated);

        // If authenticated, try to fetch user data
        if (isAuthenticated) {
          try {
            console.log('Fetching user profile data...');

            // First, check if we have cached user data
            const cachedUserData = localStorage.getItem('userData');
            if (cachedUserData) {
              try {
                const parsedData = JSON.parse(cachedUserData);
                console.log('Using cached user data while fetching fresh data');
                setUser(parsedData);
              } catch (e) {
                console.error('Error parsing cached user data:', e);
              }
            }

            // Set the token in the Authorization header explicitly
            const headers = {};
            if (localToken) {
              headers.Authorization = `Bearer ${localToken}`;
            }

            // Add a timestamp parameter to prevent caching
            const timestamp = new Date().getTime();

            // Set a timeout for the API request
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

            const response = await api.get(`/router/profile?_t=${timestamp}`, {
              headers,
              signal: controller.signal
            });

            clearTimeout(timeoutId); // Clear the timeout if request completes

            if (response.data.success) {
              console.log('User profile data retrieved successfully');
              const userData = response.data.user;

              // Cache the user data in localStorage
              localStorage.setItem('userData', JSON.stringify(userData));

              setUser(userData);
            }
          } catch (profileError) {
            console.error('Error fetching user profile:', profileError);

            // If we get a 401 error, the token might be invalid or expired
            if (profileError.response && profileError.response.status === 401) {
              console.log('Authentication token invalid or expired');

              // Only clear auth state if we're not on the login page
              if (!window.location.pathname.includes('/login')) {
                setIsLoggedIn(false);
                setUser(null);

                // Don't redirect here - let the component handle it
                console.log('Authentication failed, but not redirecting');
              }
            } else {
              // For other errors, try to use cached data
              const cachedUserData = localStorage.getItem('userData');
              if (cachedUserData) {
                try {
                  const parsedData = JSON.parse(cachedUserData);
                  console.log('Using cached user data due to fetch error');
                  setUser(parsedData);
                } catch (e) {
                  console.error('Error parsing cached user data:', e);
                }
              } else {
                // For other errors, we'll just continue without user data
                console.log('Non-authentication error occurred, continuing as logged in');
              }
            }
          }
        }
      } catch (error) {
        console.error('Error in authentication check:', error);
      } finally {
        setLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  // Function to handle login
  const login = (userData, token) => {
    setUser(userData);
    setIsLoggedIn(true);

    // If token is provided, store it in localStorage
    if (token) {
      localStorage.setItem('authToken', token);
      console.log('Token stored in localStorage during login');
    }
  };

  // Function to handle logout
  const logout = async () => {
    try {
      await api.get('/router/logout');

      // Clear auth data
      localStorage.removeItem('authToken');
      setUser(null);
      setIsLoggedIn(false);

      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);

      // Even if the server request fails, clear local auth state
      localStorage.removeItem('authToken');
      setUser(null);
      setIsLoggedIn(false);
    }
  };

  // Value to be provided to consumers
  const value = {
    isLoggedIn,
    user,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
