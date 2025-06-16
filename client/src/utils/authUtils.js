/**
 * Authentication utility functions to handle token and cookie management
 * Fixes issues with inconsistent authentication across different accounts
 */

/**
 * Get authentication token from multiple sources
 * @returns {string|null} - The authentication token or null
 */
export const getAuthToken = () => {
  // 1. Check localStorage first
  let token = localStorage.getItem('authToken');
  if (token) {
    return token;
  }

  // 2. Check cookies
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'authToken' || name === 'token') {
      return value;
    }
  }

  return null;
};

/**
 * Check if user is authenticated
 * @returns {boolean} - True if authenticated
 */
export const isAuthenticated = () => {
  const token = getAuthToken();
  
  // Check for isLoggedIn cookie as backup
  const isLoggedInCookie = document.cookie
    .split(';')
    .some(cookie => cookie.trim().startsWith('isLoggedIn=true'));

  return !!(token || isLoggedInCookie);
};

/**
 * Set authentication token in both localStorage and cookie
 * @param {string} token - The authentication token
 */
export const setAuthToken = (token) => {
  if (!token) return;

  // Store in localStorage
  localStorage.setItem('authToken', token);

  // Set client-side cookie
  const maxAge = 7 * 24 * 60 * 60; // 7 days
  const secure = window.location.protocol === 'https:' ? 'Secure' : '';
  document.cookie = `isLoggedIn=true; path=/; max-age=${maxAge}; SameSite=None; ${secure}`;
};

/**
 * Clear all authentication data
 */
export const clearAuthData = () => {
  // Clear localStorage
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');

  // Clear cookies
  document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'isLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
};

/**
 * Get user data with fallback handling
 * @returns {object|null} - User data or null
 */
export const getUserData = () => {
  try {
    const userData = localStorage.getItem('userData');
    if (userData) {
      const parsed = JSON.parse(userData);
      return {
        username: parsed.username || 'User',
        email: parsed.email || '',
        profileImage: parsed.profileImage || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
      };
    }
  } catch (error) {
    console.error('Error parsing user data:', error);
  }
  return null;
};

/**
 * Set user data in localStorage
 * @param {object} userData - User data object
 */
export const setUserData = (userData) => {
  if (!userData) return;
  
  try {
    localStorage.setItem('userData', JSON.stringify(userData));
  } catch (error) {
    console.error('Error storing user data:', error);
  }
};

/**
 * Create axios headers with authentication
 * @returns {object} - Headers object with authorization
 */
export const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Handle authentication errors consistently
 * @param {object} error - Axios error object
 * @returns {boolean} - True if it was an auth error
 */
export const handleAuthError = (error) => {
  if (error.response && error.response.status === 401) {
    console.log('Authentication error detected, clearing auth data');
    clearAuthData();
    
    // Only redirect if not already on login page
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
    return true;
  }
  return false;
};

/**
 * Refresh user authentication status
 * @param {function} setIsLoggedIn - Function to update login status
 * @param {function} setUser - Function to update user data
 */
export const refreshAuthStatus = async (setIsLoggedIn, setUser) => {
  const authenticated = isAuthenticated();
  setIsLoggedIn(authenticated);

  if (authenticated) {
    const userData = getUserData();
    if (userData) {
      setUser(userData);
    }
  } else {
    setUser(null);
  }
};
