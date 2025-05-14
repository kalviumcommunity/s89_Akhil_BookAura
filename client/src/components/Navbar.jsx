import React, { useState, useEffect, useRef } from 'react';
import './Navbar.css';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from '../images/logo.png';
import { ShoppingCart, Home, BookOpen, GraduationCap, Menu, X } from 'lucide-react';
import { useCart } from '../pages/MarketPlace/cart';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Get the current location
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { cartCount } = useCart();
  const { isLoggedIn } = useAuth();
  const [userName, setUserName] = useState('');
  const menuRef = useRef(null);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    // When opening the menu, prevent scrolling on the body
    if (!mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  };

  // Close mobile menu when navigating
  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
    document.body.style.overflow = 'auto';
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuOpen && menuRef.current && !menuRef.current.contains(event.target) &&
          !event.target.closest('.mobile-menu-toggle')) {
        setMobileMenuOpen(false);
        document.body.style.overflow = 'auto';
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Reset overflow when component unmounts
      document.body.style.overflow = 'auto';
    };
  }, [mobileMenuOpen]);

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
    <div className={`navbar ${scrolled ? 'scrolled' : ''} ${mobileMenuOpen ? 'menu-open' : ''}`}>
      <div className='left' onClick={() => handleNavigation('/')}>
        <img src={Logo} alt="logo" className='logo' />
      </div>

      {/* Desktop and Mobile Navigation */}
      <ul className={`right ${mobileMenuOpen ? 'show-mobile-menu' : ''}`} ref={menuRef}>
        <li
          className={location.pathname === '/' ? 'active' : 'notactive'} // Highlight Home
          onClick={() => handleNavigation('/')}
        >
          
          Home
        </li>
        <li
          className={location.pathname === '/marketplace' ? 'active' : 'notactive'} // Highlight Marketplace
          onClick={() => handleNavigation('/marketplace')}
        >
          Marketplace
        </li>
        <li
          className={location.pathname === '/my-books' ? 'active' : 'notactive'} // Highlight My Books
          onClick={() => handleNavigation('/my-books')}
        >
          My Books
        </li>
        <li
          className={location.pathname === '/studyhome' ? 'active' : 'notactive'}
          onClick={() => handleNavigation('/studyhome')}
        >
          StudyHub
        </li>

        {/* Close button for mobile menu */}
        <li className="close-mobile-menu" onClick={toggleMobileMenu}>
          <X size={24} />
        </li>
      </ul>

      {/* Always visible elements on the right */}
      <div className="always-visible-items">
        {!isLoggedIn && (
          <div
            className='login'
            onClick={() => handleNavigation('/signup')}
          >
            Create Account
          </div>
        )}
        {isLoggedIn && (
          <div
            className="profile-item display-flex flex-direction-column align-items-center gap-2"
            onClick={() => handleNavigation('/profile')}
          >
            <img
              src={profileImage}
              alt="Profile"
              className="rounded-full border border-black"
              height='30px'
              width={'30px'}
              style={{ cursor: 'pointer' }}
            />
            <span className="username">Hi, {userName}</span>
          </div>
        )}

        {/* Cart icon - always visible */}
        <div className='cart-icon' onClick={() => handleNavigation('/cart')}>
          <ShoppingCart size={20} />
          {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
        </div>

        {/* Mobile menu toggle button */}
        <div className="mobile-menu-toggle" onClick={toggleMobileMenu}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </div>
      </div>
    </div>
  );
};

export default Navbar;