import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, ArrowLeft, ShoppingBag } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useCart } from './cart';
import axios from 'axios';
import './SuccessPage.css';
import LoadingAnimation from '../../components/LoadingAnimation';

const SuccessPage = () => {
  const location = useLocation();
  const { cartItems, clearCart } = useCart();
  const [saveStatus, setSaveStatus] = useState('pending'); // pending, saving, success, error
  const [isLoading, setIsLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState(null);

  // Get query parameters
  const queryParams = new URLSearchParams(location.search);
  const sessionId = queryParams.get('session_id');
  const purchaseId = queryParams.get('purchase_id');

  // Save the purchase to the database
  useEffect(() => {
    const savePurchase = async () => {
      try {
        // Always set to saving state first
        setSaveStatus('saving');
        console.log('Processing purchase with sessionId:', sessionId);
        console.log('Purchase ID:', purchaseId);

        // If we don't have both session ID and purchase ID, we can't proceed
        if (!sessionId || !purchaseId) {
          console.error('Missing session ID or purchase ID');
          setSaveStatus('error');
          setIsLoading(false);
          return;
        }

        // First, verify the Stripe session is valid and payment was successful
        try {
          console.log('Verifying Stripe session...');
          const sessionResponse = await axios.get(
            `http://localhost:5000/api/payment/verify-session?sessionId=${sessionId}`,
            { withCredentials: true }
          );

          if (!sessionResponse.data.success) {
            console.error('Session verification failed:', sessionResponse.data);
            setSaveStatus('error');
            setIsLoading(false);
            return;
          }

          console.log('Session verified successfully:', sessionResponse.data);
        } catch (sessionError) {
          console.error('Error verifying session:', sessionError);
          // Continue anyway - we'll try to save the purchase
        }

        // Check if purchase already exists
        try {
          console.log('Checking if purchase already exists...');
          const verifyResponse = await axios.get(
            `http://localhost:5000/api/payment/verify-purchase?purchaseId=${purchaseId}`,
            { withCredentials: true }
          );

          if (verifyResponse.data.success) {
            console.log('Purchase already saved in database');
            setOrderDetails(verifyResponse.data.purchase);
            setSaveStatus('success');
            clearCart(); // Clear cart even if purchase was already saved
            setIsLoading(false);
            return;
          }
        } catch (verifyError) {
          console.log('Purchase not found, will create a new one');
          // Continue with normal flow - the purchase might not be saved yet
        }

        // If cart is empty, we need to redirect to an error page
        if (cartItems.length === 0) {
          console.error('Cart is empty and purchase not found in database');
          setSaveStatus('error');
          setIsLoading(false);
          return;
        }

        console.log('Cart items:', JSON.stringify(cartItems));

        // Check if cart items have all required fields
        const requiredFields = ['_id', 'title', 'author', 'coverimage', 'price'];
        let hasErrors = false;

        // Create a new array with all required fields, adding url if missing
        const processedCartItems = cartItems.map(book => {
          const missing = requiredFields.filter(field => !book[field]);
          if (missing.length > 0) {
            console.error(`Book ${book.title || 'unknown'} is missing fields:`, missing);
            hasErrors = true;
            return book;
          }

          // If url is missing, add a placeholder
          if (!book.url) {
            console.warn(`Book ${book.title} is missing url field, adding placeholder`);
            return { ...book, url: 'https://res.cloudinary.com/dg3i8akzq/raw/upload/v1746792433/bookstore/bookFiles/zspcnbobqoimglk83yz6' };
          }

          return book;
        });

        if (hasErrors) {
          console.error('Some books are missing required fields');
          setSaveStatus('error');
          setIsLoading(false);
          return;
        }

        // Send the purchase data to the server
        console.log('Sending purchase data to server...');
        const response = await axios.post(
          'http://localhost:5000/api/payment/save-purchase',
          {
            sessionId,
            purchaseId,
            books: processedCartItems
          },
          {
            withCredentials: true,
            timeout: 15000 // Increase timeout to 15 seconds
          }
        );

        console.log('Server response:', response.data);

        if (response.data.success) {
          setSaveStatus('success');
          // Clear the cart after successful save
          clearCart();
          setIsLoading(false);
        } else {
          setSaveStatus('error');
          console.error('Failed to save purchase:', response.data);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error saving purchase:', error);
        console.error('Error details:', error.response?.data || error.message);

        // Try again once after a short delay
        if (error.code === 'ECONNABORTED' || (error.response && error.response.status >= 500)) {
          console.log('Server error or timeout detected. Retrying after 2 seconds...');

          setTimeout(async () => {
            try {
              console.log('Retrying purchase save...');
              const retryResponse = await axios.post(
                'http://localhost:5000/api/payment/save-purchase',
                {
                  sessionId,
                  purchaseId,
                  books: cartItems.map(book => {
                    // If url is missing, add a placeholder
                    if (!book.url) {
                      return { ...book, url: 'https://res.cloudinary.com/dg3i8akzq/raw/upload/v1746792433/bookstore/bookFiles/zspcnbobqoimglk83yz6' };
                    }
                    return book;
                  })
                },
                {
                  withCredentials: true,
                  timeout: 20000 // Increase timeout for retry
                }
              );

              console.log('Retry server response:', retryResponse.data);

              if (retryResponse.data.success) {
                setSaveStatus('success');
                clearCart();
                console.log('Retry successful!');
              } else {
                console.error('Retry failed:', retryResponse.data);
                setSaveStatus('error');
              }
            } catch (retryError) {
              console.error('Retry error:', retryError);
              setSaveStatus('error');
            } finally {
              setIsLoading(false);
            }
          }, 2000);
        } else {
          setSaveStatus('error');
          setIsLoading(false);
        }
      }
    };

    savePurchase();
  }, [sessionId, purchaseId, cartItems, clearCart]);

  return (
    <>
      <Navbar />
      <div className="success-page">
        <div className="success-container">
          {isLoading ? (
            <div className="success-loading">
              <LoadingAnimation text="Processing your purchase..." />
            </div>
          ) : (
            <>
              <div className="success-icon">
                <CheckCircle size={80} color={saveStatus === 'error' ? '#f44336' : '#4CAF50'} />
              </div>
              <h1 className="success-title">
                {saveStatus === 'error' ? 'Payment Processing Issue' : 'Payment Successful!'}
              </h1>

              {saveStatus === 'saving' && (
                <p className="success-message saving">
                  Saving your purchase... Please wait.
                </p>
              )}

              {saveStatus === 'error' && (
                <>
                  <p className="success-message error">
                    There was an issue saving your purchase. Please contact support with your order ID: {purchaseId}
                  </p>
                  <p className="success-details">
                    Your payment was successful, but we encountered an issue saving your books to your account.
                    Our support team will help resolve this issue.
                  </p>
                </>
              )}

              {saveStatus === 'success' && (
                <>
                  <p className="success-message">
                    Thank you for your purchase. Your order has been successfully processed and saved to your account.
                  </p>
                  <p className="success-details">
                    You can now access your purchased books in the "My Books" section.
                  </p>
                  {orderDetails && (
                    <div className="order-summary">
                      <h3>Order Summary</h3>
                      <p>Order ID: {orderDetails._id}</p>
                      {orderDetails.totalAmount && (
                        <p>Total Amount: ₹{orderDetails.totalAmount.toFixed(2)}</p>
                      )}
                      {orderDetails.bookCount && (
                        <p>Books Purchased: {orderDetails.bookCount}</p>
                      )}
                      {orderDetails.purchaseDate && (
                        <p>Purchase Date: {new Date(orderDetails.purchaseDate).toLocaleString()}</p>
                      )}
                    </div>
                  )}
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
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SuccessPage;
