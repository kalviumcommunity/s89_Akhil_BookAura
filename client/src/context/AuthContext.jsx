import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import {
  storeUserDataInCookies,
  clearUserCookies,
  getUserDataFromCookies,
  hasCookie
} from '../utils/cookieUtils';

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
        // Get user data from cookies
        const cookieData = getUserDataFromCookies();

        // Also check if we have a token in localStorage (legacy support)
        const localToken = localStorage.getItem('authToken');

        // Check if we have a user ID in localStorage (legacy support)
        const localUserId = localStorage.getItem('userId');

        // Log detailed authentication state for debugging
        console.log('Auth check details:', {
          cookieData,
          tokenInLocalStorage: !!localToken,
          userIdInLocalStorage: !!localUserId,
          cookieContent: document.cookie
        });

        // Determine if user is authenticated
        const isAuthenticated = cookieData.isLoggedIn || !!localToken;

        // If we have user ID in localStorage but not in cookies, store it in cookies
        if (!cookieData.userId && localUserId) {
          console.log('Migrating user ID from localStorage to cookies');
          storeUserDataInCookies({ _id: localUserId }, localToken);
        }

        setIsLoggedIn(isAuthenticated);

        // If authenticated, try to fetch user data
        if (isAuthenticated) {
          try {
            const response = await api.get('/router/profile');
            if (response.data.success) {
              setUser(response.data.user);

              // Store userId in localStorage for payment processing
              if (response.data.user && response.data.user._id) {
                localStorage.setItem('userId', response.data.user._id);
                console.log("Stored user ID from profile:", response.data.user._id);
              }
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
    // Store user data in state
    setUser(userData);
    setIsLoggedIn(true);

    // Store user data in cookies
    storeUserDataInCookies(userData, token || localStorage.getItem('authToken'));

    console.log('User logged in and data stored in cookies:', userData?._id);
  };

  // Function to handle logout
  const logout = async () => {
    try {
      // Call server logout endpoint
      await api.get('/router/logout');

      // Clear all authentication-related data
      clearAllUserData();

      // Update state
      setUser(null);
      setIsLoggedIn(false);

      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);

      // Even if the server request fails, clear local auth state
      clearAllUserData();
      setUser(null);
      setIsLoggedIn(false);
    }
  };

  // Helper function to clear all user data from browser
  const clearAllUserData = () => {
    console.log('Clearing all user data...');

    // 1. Clear all authentication tokens
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');

    // 2. Clear chat-related data
    localStorage.removeItem('chatUserId');

    // 3. Clear cart data
    localStorage.removeItem('bookCart');
    localStorage.removeItem('syncCartAfterLogin');

    // 4. Clear Cronofy calendar data
    localStorage.removeItem('cronofyAccessToken');
    localStorage.removeItem('cronofyRefreshToken');

    // 5. Clear Google login related data
    localStorage.removeItem('googleLoginPending');

    // 6. Clear any session storage items
    sessionStorage.clear();

    // 7. Call the Cronofy service logout method to ensure it clears its internal state
    try {
      const CronofyService = require('../services/CronofyService').default;
      if (CronofyService && typeof CronofyService.logout === 'function') {
        CronofyService.logout();
      }
    } catch (error) {
      console.error('Error calling CronofyService.logout:', error);
    }

    // Note: We're NOT clearing server-side data
    // The user's cart items, purchased books, and other data will remain on the server
    // Only clearing client-side storage

    // 9. Clear cookies using our cookie utility
    clearUserCookies();

    // For secure cookies that can't be directly accessed by JavaScript,
    // the server-side logout endpoint should handle clearing them

    console.log('All user data cleared');
  };

  // Function to force refresh the auth state
  const refreshAuthState = async () => {
    try {
      setLoading(true);

      // Get user data from cookies
      const cookieData = getUserDataFromCookies();

      // Also check if we have a token in localStorage (legacy support)
      const localToken = localStorage.getItem('authToken');

      // Check if we have a user ID in localStorage (legacy support)
      const localUserId = localStorage.getItem('userId');

      // Log detailed authentication state for debugging
      console.log('Auth refresh details:', {
        cookieData,
        tokenInLocalStorage: !!localToken,
        userIdInLocalStorage: !!localUserId,
        cookieContent: document.cookie
      });

      // Determine if user is authenticated
      const isAuthenticated = cookieData.isLoggedIn || !!localToken;

      // If we have user ID in localStorage but not in cookies, store it in cookies
      if (!cookieData.userId && localUserId) {
        console.log('Migrating user ID from localStorage to cookies during refresh');
        storeUserDataInCookies({ _id: localUserId }, localToken);
      }

      setIsLoggedIn(isAuthenticated);
      console.log('Refreshed login status:', isAuthenticated ? 'Logged in' : 'Not logged in');

      // If authenticated, try to fetch user data
      if (isAuthenticated) {
        try {
          const response = await api.get('/router/profile');
          if (response.data.success) {
            setUser(response.data.user);
          }
        } catch (error) {
          console.error('Error fetching user data during refresh:', error);
        }
      }
    } catch (error) {
      console.error('Error refreshing auth state:', error);
    } finally {
      setLoading(false);
    }
  };

  // Value to be provided to consumers
  const value = {
    isLoggedIn,
    user,
    loading,
    login,
    logout,
    refreshAuthState
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
