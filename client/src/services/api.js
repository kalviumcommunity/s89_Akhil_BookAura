import axios from 'axios';

// Determine the API base URL based on environment
const getBaseUrl = 'https://s89-akhil-bookaura-3.onrender.com';

// Create a base axios instance with common configuration
const api = axios.create({
  baseURL: getBaseUrl,
  withCredentials: true, // Always send cookies with requests
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Retry logic for network errors
  retry: 3,
  retryDelay: (retryCount) => {
    return retryCount * 1000; // 1s, 2s, 3s
  }
});

// Request interceptor to add auth token from localStorage or cookies if available
api.interceptors.request.use(
  (config) => {
    // First try to get token from localStorage
    let token = localStorage.getItem('authToken');

    // Log authentication status for debugging
    console.log('Auth status check:');
    console.log('- Token in localStorage:', token ? 'Present' : 'Missing');
    console.log('- Cookies present:', document.cookie ? 'Yes' : 'No');

    // If no token in localStorage, check for cookies
    if (!token) {
      // Parse cookies to find auth token
      const cookies = document.cookie.split(';');
      console.log('- All cookies:', cookies.map(c => c.trim()).join(', '));

      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        // Check for both possible cookie names
        if (cookie.startsWith('authToken=')) {
          token = cookie.substring('authToken='.length);
          console.log('- Found token in authToken cookie');
          break;
        } else if (cookie.startsWith('token=')) {
          token = cookie.substring('token='.length);
          console.log('- Found token in token cookie');
          break;
        }
      }
    }

    // If token exists, add it to the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('- Adding auth token to request:', config.url);
    } else {
      console.log('- No auth token found for request:', config.url);

      // Check if user is logged in via cookie
      const isLoggedInCookie = document.cookie.split(';').some(cookie =>
        cookie.trim().startsWith('isLoggedIn=true')
      );

      if (isLoggedInCookie) {
        console.log('- User appears to be logged in via cookie, but no token found');

        // Don't redirect - this was causing the profile page reload issue
        // Instead, we'll let the request proceed without a token
        // The server will return 401 if authentication is required
        console.log('- Continuing request without token');
      }
    }

    // Always include credentials to send cookies
    config.withCredentials = true;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors and implement retry logic
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Implement retry logic for network errors or 5xx server errors
    if (
      (error.code === 'ECONNABORTED' ||
       error.message.includes('Network Error') ||
       (error.response && error.response.status >= 500)) &&
      originalRequest &&
      !originalRequest._retry
    ) {
      // Track retry attempts
      originalRequest._retry = (originalRequest._retry || 0) + 1;

      // Check if we should retry
      if (originalRequest._retry <= (api.defaults.retry || 3)) {
        console.log(`Retrying request (${originalRequest._retry}/${api.defaults.retry}): ${originalRequest.url}`);

        // Wait before retrying
        const delay = typeof api.defaults.retryDelay === 'function'
          ? api.defaults.retryDelay(originalRequest._retry)
          : 1000 * originalRequest._retry;

        await new Promise(resolve => setTimeout(resolve, delay));

        // Retry the request
        return api(originalRequest);
      }
    }

    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      console.log('Authentication error:', error.response.data);

      // Check if we're already on the login page to avoid redirect loops
      // Also check if we're on the profile page, which is a protected route
      const isProfilePage = window.location.pathname.includes('/profile');
      const isLoginPage = window.location.pathname.includes('/login');

      if (!isLoginPage) {
        console.log('Unauthorized access detected');

        // Only clear auth data and redirect if this is a protected route like profile
        // For other routes, we'll just let the error propagate
        if (isProfilePage) {
          console.log('Protected route detected, redirecting to login page');

          // Clear any stored auth data
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');

          // Clear cookies
          document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          document.cookie = 'isLoggedIn=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

          // Show error message
          alert('Your session has expired. Please log in again.');

          // Redirect to login page
          // Using window.location instead of navigate because this is outside of React components
          window.location.href = '/login';
        } else {
          console.log('Non-protected route, continuing with error');
        }
      }
    }

    // Handle 403 Forbidden errors
    if (error.response && error.response.status === 403) {
      console.log('Permission denied:', error.response.data);
    }

    // Handle 404 Not Found errors
    if (error.response && error.response.status === 404) {
      console.log('Resource not found:', error.response.data);
    }

    // Handle 429 Too Many Requests
    if (error.response && error.response.status === 429) {
      console.log('Rate limit exceeded:', error.response.data);
    }

    return Promise.reject(error);
  }
);

export default api;
