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
  const [errorDetails, setErrorDetails] = useState(null);

  const queryParams = new URLSearchParams(location.search);
  const sessionId = queryParams.get('session_id');
  const purchaseId = queryParams.get('purchase_id');

  // Function to manually recover a purchase
  const recoverPurchase = async () => {
    if (!purchaseId) {
      alert('No purchase ID available for recovery');
      return;
    }

    setIsLoading(true);
    setSaveStatus('saving');
    setErrorDetails(null);

    try {
      // First check if the purchase already exists
      const verifyResponse = await axios.get(
        `http://localhost:5000/api/payment/verify-purchase?purchaseId=${purchaseId}`,
        { withCredentials: true }
      );

      if (verifyResponse.data.success) {
        setOrderDetails(verifyResponse.data.purchase);
        setSaveStatus('success');
        clearCart();
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.log('Purchase not found, will attempt to create it');
    }

    // If we get here, the purchase doesn't exist and needs to be created
    if (!cartItems || cartItems.length === 0) {
      setErrorDetails({
        message: 'Cart is empty. Cannot recover purchase without cart data.',
        timestamp: new Date().toISOString()
      });
      setSaveStatus('error');
      setIsLoading(false);
      return;
    }

    try {
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
          sessionId: sessionId || 'manual-recovery',
          purchaseId,
          books: processedCartItems
        },
        {
          withCredentials: true,
          timeout: 30000
        }
      );

      if (response.data.success) {
        setSaveStatus('success');
        clearCart();
      } else {
        setErrorDetails({
          message: 'Server returned error during recovery',
          responseData: response.data,
          timestamp: new Date().toISOString()
        });
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Recovery error:', error);
      setErrorDetails({
        message: error.message,
        code: error.code,
        status: error.response?.status,
        responseData: error.response?.data,
        timestamp: new Date().toISOString()
      });
      setSaveStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

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
        console.error('Save purchase error:', error);

        // Store error details for debugging
        const details = {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          responseData: error.response?.data,
          timestamp: new Date().toISOString()
        };

        // Save error details to localStorage for debugging
        localStorage.setItem('lastPurchaseError', JSON.stringify(details));

        // Update state with error details
        setErrorDetails(details);

        // Retry once if timeout or server error
        if (error.code === 'ECONNABORTED' || (error.response && error.response.status >= 500)) {
          console.log('Attempting retry for save-purchase...');
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
              console.log('Retry successful');
              setSaveStatus('success');
              clearCart();
            } else {
              console.error('Retry failed with response:', retryResponse.data);
              setSaveStatus('error');
            }
          } catch (retryError) {
            console.error('Retry error:', retryError);
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

                  {errorDetails && (
                    <div className="error-details">
                      <p>Error: {errorDetails.message}</p>
                      {errorDetails.status && <p>Status: {errorDetails.status}</p>}
                      {errorDetails.code && <p>Code: {errorDetails.code}</p>}
                    </div>
                  )}

                  <div className="recovery-actions">
                    <button
                      className="retry-button"
                      onClick={() => {
                        setIsLoading(true);
                        setSaveStatus('pending');
                        setHasProcessed(false);
                        setErrorDetails(null);
                      }}
                    >
                      Retry Normal Process
                    </button>

                    <button
                      className="recovery-button"
                      onClick={recoverPurchase}
                    >
                      Advanced Recovery
                    </button>
                  </div>
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
