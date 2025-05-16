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
        // Check URL parameters for token from Google OAuth
        const params = new URLSearchParams(window.location.search);
        const urlToken = params.get('token');
        const success = params.get('success');

        // If we have a token from Google OAuth callback, store it
        if (urlToken && success === 'true') {
          console.log('Google authentication successful, storing token');
          localStorage.setItem('authToken', urlToken);

          // Clean up URL parameters
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }

        // Check for the non-httpOnly isLoggedIn cookie
        const hasToken = document.cookie.includes('isLoggedIn=true');

        // Also check if we have a token in localStorage
        const localToken = localStorage.getItem('authToken');

        // If either is true, consider the user logged in
        const isAuthenticated = hasToken || !!localToken;

        setIsLoggedIn(isAuthenticated);

        // If authenticated, try to fetch user data
        if (isAuthenticated) {
          try {
            const response = await api.get('/router/profile');
            if (response.data.success) {
              setUser(response.data.user);
            }
          } catch (profileError) {
            console.error('Error fetching user profile:', profileError);
            // If we can't get the profile, we'll just continue without user data
          }
        }

        console.log('User login status:', isAuthenticated ? 'Logged in' : 'Not logged in');
      } catch (error) {
        console.error('Error checking login status:', error);
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
