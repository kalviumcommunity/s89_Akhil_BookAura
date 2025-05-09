import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, ArrowLeft, ShoppingBag } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useCart } from './cart';
import axios from 'axios';
import './SuccessPage.css';

const SuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, clearCart } = useCart();
  const [saveStatus, setSaveStatus] = useState('pending'); // pending, success, error

  // Get query parameters
  const queryParams = new URLSearchParams(location.search);
  const sessionId = queryParams.get('session_id');
  const purchaseId = queryParams.get('purchase_id');

  // Save the purchase to the database
  useEffect(() => {
    const savePurchase = async () => {
      if (sessionId && purchaseId && cartItems.length > 0) {
        try {
          setSaveStatus('saving');

          // Send the purchase data to the server
          const response = await axios.post(
            'http://localhost:5000/api/payment/save-purchase',
            {
              sessionId,
              purchaseId,
              books: cartItems
            },
            {
              withCredentials: true
            }
          );

          if (response.data.success) {
            setSaveStatus('success');
            // Clear the cart after successful save
            clearCart();
          } else {
            setSaveStatus('error');
            console.error('Failed to save purchase:', response.data);
          }
        } catch (error) {
          setSaveStatus('error');
          console.error('Error saving purchase:', error);
        }
      } else if (cartItems.length === 0) {
        // If cart is already empty, assume purchase was already saved
        setSaveStatus('success');
      }
    };

    savePurchase();
  }, [sessionId, purchaseId, cartItems, clearCart]);

  return (
    <>
      <Navbar />
      <div className="success-page">
        <div className="success-container">
          <div className="success-icon">
            <CheckCircle size={80} />
          </div>
          <h1 className="success-title">Payment Successful!</h1>

          {saveStatus === 'saving' && (
            <p className="success-message saving">
              Saving your purchase... Please wait.
            </p>
          )}

          {saveStatus === 'error' && (
            <p className="success-message error">
              There was an issue saving your purchase. Please contact support with your order ID: {purchaseId}
            </p>
          )}

          {saveStatus === 'success' && (
            <>
              <p className="success-message">
                Thank you for your purchase. Your order has been successfully processed and saved to your account.
              </p>
              <p className="success-details">
                You will receive an email confirmation shortly with your order details.
              </p>
            </>
          )}

          <div className="success-actions">
            <Link to="/books" className="back-to-shop">
              <ArrowLeft size={18} />
              Continue Shopping
            </Link>
            <Link to="/my-books" className="view-orders">
              <ShoppingBag size={18} />
              View My Books
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SuccessPage;
