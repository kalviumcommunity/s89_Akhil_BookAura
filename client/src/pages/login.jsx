import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../pagescss/Auth.css';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthImage from '../images/Auth.png';
import Google from '../images/google.png';
import logo from'../images/logo.png';
import { useCart } from './MarketPlace/cart';

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { syncCartWithServer } = useCart();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorParam = params.get('error');
    if (errorParam) {
      setError('Authentication failed. Please try again.');
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("https://s89-akhil-bookaura-3.onrender.com/router/login", form, { withCredentials: true });

      // Store token in localStorage
      localStorage.setItem('authToken', response.data.token);

      // Also set a client-side cookie for isLoggedIn status
      // This ensures the login state persists even if localStorage is cleared
      document.cookie = `isLoggedIn=true; path=/; max-age=${7 * 24 * 60 * 60}`;

      console.log("Login successful");

      // Sync cart with server after successful login
      await syncCartWithServer();

      await setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error("Error logging in:", error);
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    }
  }

  const handleGoogleSignIn = () => {
    setError('');
    // Store a flag to sync cart after Google login
    localStorage.setItem('syncCartAfterLogin', 'true');
    window.location.href = "https://s89-akhil-bookaura-3.onrender.com/router/auth/google";
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
            <input type="submit" value="Login" />
            <div className="solid-line-with-text">
              <div className="line"></div>
              <span>or sign in with</span>
              <div className="line"></div>
            </div>
          </form>
          <div className='google-signin'>
            <button onClick={handleGoogleSignIn}><img src={Google} alt="Google" className='google-icon' />Sign in with Google</button>
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