import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';
import { FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';
import './Footer.css';
import logo from '../images/logo.png';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Logo and about */}
          <div className="footer-section">
            <Link to="/" className="footer-logo">
              <img className="footer-icon" src={logo} alt="BookAura Logo" />
            </Link>
            <p className="footer-description">
              Your gateway to literary wonders. Discover and explore the magic of books.
            </p>
            <div className="footer-socials">
              <a href="#"><FaFacebook /></a>
              <a href="#"><FaTwitter /></a>
              <a href="#"><FaInstagram /></a>
            </div>
          </div>
          <div className="footer-section">
            <h3 className="footer-heading">Contact Us</h3>
            <div className="footer-contact">
              <div><Mail /><span>bookaura.ba@gmail.com</span></div>
              <div><Phone /><span>+91 918273645</span></div>
            </div>

            <div className="footer-newsletter">
              <h4>Subscribe to newsletter</h4>
              <div className="footer-newsletter-form">
                <input type="email" placeholder="Your email" />
                <button>Subscribe</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
