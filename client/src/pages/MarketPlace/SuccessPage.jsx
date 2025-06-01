import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, ArrowLeft, ShoppingBag } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useCart } from './cart';
import api from '../../services/api';
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
  const [retryCount, setRetryCount] = useState(0);
  const [autoRetrying, setAutoRetrying] = useState(false);

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
      const verifyResponse = await api.get(
        `/api/payment/verify-purchase?purchaseId=${purchaseId}`
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

    // Try to get cart items from multiple sources
    let itemsToProcess = cartItems;

    // If cart is empty, try to get from localStorage
    if (!itemsToProcess || itemsToProcess.length === 0) {
      console.log('Cart is empty, trying localStorage...');
      try {
        const savedCart = localStorage.getItem('cartItems');
        if (savedCart) {
          itemsToProcess = JSON.parse(savedCart);
          console.log('Found cart items in localStorage:', itemsToProcess.length);
        }
      } catch (error) {
        console.log('Failed to parse localStorage cart:', error);
      }
    }

    // If still empty, try to fetch from server
    if (!itemsToProcess || itemsToProcess.length === 0) {
      console.log('Trying to fetch cart from server...');
      try {
        const cartResponse = await api.get('/api/cart');
        if (cartResponse.data && cartResponse.data.length > 0) {
          itemsToProcess = cartResponse.data;
          console.log('Found cart items on server:', itemsToProcess.length);
        }
      } catch (error) {
        console.log('Failed to fetch cart from server:', error);
      }
    }

    if (!itemsToProcess || itemsToProcess.length === 0) {
      setErrorDetails({
        message: 'Cart is empty. Cannot recover purchase without cart data.',
        suggestion: 'Please try purchasing again or contact support.',
        timestamp: new Date().toISOString()
      });
      setSaveStatus('error');
      setIsLoading(false);
      return;
    }

    try {
      const processedCartItems = itemsToProcess.map(book => {
        const requiredFields = ['_id', 'title', 'author', 'coverimage', 'price'];
        const missing = requiredFields.filter(field => {
          // Special handling for price field - 0 is a valid price
          if (field === 'price') {
            return book[field] === undefined || book[field] === null;
          }
          return !book[field];
        });
        if (missing.length > 0) {
          console.error('Missing book fields:', missing, 'Book:', book);
          throw new Error(`Missing book fields: ${missing.join(', ')}`);
        }

        return {
          ...book,
          url: book.url || 'https://res.cloudinary.com/dg3i8akzq/raw/upload/v1746792433/bookstore/bookFiles/zspcnbobqoimglk83yz6'
        };
      });

      const response = await api.post(
        '/api/payment/save-purchase',
        {
          sessionId: sessionId || 'manual-recovery',
          purchaseId,
          books: processedCartItems
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
        // Check for token in URL (might be present from Google OAuth redirect)
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');

        // If token is in URL, store it for future requests
        if (urlToken) {
          console.log('Found token in URL, storing for authentication');
          localStorage.setItem('authToken', urlToken);

          // Also set a client-side cookie for isLoggedIn status
          document.cookie = `isLoggedIn=true; path=/; max-age=${7 * 24 * 60 * 60}`;
        }

        // Verify Stripe session
        const sessionResponse = await api.get(
          `/api/payment/verify-session?sessionId=${sessionId}`
        );

        if (!sessionResponse.data.success) {
          setSaveStatus('error');
          setIsLoading(false);
          return;
        }

        // Check if purchase already exists
        try {
          const verifyResponse = await api.get(
            `/api/payment/verify-purchase?purchaseId=${purchaseId}`
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

        // Try to get cart items from multiple sources
        let itemsToProcess = cartItems;

        // If cart is empty, try to get from localStorage
        if (!itemsToProcess || itemsToProcess.length === 0) {
          console.log('Cart is empty, trying localStorage...');
          try {
            const savedCart = localStorage.getItem('cartItems');
            if (savedCart) {
              itemsToProcess = JSON.parse(savedCart);
              console.log('Found cart items in localStorage:', itemsToProcess.length);
            }
          } catch (error) {
            console.log('Failed to parse localStorage cart:', error);
          }
        }

        // If still empty, try to fetch from server
        if (!itemsToProcess || itemsToProcess.length === 0) {
          console.log('Trying to fetch cart from server...');
          try {
            const cartResponse = await api.get('/api/cart');
            if (cartResponse.data && cartResponse.data.length > 0) {
              itemsToProcess = cartResponse.data;
              console.log('Found cart items on server:', itemsToProcess.length);
            }
          } catch (error) {
            console.log('Failed to fetch cart from server:', error);
          }
        }

        if (!itemsToProcess || itemsToProcess.length === 0) {
          // Auto-retry once after 2 seconds
          if (retryCount === 0) {
            console.log('Auto-retrying in 2 seconds...');
            setRetryCount(1);
            setAutoRetrying(true);
            setTimeout(() => {
              setAutoRetrying(false);
              savePurchase();
            }, 2000);
            return;
          }

          setSaveStatus('error');
          setErrorDetails({
            message: 'Cart is empty. Cannot save purchase without cart data.',
            suggestion: 'Please try the "Try Again" button or contact support.',
            timestamp: new Date().toISOString()
          });
          setIsLoading(false);
          return;
        }

        const processedCartItems = itemsToProcess.map(book => {
          const requiredFields = ['_id', 'title', 'author', 'coverimage', 'price'];
          const missing = requiredFields.filter(field => {
            // Special handling for price field - 0 is a valid price
            if (field === 'price') {
              return book[field] === undefined || book[field] === null;
            }
            return !book[field];
          });
          if (missing.length > 0) {
            console.error('Missing book fields:', missing, 'Book:', book);
            throw new Error(`Missing book fields: ${missing.join(', ')}`);
          }

          return {
            ...book,
            url: book.url || 'https://res.cloudinary.com/dg3i8akzq/raw/upload/v1746792433/bookstore/bookFiles/zspcnbobqoimglk83yz6'
          };
        });

        // Single attempt to save purchase - no retries
        const response = await api.post(
          '/api/payment/save-purchase',
          {
            sessionId,
            purchaseId,
            books: processedCartItems
          }
        );

        if (response.data.success) {
          setSaveStatus('success');
          clearCart();
        } else {
          setErrorDetails({
            message: 'Server returned error',
            responseData: response.data,
            timestamp: new Date().toISOString()
          });
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
        setSaveStatus('error');
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
          {isLoading || autoRetrying ? (
            <div className="success-loading">
              <LoadingAnimation text={autoRetrying ? "Auto-retrying purchase save..." : "Processing your purchase..."} />
              {autoRetrying && (
                <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                  Attempting to recover cart data and save your purchase...
                </p>
              )}
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
                      className="recovery-button"
                      onClick={recoverPurchase}
                    >
                      Try Again
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
