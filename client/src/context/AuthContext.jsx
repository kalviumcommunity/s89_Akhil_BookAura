import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

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
    const checkLoginStatus = () => {
      // Check for the non-httpOnly isLoggedIn cookie
      const hasToken = document.cookie.includes('isLoggedIn=true');
      setIsLoggedIn(hasToken);
      setLoading(false);
      console.log('User login status:', hasToken ? 'Logged in' : 'Not logged in');
    };

    checkLoginStatus();
  }, []);

  // Function to handle login
  const login = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
  };

  // Function to handle logout
  const logout = async () => {
    try {
      await axios.get('http://localhost:5000/router/logout', { withCredentials: true });
      setUser(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Error logging out:', error);
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
