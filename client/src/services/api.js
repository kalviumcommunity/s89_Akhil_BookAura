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

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
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

    return Promise.reject(error);
  }
);

export default api;
