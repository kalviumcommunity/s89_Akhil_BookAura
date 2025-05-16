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

const Home = () => {
  const { syncCartWithServer } = useCart();
  const navigate = useNavigate();
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const location = useLocation();

  // Check if we need to sync cart after Google login and handle token from URL
  useEffect(() => {
    // Handle URL parameters for Google OAuth callback
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const success = params.get('success');
    const encodedUserData = params.get('userData');

    // If we have a token from Google OAuth callback, store it
    if (token && success === 'true') {
      console.log('Google authentication successful, storing token');

      // Store token in localStorage for the API interceptor to use
      localStorage.setItem('authToken', token);

      // Set flag to sync cart
      localStorage.setItem('syncCartAfterLogin', 'true');

      // Set isLoggedIn cookie for client-side detection (important for cross-domain)
      // Use secure and SameSite=None for cross-domain cookies
      document.cookie = `isLoggedIn=true; path=/; max-age=${7 * 24 * 60 * 60}; secure; SameSite=None`;

      // If we have user data, store it
      if (encodedUserData) {
        try {
          const userData = JSON.parse(decodeURIComponent(encodedUserData));
          console.log('Received user data from Google auth:', userData);

          // Validate user data
          if (!userData.id || !userData.email) {
            console.error('Invalid user data received:', userData);
            alert('Error: Invalid user data received. Please try logging in again.');
            return;
          }

          // Store user data in localStorage for persistence
          localStorage.setItem('userData', JSON.stringify(userData));

          // Log success
          console.log('Successfully stored user data in localStorage');
        } catch (error) {
          console.error('Error parsing user data:', error);
          alert('Error parsing user data. Please try logging in again.');
          return;
        }
      } else {
        console.error('No user data received from Google auth');
        alert('Error: No user data received. Please try logging in again.');
        return;
      }

      // Clean up URL parameters
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);

      // Sync cart with server
      try {
        syncCartWithServer();
        console.log('Cart synced with server after Google login');
      } catch (error) {
        console.error('Error syncing cart with server:', error);
      }

      // Show success message
      alert('Google login successful!');

      // Reload page to apply authentication
      console.log('Reloading page to apply authentication...');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }

    // Handle regular page reload
    if (location.state?.reload) {
      window.history.replaceState({}, document.title); // prevent infinite reload
      window.location.reload(); // full reload
    }

    // Fetch featured books
    const fetchBooks = async () => {
      try {
        const featuredResponse = await axios.get('https://s89-akhil-bookaura-3.onrender.com/router/featured');
        setFeaturedBooks(featuredResponse.data.data.slice(0, 4)); // Limit to 4 books
      } catch (error) {
        console.log('Failed to fetch featured books:', error);
        console.log(error)
      }
    }
    fetchBooks();

    // Sync cart if needed
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
