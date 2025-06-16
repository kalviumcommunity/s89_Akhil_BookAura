import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthImage from '../images/Auth.png'; // Same login image
import Google from '../images/google.png'; // Google icon
import '../pagescss/Auth.css'; // CSS for signup page
import logo from '../images/logo.png';
import { getApiBaseUrl, getGoogleAuthUrl } from '../utils/apiConfig';
import { useAuth } from '../context/AuthContext';
import { storeUserDataInCookies } from '../utils/cookieUtils';
import LoadingAnimation from '../components/LoadingAnimation';

const Signup = () => {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorParam = params.get('error');
    if (errorParam) {
      if (errorParam === 'authentication_failed') {
        setError('Google authentication failed. Please try again or use email signup.');
      } else if (errorParam === 'google_auth_not_configured') {
        setError('Google authentication is not available at this time. Please use email signup instead.');
      } else {
        setError('Authentication failed. Please try again.');
      }
    }
  }, [location]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("https://s89-akhil-bookaura-2.onrender.com/router/signup", form, { withCredentials: true });
      console.log("Signup successful:", response.data);

      // Store the token in localStorage (legacy support)
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);

        // Store user ID if available (legacy support)
        if (response.data.user && response.data.user._id) {
          localStorage.setItem('userId', response.data.user._id);
        }

        // Store user data in cookies
        storeUserDataInCookies(response.data.user, response.data.token);

        console.log('Stored user data in cookies during signup:', response.data.user?._id);

        // Update auth context
        login(response.data.user, response.data.token);
      }

      // Show success message
      alert("Signup successful!");

      // Redirect to home after successful signup
      navigate('/');
    } catch (error) {
      console.error("Error signing up:", error);
      setError(error.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setError('');
    window.location.href = "https://s89-akhil-bookaura-2.onrender.com/router/auth/google";
    // Let backend handle redirect after Google login
  };

  return (
    <div className="boxes">
      <div className="colourbox">
        
        <img className='authimage' src={AuthImage} alt="Signup" />
        <br />
      </div>
      <div className="loginbox">
        <div className="login-form">
          <img className='logoimage' onClick={()=>navigate('/')} src={logo} alt="logo" />
          <h1>Sign Up</h1>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit}>
            <label>Username</label>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              required
            />

            <label>Email</label>
            <input
              type="text"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
            />

            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
            />

            <a href="/login">Already have an account?</a>
            {isLoading ? (
              <div className="loading-animation-container">
                <LoadingAnimation text="Creating your account..." />
              </div>
            ) : (
              <input
                type="submit"
                value="Sign Up"
                disabled={isLoading}
              />
            )}

            <div className="solid-line-with-text">
              <div className="line"></div>
              <span>or sign up with</span>
              <div className="line"></div>
            </div>
          </form>

          <div className="google-signin">
            {isLoading ? (
              <div className="loading-animation-container">
                <LoadingAnimation text="Connecting to Google..." />
              </div>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <img src={Google} alt="Google" className="google-icon" />
                Sign up with Google
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;