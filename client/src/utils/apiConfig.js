/**
 * API Configuration Utility
 *
 * This utility provides centralized management of API URLs and endpoints
 * to ensure consistent behavior across different environments (localhost, production).
 */

// Get the base API URL based on the current environment
export const getApiBaseUrl = () => {
  // Check if we have an environment variable (Vite uses import.meta.env)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Check if we're in development or production
  if (import.meta.env.DEV) {
    // Local development - use localhost
    return 'http://localhost:5000';
  }

  // Check if we're running on a specific domain
  const hostname = window.location.hostname;

  // Map hostnames to API URLs
  if (hostname === 'bookauraba.netlify.app') {
    console.log('Using API URL for bookauraba.netlify.app: https://s89-akhil-bookaura-1.onrender.com');
    return 'https://s89-akhil-bookaura-1.onrender.com';
  } else if (hostname === 'bookaura.netlify.app') {
    console.log('Using API URL for bookaura.netlify.app: https://s89-akhil-bookaura-1.onrender.com');
    return 'https://s89-akhil-bookaura-1.onrender.com';
  } else if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    console.log('Using API URL for localhost: http://localhost:5000');
    return 'http://localhost:5000';
  }

  // Production default
  console.log('Using default API URL: https://s89-akhil-bookaura-1.onrender.com');
  return 'https://s89-akhil-bookaura-1.onrender.com';
};

// Get the frontend URL based on the current environment
export const getFrontendBaseUrl = () => {
  // Check if we have an environment variable
  if (import.meta.env.VITE_FRONTEND_URL) {
    return import.meta.env.VITE_FRONTEND_URL;
  }

  // Check if we're in development or production
  if (import.meta.env.DEV) {
    // Local development - use localhost
    return 'http://localhost:5173';
  }

  // Use the current origin as the frontend URL
  return window.location.origin;
};

// Build a full API URL for a specific endpoint
export const getApiUrl = (endpoint) => {
  const baseUrl = getApiBaseUrl();
  // Remove leading slash from endpoint if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  return `${baseUrl}/${cleanEndpoint}`;
};

// Get the Google OAuth URL
export const getGoogleAuthUrl = () => {
  // Use the current server URL for Google auth
  const serverUrl = getApiBaseUrl();
  console.log('Using Google Auth URL:', `${serverUrl}/router/auth/google`);
  return `${serverUrl}/router/auth/google`;
};

// Get the callback URL for Google OAuth
export const getGoogleCallbackUrl = () => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/router/auth/google/callback`;
};

// Get the URL for verifying a purchase
export const getVerifyPurchaseUrl = (purchaseId, userId) => {
  const baseUrl = getApiBaseUrl();
  const userIdParam = userId ? `&userId=${userId}` : '';
  return `${baseUrl}/api/payment/verify-purchase?purchaseId=${purchaseId}${userIdParam}`;
};

// Get the URL for saving a purchase
export const getSavePurchaseUrl = () => {
  return `${getApiBaseUrl()}/api/payment/save-purchase`;
};

// Get the URL for fetching purchased books
export const getMyPurchasesUrl = () => {
  return `${getApiBaseUrl()}/api/payment/my-purchases`;
};

// Get the URL for fetching books
export const getBooksUrl = (queryParams = '') => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/router/getBooks${queryParams ? `?${queryParams}` : ''}`;
};

// Get the URL for featured books
export const getFeaturedBooksUrl = () => {
  return `${getApiBaseUrl()}/router/featured`;
};

// Get the URL for bestseller books
export const getBestsellerBooksUrl = () => {
  return `${getApiBaseUrl()}/router/bestsellers`;
};

// Get the URL for new release books
export const getNewReleaseBooksUrl = () => {
  return `${getApiBaseUrl()}/router/newreleases`;
};

// Get the URL for PDF signed URL
export const getPdfSignedUrl = () => {
  return `${getApiBaseUrl()}/api/pdf/signed-url`;
};

// Get the URL for fetching PDF content
export const getPdfFetchUrl = () => {
  return `${getApiBaseUrl()}/api/pdf/fetch-pdf`;
};

// Get the URL for placeholder PDF
export const getPlaceholderPdfUrl = () => {
  return `${getApiBaseUrl()}/api/pdf/placeholder-pdf`;
};

// Export a default configuration object
export default {
  getApiBaseUrl,
  getFrontendBaseUrl,
  getApiUrl,
  getGoogleAuthUrl,
  getGoogleCallbackUrl,
  getVerifyPurchaseUrl,
  getSavePurchaseUrl,
  getMyPurchasesUrl,
  getBooksUrl,
  getFeaturedBooksUrl,
  getBestsellerBooksUrl,
  getNewReleaseBooksUrl,
  getPdfSignedUrl,
  getPdfFetchUrl,
  getPlaceholderPdfUrl
};
