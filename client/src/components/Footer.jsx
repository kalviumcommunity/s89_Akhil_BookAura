import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Facebook, Twitter, Instagram, Mail, Phone } from 'lucide-react';
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
              <img className="footer-icon" src={logo} alt="" />
              
            </Link>
            <p className="footer-description">
              Your gateway to a world of literary wonders. Discover, explore, and immerse yourself in the magic of books.
            </p>
            <div className="footer-socials">
              <a href="#"><Facebook size={20} /></a>
              <a href="#"><Twitter size={20} /></a>
              <a href="#"><Instagram size={20} /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h3 className="footer-heading">Quick Links</h3>
            <ul className="footer-links">
              <li><Link to="/books">All Books</Link></li>
              <li><Link to="/new-releases">New Releases</Link></li>
              <li><Link to="/bestsellers">Bestsellers</Link></li>
              <li><Link to="/categories">Categories</Link></li>
              <li><Link to="/authors">Authors</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="footer-section">
            <h3 className="footer-heading">Customer Service</h3>
            <ul className="footer-links">
              <li><Link to="/help">Help Center</Link></li>
              <li><Link to="/shipping">Shipping Policy</Link></li>
              <li><Link to="/returns">Returns & Refunds</Link></li>
              <li><Link to="/faq">FAQ</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-section">
            <h3 className="footer-heading">Contact Us</h3>
            <div className="footer-contact">
              <div><Mail size={20} /><span>bookaura.ba@gmail.com</span></div>
              <div><Phone size={20} /><span>+91 918273645</span></div>
            </div>

            <div className="footer-newsletter">
              <h4>Subscribe to our newsletter</h4>
              <div className="footer-newsletter-form">
                <input type="email" placeholder="Your email" />
                <button>Subscribe</button>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Lumina Books. All rights reserved.</p>
          <div className="footer-policies">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/cookies">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
