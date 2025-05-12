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
  const [saveStatus, setSaveStatus] = useState('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState(null);
  const [hasProcessed, setHasProcessed] = useState(false);

  const queryParams = new URLSearchParams(location.search);
  const sessionId = queryParams.get('session_id');
  const purchaseId = queryParams.get('purchase_id');

  useEffect(() => {
    if (!sessionId || !purchaseId || hasProcessed) return;

    const savePurchase = async () => {
      setHasProcessed(true); // ✅ Prevent re-processing
      setSaveStatus('saving');

      try {
        // Verify Stripe session
        const sessionResponse = await axios.get(
          `http://localhost:5000/api/payment/verify-session?sessionId=${sessionId}`,
          { withCredentials: true }
        );

        if (!sessionResponse.data.success) {
          setSaveStatus('error');
          setIsLoading(false);
          return;
        }

        // Check if purchase already exists
        try {
          const verifyResponse = await axios.get(
            `http://localhost:5000/api/payment/verify-purchase?purchaseId=${purchaseId}`,
            { withCredentials: true }
          );

          if (verifyResponse.data.success) {
            setOrderDetails(verifyResponse.data.purchase);
            setSaveStatus('success');
            clearCart(); // ✅ Clear cart only after handling
            setIsLoading(false);
            return;
          }
        } catch {
          // Continue if purchase not found
        }

        if (cartItems.length === 0) {
          setSaveStatus('error');
          setIsLoading(false);
          return;
        }

        const processedCartItems = cartItems.map(book => {
          const requiredFields = ['_id', 'title', 'author', 'coverimage', 'price'];
          const missing = requiredFields.filter(field => !book[field]);
          if (missing.length > 0) throw new Error('Missing book fields');

          return {
            ...book,
            url: book.url || 'https://res.cloudinary.com/dg3i8akzq/raw/upload/v1746792433/bookstore/bookFiles/zspcnbobqoimglk83yz6'
          };
        });

        const response = await axios.post(
          'http://localhost:5000/api/payment/save-purchase',
          {
            sessionId,
            purchaseId,
            books: processedCartItems
          },
          {
            withCredentials: true,
            timeout: 15000
          }
        );

        if (response.data.success) {
          setSaveStatus('success');
          clearCart();
        } else {
          setSaveStatus('error');
        }
      } catch (error) {
        // Retry once if timeout or server error
        if (error.code === 'ECONNABORTED' || (error.response && error.response.status >= 500)) {
          try {
            const retryResponse = await axios.post(
              'http://localhost:5000/api/payment/save-purchase',
              {
                sessionId,
                purchaseId,
                books: cartItems.map(book => ({
                  ...book,
                  url: book.url || 'https://res.cloudinary.com/dg3i8akzq/raw/upload/v1746792433/bookstore/bookFiles/zspcnbobqoimglk83yz6'
                }))
              },
              {
                withCredentials: true,
                timeout: 20000
              }
            );

            if (retryResponse.data.success) {
              setSaveStatus('success');
              clearCart();
            } else {
              setSaveStatus('error');
            }
          } catch {
            setSaveStatus('error');
          }
        } else {
          setSaveStatus('error');
        }
      } finally {
        setIsLoading(false);
      }
    };

    savePurchase();
  }, [sessionId, purchaseId, cartItems, clearCart, hasProcessed]);

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
                <p className="success-message saving">Saving your purchase... Please wait.</p>
              )}

              {saveStatus === 'error' && (
                <>
                  <p className="success-message error">
                    There was an issue saving your purchase. Please contact support with your order ID: {purchaseId}
                  </p>
                  <p className="success-details">
                    Your payment was successful, but we encountered an issue saving your books to your account.
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
