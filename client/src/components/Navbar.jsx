import React, { useState, useEffect } from 'react';
import './Navbar.css';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from '../images/logo.png';
import { ShoppingCart, Calendar } from 'lucide-react';
import { useCart } from '../pages/MarketPlace/cart';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Get the current location
  const [scrolled, setScrolled] = useState(false);
  const { cartCount } = useCart();

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
        
        <li
          className='login'
          onClick={() => navigate('/signup')}
        >
          Create Account
        </li>
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