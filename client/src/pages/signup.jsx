import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AuthImage from '../images/Auth.png'; // Same login image
import Google from '../images/google.png'; // Google icon
import '../pagescss/Auth.css'; // CSS for signup page
import logo from '../images/logo.png'

const Signup = () => {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("https://s89-akhil-bookaura-3.onrender.com/router/signup", form, { withCredentials: true });
      console.log("Signup successful:", response.data);
      alert("Signup successful!");
      navigate('/'); // Redirect to home after successful signup
    } catch (error) {
      console.error("Error signing up:", error);
      setError(error.response?.data?.message || "Signup failed. Please try again.");
    }
  };

  const handleGoogleSignIn = () => {
    setError('');
    console.log('Starting Google authentication flow from signup page...');

    // Clear any existing auth data before starting Google auth flow
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');

    // Clear cookies
    document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'isLoggedIn=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

    // Store a flag to sync cart after Google login
    localStorage.setItem('syncCartAfterLogin', 'true');

    // Store a flag to indicate we're coming from signup page
    localStorage.setItem('googleAuthSource', 'signup');

    // Use the correct server URL for Google authentication
    const serverUrl = 'https://s89-akhil-bookaura-3.onrender.com';

    // Add timestamp to prevent caching issues
    const timestamp = Date.now();
    const googleAuthUrl = `${serverUrl}/router/auth/google?t=${timestamp}&signup=true`;

    // Log the redirect for debugging
    console.log('Redirecting to Google authentication:', googleAuthUrl);

    // Redirect to Google auth endpoint
    window.location.href = googleAuthUrl;
  };

  return (
    <div className="boxes">
      <div className="colourbox">
        <img className='logoimage' onClick={()=>navigate('/')} src={logo} alt="logo" />
        <img className='authimage' src={AuthImage} alt="Signup" />
        <br />
      </div>
      <div className="loginbox">
        <div className="login-form">
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
            <input type="submit" value="Sign Up" />

            <div className="solid-line-with-text">
              <div className="line"></div>
              <span>or sign up with</span>
              <div className="line"></div>
            </div>
          </form>

          <div className="google-signin">
            <button onClick={handleGoogleSignIn}>
              <img src={Google} alt="Google" className="google-icon" />
              Sign up with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
