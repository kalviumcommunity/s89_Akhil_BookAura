import React from 'react';
import { Link } from 'react-router-dom';
import { XCircle, ArrowLeft, ShoppingBag } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import './CancelPage.css';

const CancelPage = () => {
  return (
    <>
      <Navbar />
      <div className="cancel-page">
        <div className="cancel-container">
          <div className="cancel-icon">
            <XCircle size={80} />
          </div>
          <h1 className="cancel-title">Payment Cancelled</h1>
          <p className="cancel-message">
            Your payment was cancelled and no charges were made to your account.
          </p>
          <p className="cancel-details">
            Your items are still in your cart if you'd like to complete your purchase later.
          </p>
          <div className="cancel-actions">
            <Link to="/books" className="back-to-shop">
              <ArrowLeft size={18} />
              Continue Shopping
            </Link>
            <Link to="/cart" className="view-cart">
              <ShoppingBag size={18} />
              Return to Cart
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CancelPage;
