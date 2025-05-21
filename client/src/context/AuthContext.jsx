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

        // IMMEDIATELY set login status to avoid delays
        setIsLoggedIn(isAuthenticated);

        // IMMEDIATELY check for cached user data
        if (isAuthenticated) {
          const cachedUserData = localStorage.getItem('userData');
          if (cachedUserData) {
            try {
              const parsedData = JSON.parse(cachedUserData);
              console.log('IMMEDIATELY using cached user data');

              // Ensure we have all required fields with defaults if missing
              const userData = {
                username: parsedData.username || 'User',
                email: parsedData.email || '',
                profileImage: parsedData.profileImage || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
              };

              console.log('Processed user data in AuthContext:', userData);
              setUser(userData);

              // Set loading to false right away
              setLoading(false);
            } catch (e) {
              console.error('Error parsing cached user data:', e);
            }
          }
        }

        // Set a very short timeout to ensure loading state is cleared
        setTimeout(() => {
          setLoading(false);
        }, 500);

        // If authenticated, try to fetch fresh user data in the background
        if (isAuthenticated) {
          // Use a separate async function to fetch in background
          const fetchUserDataInBackground = async () => {
            try {
              console.log('Fetching fresh user profile data in background...');

              if (!localToken) {
                console.log('No token available for background fetch');
                return;
              }

              // Set the token in the Authorization header explicitly
              const headers = {
                Authorization: `Bearer ${localToken}`
              };

              // Add a timestamp parameter to prevent caching
              const timestamp = new Date().getTime();

              // Set a timeout for the API request
              const controller = new AbortController();
              const timeoutId = setTimeout(() => {
                console.log('Background API request timeout reached, aborting');
                controller.abort();
              }, 5000); // 5 second timeout

              const response = await api.get(`/router/profile?_t=${timestamp}`, {
                headers,
                signal: controller.signal
              });

              clearTimeout(timeoutId); // Clear the timeout if request completes

              if (response.data.success) {
                console.log('Fresh user profile data retrieved successfully in background');
                const userData = response.data.user;

                // Ensure we have all required fields with defaults if missing
                const processedUserData = {
                  username: userData.username || 'User',
                  email: userData.email || '',
                  profileImage: userData.profileImage || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
                };

                console.log('Fresh user data processed in AuthContext:', processedUserData);

                // Cache the user data in localStorage
                localStorage.setItem('userData', JSON.stringify(processedUserData));

                // Update the user data
                setUser(processedUserData);
              }
            } catch (profileError) {
              console.error('Error in background fetch of user profile:', profileError);

              // If we get a 401 error, the token might be invalid or expired
              if (profileError.response && profileError.response.status === 401) {
                console.log('Authentication token invalid or expired');

                // Only clear auth state if we're not on the login page
                if (!window.location.pathname.includes('/login')) {
                  setIsLoggedIn(false);
                  setUser(null);
                }
              }
              // For other errors, we already have cached data, so just log
            }
          };

          // Start the background fetch
          fetchUserDataInBackground();
        } else {
          // Not authenticated, ensure loading is false
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in authentication check:', error);
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
