import React, { useState, useEffect } from 'react';
import '../pagescss/Auth.css';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthImage from '../images/Auth.png';
import Google from '../images/google.png';
import logo from'../images/logo.png';
import { useCart } from './MarketPlace/cart';
import api from '../services/api';
import { getGoogleAuthUrl } from '../utils/apiConfig';
import { storeUserDataInCookies } from '../utils/cookieUtils';
import { useAuth } from '../context/AuthContext';
import LoadingAnimation from '../components/LoadingAnimation';

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { syncCartWithServer } = useCart();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorParam = params.get('error');
    if (errorParam) {
      if (errorParam === 'authentication_failed') {
        setError('Google authentication failed. Please try again or use email login.');
      } else if (errorParam === 'google_auth_not_configured') {
        setError('Google authentication is not available at this time. The server is missing required Google OAuth credentials. Please use email login instead.');
        console.error('Google OAuth is not configured on the server. Check server logs for details.');
      } else {
        setError('Authentication failed. Please try again.');
      }
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post("/router/login", form);

      // Store token in localStorage for the API interceptor to use (legacy support)
      localStorage.setItem('authToken', response.data.token);

      // Store userId in localStorage for payment processing (legacy support)
      if (response.data.user && response.data.user._id) {
        localStorage.setItem('userId', response.data.user._id);
        console.log("Stored user ID:", response.data.user._id);
      }

      // Store user data in cookies
      storeUserDataInCookies(response.data.user, response.data.token);

      // Update auth context
      login(response.data.user, response.data.token);

      console.log("Login successful, user data stored in cookies");

      // Sync cart with server after successful login
      await syncCartWithServer();

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
      setTimeout(() => {
        navigate('/',{ state: { reload: true }});
      }, 2000);
    } catch (error) {
      console.error("Error logging in:", error);
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const handleGoogleSignIn = () => {
    setError('');
    setIsLoading(true);

    try {
      // Store a flag to sync cart after Google login
      localStorage.setItem('syncCartAfterLogin', 'true');

      // Get the Google auth URL
      const googleAuthUrl = getGoogleAuthUrl();
      console.log('Redirecting to Google auth URL:', googleAuthUrl);

      // Add error handling with a timeout
      const redirectTimeout = setTimeout(() => {
        setError('Google authentication request timed out. Please try again later.');
        setIsLoading(false);
      }, 10000); // 10 second timeout

      // Store the timeout ID so we can clear it if navigation happens
      localStorage.setItem('googleAuthTimeout', redirectTimeout);

      // Redirect to Google auth
      window.location.href = googleAuthUrl;
    } catch (error) {
      console.error('Error initiating Google sign-in:', error);
      setError('Failed to connect to Google authentication. Please try again later.');
      setIsLoading(false);
    }
  }

  return (
    <div className='boxes'>
      <div className='colourbox'>
        <img className='logoimage' onClick={()=>navigate('/')} src={logo} alt="logo" />
        <img className='authimage' src={AuthImage} alt="Login" />
        <br />
      </div>
      <div className='loginbox'>
        <div className='login-form'>
          <h1>Sign In</h1>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit}>
            <label>Email</label>
            <input type="text" placeholder='Email...' value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <label>Password</label>
            <input type="password" placeholder='Password' value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            <a href="/signup">Don't have account</a>
            <a href="/forgotpassword">Forgot Password?</a>
            {isLoading ? (
              <div className="loading-animation-container">
                <LoadingAnimation text="Logging in..." />
              </div>
            ) : (
              <input
                type="submit"
                value="Login"
                disabled={isLoading}
              />
            )}
            <div className="solid-line-with-text">
              <div className="line"></div>
              <span>or sign in with</span>
              <div className="line"></div>
            </div>
          </form>
          <div className='google-signin'>
            {isLoading ? (
              <div className="loading-animation-container">
                <LoadingAnimation text="Connecting to Google..." />
              </div>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <img src={Google} alt="Google" className='google-icon' />
                Sign in with Google
              </button>
            )}
          </div>

        </div>

      </div>
      {success &&
          <div className="success-message">Login successful!</div>
          }
    </div>
  );
}

export default Login;
