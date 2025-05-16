/**
 * Cookie Utility Functions
 * 
 * This utility provides functions to manage cookies in a consistent way across the application.
 */

/**
 * Set a cookie with the given name, value, and options
 * 
 * @param {string} name - The name of the cookie
 * @param {string} value - The value of the cookie
 * @param {Object} options - Cookie options
 * @param {number} options.days - Number of days until the cookie expires
 * @param {boolean} options.secure - Whether the cookie should only be sent over HTTPS
 * @param {string} options.sameSite - SameSite attribute ('strict', 'lax', or 'none')
 * @param {string} options.path - Path for the cookie
 * @param {string} options.domain - Domain for the cookie
 */
export const setCookie = (name, value, options = {}) => {
  const {
    days = 7,
    secure = window.location.protocol === 'https:',
    sameSite = 'lax',
    path = '/',
    domain = ''
  } = options;

  // Calculate expiration date
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + days);

  // Build cookie string
  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  cookieString += `; expires=${expirationDate.toUTCString()}`;
  cookieString += `; path=${path}`;
  
  if (secure) {
    cookieString += '; secure';
  }
  
  cookieString += `; samesite=${sameSite}`;
  
  if (domain) {
    cookieString += `; domain=${domain}`;
  }

  // Set the cookie
  document.cookie = cookieString;
  
  console.log(`Cookie set: ${name} (expires: ${expirationDate.toUTCString()})`);
};

/**
 * Get a cookie value by name
 * 
 * @param {string} name - The name of the cookie to retrieve
 * @returns {string|null} The cookie value or null if not found
 */
export const getCookie = (name) => {
  const nameString = `${encodeURIComponent(name)}=`;
  const cookies = document.cookie.split(';');
  
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i].trim();
    if (cookie.indexOf(nameString) === 0) {
      return decodeURIComponent(cookie.substring(nameString.length, cookie.length));
    }
  }
  
  return null;
};

/**
 * Check if a cookie exists
 * 
 * @param {string} name - The name of the cookie to check
 * @returns {boolean} True if the cookie exists, false otherwise
 */
export const hasCookie = (name) => {
  return getCookie(name) !== null;
};

/**
 * Delete a cookie by name
 * 
 * @param {string} name - The name of the cookie to delete
 * @param {Object} options - Cookie options
 * @param {string} options.path - Path for the cookie
 * @param {string} options.domain - Domain for the cookie
 */
export const deleteCookie = (name, options = {}) => {
  const { path = '/', domain = '' } = options;
  
  // Set expiration to a past date to delete the cookie
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}${domain ? `; domain=${domain}` : ''}`;
  
  console.log(`Cookie deleted: ${name}`);
};

/**
 * Delete a cookie with multiple path and domain combinations
 * 
 * @param {string} name - The name of the cookie to delete
 */
export const deleteAllCookieVariants = (name) => {
  const domains = ['', window.location.hostname, `.${window.location.hostname}`];
  const paths = ['/', '/router', ''];
  
  domains.forEach(domain => {
    paths.forEach(path => {
      deleteCookie(name, { path, domain });
    });
  });
};

/**
 * Store user data in cookies
 * 
 * @param {Object} userData - User data to store
 * @param {string} token - Authentication token
 */
export const storeUserDataInCookies = (userData, token) => {
  // Store authentication status
  setCookie('isLoggedIn', 'true');
  setCookie('userLoggedIn', 'true');
  
  // Store user ID if available
  if (userData && userData._id) {
    setCookie('userId', userData._id);
  }
  
  // Store username if available
  if (userData && userData.username) {
    setCookie('username', userData.username);
  }
  
  // Store email if available
  if (userData && userData.email) {
    setCookie('userEmail', userData.email);
  }
  
  // Store token in a cookie (not httpOnly, just for client-side detection)
  if (token) {
    setCookie('clientToken', token);
  }
  
  console.log('User data stored in cookies');
};

/**
 * Clear all user-related cookies
 */
export const clearUserCookies = () => {
  const cookieNames = [
    'isLoggedIn', 
    'userLoggedIn', 
    'googleAuth', 
    'userId', 
    'username', 
    'userEmail', 
    'clientToken'
  ];
  
  cookieNames.forEach(name => {
    deleteAllCookieVariants(name);
  });
  
  console.log('All user cookies cleared');
};

/**
 * Get user data from cookies
 * 
 * @returns {Object} User data from cookies
 */
export const getUserDataFromCookies = () => {
  return {
    isLoggedIn: hasCookie('isLoggedIn') || hasCookie('userLoggedIn'),
    userId: getCookie('userId'),
    username: getCookie('username'),
    email: getCookie('userEmail'),
    token: getCookie('clientToken')
  };
};

export default {
  setCookie,
  getCookie,
  hasCookie,
  deleteCookie,
  deleteAllCookieVariants,
  storeUserDataInCookies,
  clearUserCookies,
  getUserDataFromCookies
};
