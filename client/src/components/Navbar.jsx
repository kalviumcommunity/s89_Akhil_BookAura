import React, { useState, useEffect } from 'react';
import './Navbar.css';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from '../images/logo.png';
import { ShoppingCart, Calendar, User } from 'lucide-react';
import { useCart } from '../pages/MarketPlace/cart';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Get the current location
  const [scrolled, setScrolled] = useState(false);
  const { cartCount } = useCart();
  const { isLoggedIn } = useAuth();
  const [userName,setUserName] = useState('');

  // Add scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    // Clean up the event listener when component unmounts
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const [profileImage, setProfileImage] = useState('https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png');

  // Fetch profile image when component mounts if user is logged in
  useEffect(() => {
    const fetchProfileImage = async () => {
      if (isLoggedIn) {
        try {
          const response = await axios.get('http://localhost:5000/router/profile-image', {
            withCredentials: true
          });
          if (response.data.success) {
            setProfileImage(response.data.profileImage);
            setUserName(response.data.username);
          }
        } catch (error) {
          // Only log the error if it's not a 401 Unauthorized (expected when not logged in)
          if (error.response && error.response.status !== 401) {
            console.error('Error fetching profile image:', error);
          }
        }
      }
    };

    fetchProfileImage();
  }, [isLoggedIn]);

  return (
    <div className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className='left' onClick={() => navigate('/home')}>
        <img src={Logo} alt="logo" className='logo' />
      </div>
      <ul className='right'>
        <li
          className={location.pathname === '/home' ? 'active' : 'notactive'} // Highlight Home
          onClick={() => navigate('/home')}
        >
          Home
        </li>
        <li
          className={location.pathname === '/marketplace' ? 'active' : 'notactive'} // Highlight Marketplace
          onClick={() => navigate('/marketplace')}
        >
          Marketplace
        </li>
        <li
          className={location.pathname === '/my-books' ? 'active' : 'notactive'} // Highlight My Books
          onClick={() => navigate('/my-books')}
        >
          My Books
        </li>
        <li
        className={location.pathname === '/studyhome' ? 'active' : 'notactive'}
        onClick={() => navigate('/studyhome')}
        >
          StudyHub
        </li>

        {!isLoggedIn && (
          <li
            className='login'
            onClick={() => navigate('/signup')}
          >
            Create Account
          </li>
        )}
        {isLoggedIn && (
          <li className="display-flex flex-direction-column align-items-center">
            <img
              src={profileImage}
              alt="Profile"
              className="rounded-full border border-black "
              height='30px'
              width={'30px'}
              onClick={() => navigate('/profile')}
              style={{ cursor: 'pointer' }}
            />
            <span className="username">Hi, {userName}</span>
          </li>
        )}
        

        <li
          className='cart-icon'
          onClick={() => navigate('/cart')}
        >
          <ShoppingCart size={20} />
          {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
        </li>

        
      </ul>
    </div>
  );
};

export default Navbar;