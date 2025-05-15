import axios from 'axios';

// Determine the API base URL based on environment
const getBaseUrl = () => {
  // Check if we have an environment variable (Vite uses import.meta.env)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Check if we're in development or production
  if (import.meta.env.DEV) {
    // Local development - use localhost
    return 'http://localhost:5000';
  }

  // Production default
  return 'https://s89-akhil-bookaura-2.onrender.com';
};

// Create a base axios instance with common configuration
const api = axios.create({
  baseURL: getBaseUrl(),
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

// Request interceptor to add auth token from localStorage if available
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('authToken');

    // If token exists, add it to the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

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
      if (!window.location.pathname.includes('/login')) {
        // Clear any stored auth data
        localStorage.removeItem('authToken');

        // Redirect to login page
        // Using window.location instead of navigate because this is outside of React components
        window.location.href = '/login';
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
