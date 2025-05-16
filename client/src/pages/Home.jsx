import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import '../pagescss/Home.css'
import bestseller from '../images/bestseller.png'
import Footer from '../components/Footer'
import { useCart } from './MarketPlace/cart'
import { SafeImage, getProxiedImageUrl, handleImageError } from '../utils/imageUtils'
import {useNavigate,useLocation} from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import axios from 'axios';
import { getFeaturedBooksUrl } from '../utils/apiConfig';
import { useAuth } from '../context/AuthContext';
import { storeUserDataInCookies } from '../utils/cookieUtils';

const Home = () => {
  const { syncCartWithServer } = useCart();
  const { refreshAuthState } = useAuth();
  const navigate = useNavigate();
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);
  const location = useLocation();

  // Check if we need to sync cart after Google login
  useEffect(() => {
    if (location.state?.reload) {
      window.history.replaceState({}, document.title); // prevent infinite reload
      window.location.reload(); // full reload
    }

    const fetchBooks = async () => {
      try {
        const featuredResponse = await axios.get(getFeaturedBooksUrl());
        setFeaturedBooks(featuredResponse.data.data.slice(0, 4)); // Limit to 4 books
      } catch (error) {
        console.log('Failed to fetch featured books:', error);
        console.log(error)
      }
    }

    fetchBooks();

    // Handle Google OAuth callback
    const handleGoogleCallback = async () => {
      // Check for Google OAuth callback parameters
      const params = new URLSearchParams(window.location.search);
      const success = params.get('success');
      const token = params.get('token');
      const userId = params.get('user_id');

      if (success === 'true' && token) {
        console.log('Google login successful, processing token');

        // Store the token in localStorage
        localStorage.setItem('authToken', token);

        // Extract user data from token or URL parameters
        let userData = { _id: userId };

        // Try to extract more user data from token
        try {
          // JWT tokens are in format: header.payload.signature
          // We need the payload part which is the second part
          const payload = token.split('.')[1];
          // The payload is base64 encoded, so we need to decode it
          const decodedPayload = JSON.parse(atob(payload));

          if (decodedPayload.id) {
            console.log('Extracted user ID from token:', decodedPayload.id);
            userData._id = decodedPayload.id;
            localStorage.setItem('userId', decodedPayload.id);
          }

          // Extract other user data if available
          if (decodedPayload.email) {
            userData.email = decodedPayload.email;
          }

          if (decodedPayload.name) {
            userData.username = decodedPayload.name;
          }
        } catch (error) {
          console.error('Error decoding JWT token:', error);
        }

        // Store user data in cookies
        storeUserDataInCookies(userData, token);

        console.log('Stored Google user data in cookies:', userData);

        // Log the login status after setting everything
        console.log('Updated login status:',
          document.cookie.includes('isLoggedIn=true') ? 'Cookie set' : 'Cookie not set',
          document.cookie.includes('userLoggedIn=true') ? 'userLoggedIn set' : 'userLoggedIn not set',
          document.cookie.includes('googleAuth=true') ? 'googleAuth set' : 'googleAuth not set',
          localStorage.getItem('authToken') ? 'Token set' : 'Token not set',
          localStorage.getItem('userId') ? 'UserID set' : 'UserID not set'
        );

        // Refresh the authentication state
        await refreshAuthState();

        // Sync cart with server
        await syncCartWithServer();

        // Show success notification
        setShowLoginSuccess(true);

        // Hide notification after 3 seconds
        setTimeout(() => {
          setShowLoginSuccess(false);
        }, 3000);

        // Remove the parameters from URL to prevent reprocessing on refresh
        window.history.replaceState({}, document.title, '/');
      }
    };

    handleGoogleCallback();

    // Check if we need to sync cart after normal login
    const shouldSyncCart = localStorage.getItem('syncCartAfterLogin');
    if (shouldSyncCart === 'true') {
      // Sync cart with server
      syncCartWithServer();
      // Remove the flag
      localStorage.removeItem('syncCartAfterLogin');
    }
  }, [location.state, syncCartWithServer]);

  return (
    <div>
      <Navbar/>
      {showLoginSuccess && (
        <div className="login-success-notification">
          <p>Google login successful! Welcome back.</p>
        </div>
      )}
      <div className='main-box'>
        <div className='quote-container'>
          <h1 className='quote-line'>TO SUCCEED<br/>YOU MUST<br/>READ</h1>
          <h3 className='line'>NOT SURE WHAT TO READ? EXPLORE OUR CATALOG OF PUBLIC DOMAIN BOOKS WITH OUR EDITORS</h3>
          <button className='explore' onClick={() => navigate('/marketplace')}>EXPLORE MORE | <span>&#8599;</span></button>
        </div>

        <div className='main-books'>
          <img className='photo book1' onClick={() => navigate('/books?id=65009709000001')} src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRzIbGw5k2kZZMVRhAtcqYdhqH4RLsEnEjdUw&s" alt="hard things about hard things" />
          <img className='photo book2' onClick={() => navigate('/books?id=65009709000001')} src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQe3Au_7qcAvUYAqjrzSHr2vpJp5GmZwu3C7A&s" alt="think and grow rich" />
          <img className='photo book3' onClick={() => navigate('/books?id=65009709000001')} src="https://raajkart.com/media/catalog/product/cache/378cf9a83101843e5b8b1271b991c285/z/e/zero_to_one_peter_thiel_.png" alt="zero to one" />
        </div>
      </div>
      <div className='middle-box'>
        <div className='bestseller-showcase'>
          <div className='bestseller-book'>
            <div className='bestseller-badge-container'>
              <img className='bestseller-badge' src={bestseller} alt="bestseller badge" />
            </div>
            <img className='bestseller-cover' src="https://m.media-amazon.com/images/I/71vtwPxOZRL._AC_UF1000,1000_QL80_.jpg" alt="Dot Com Secrets" />
          </div>

          <div className='bestseller-details'>
            <h2 className='bestseller-title'>Dot Com Secrets</h2>
            <p className='bestseller-author'>By Russell Brunson</p>
            <div className='bestseller-rating'>
            </div>
            <p className='bestseller-description'>
              The Underground Playbook For Growing Your Company Online With Sales Funnels.
              This book walks you through the exact strategies that helped companies grow from
              zero to generating millions in revenue.
            </p>
            <div className='bestseller-meta'>
              <div className='meta-item'>
                <span className='meta-label'>Pages:</span>
                <span className='meta-value'>384</span>
              </div>
              <div className='meta-item'>
                <span className='meta-label'>Published:</span>
                <span className='meta-value'>2015</span>
              </div>
              <div className='meta-item'>
                <span className='meta-label'>Category:</span>
                <span className='meta-value'>Marketing</span>
              </div>
            </div>
            <button className='bestseller-button' onClick={() => navigate('/books?id=65009709000001')}>Read More</button>
          </div>
        </div>

        <div className='featured-section'>
          <h2 className='section-title'>Featured Books</h2>
          <p className='section-subtitle'>Discover our most popular titles this month</p>

          <div className='featured-books-container'>
            {featuredBooks.map((book, index) => (
              <div key={index} className='featured-book'>
                <ProductCard book={book} />
              </div>
            ))}
          </div>

          <button className='view-all-btn' onClick={() => navigate('/books')}>View All Books</button>
        </div>
      </div>
      <Footer/>
    </div>
  )
}

export default Home
