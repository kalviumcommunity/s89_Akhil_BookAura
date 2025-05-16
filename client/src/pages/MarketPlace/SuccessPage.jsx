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

    // Get userId from localStorage if available
    const userId = localStorage.getItem('userId');
    console.log('User login status for recovery:', localStorage.getItem('authToken') ? 'Logged in' : 'Not logged in');

    try {
      // First check if the purchase already exists
      const verifyResponse = await axios.get(
        `https://s89-akhil-bookaura-3.onrender.com/api/payment/verify-purchase?purchaseId=${purchaseId}${userId ? `&userId=${userId}` : ''}`,
        {
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
          }
        }
      );

      if (verifyResponse.data.success) {
        console.log('Purchase found during recovery:', verifyResponse.data.purchase);

        // If the purchase has a userId and we don't have it in localStorage, save it
        if (verifyResponse.data.purchase.userId && !userId) {
          localStorage.setItem('userId', verifyResponse.data.purchase.userId);
        }

        setOrderDetails(verifyResponse.data.purchase);
        setSaveStatus('success');
        clearCart();
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.log('Purchase not found, will attempt to create it:', error.message);
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

      // Get userId from localStorage or other sources
      let recoveryUserId = localStorage.getItem('userId');

      // If we don't have a userId, try to get it from the purchase
      if (!recoveryUserId && verifyResponse?.data?.purchase?.userId) {
        recoveryUserId = verifyResponse.data.purchase.userId;
        localStorage.setItem('userId', recoveryUserId);
        console.log('Using userId from purchase:', recoveryUserId);
      }

      console.log('Saving purchase during recovery for user:', recoveryUserId);

      const response = await axios.post(
        'https://s89-akhil-bookaura-3.onrender.com/api/payment/save-purchase',
        {
          sessionId: sessionId || 'manual-recovery',
          purchaseId,
          books: processedCartItems,
          userId: recoveryUserId // Include userId in the request
        },
        {
          withCredentials: true,
          timeout: 30000,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
          }
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

      // Get userId from localStorage if available
      const userId = localStorage.getItem('userId');
      console.log('User login status:', localStorage.getItem('authToken') ? 'Logged in' : 'Not logged in');

      try {
        // Verify Stripe session
        // Ensure userId is defined before adding it to the URL
        const userIdParam = userId ? `&userId=${userId}` : '';

        const sessionResponse = await axios.get(
          `https://s89-akhil-bookaura-3.onrender.com/api/payment/verify-session?sessionId=${sessionId}${userIdParam}`,
          {
            withCredentials: true,
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
            }
          }
        );

        if (!sessionResponse.data.success) {
          console.log('Session verification failed:', sessionResponse.data);
          setSaveStatus('error');
          setIsLoading(false);
          return;
        }

        // Get userId from session if not available in localStorage
        const sessionUserId = sessionResponse.data.session.userId;
        if (sessionUserId && !userId) {
          console.log('Using userId from session:', sessionUserId);
          localStorage.setItem('userId', sessionUserId);
        }

        // Check if purchase already exists
        try {
          // Safely construct the userId parameter
          let verifyUserIdParam = '';
          try {
            const verifyUserId = userId || sessionResponse?.data?.session?.userId;
            if (verifyUserId) {
              verifyUserIdParam = `&userId=${verifyUserId}`;
            }
          } catch (err) {
            console.log('Error constructing userId param:', err.message);
          }

          try {
            const verifyResponse = await axios.get(
              `https://s89-akhil-bookaura-3.onrender.com/api/payment/verify-purchase?purchaseId=${purchaseId}${verifyUserIdParam}`,
              {
                withCredentials: true,
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
                }
              }
            );

            if (verifyResponse.data.success) {
              console.log('Purchase already exists:', verifyResponse.data.purchase);
              setOrderDetails(verifyResponse.data.purchase);
              setSaveStatus('success');
              clearCart(); // ✅ Clear cart only after handling
              setIsLoading(false);
              return;
            }
          } catch (verifyError) {
            // If we get a 404, it means the purchase doesn't exist yet, which is expected
            // We'll continue with creating it
            if (verifyError.response?.status === 404) {
              console.log('Purchase not found (404), will create a new one');
            } else {
              // For other errors, log but continue
              console.error('Purchase verification error:', verifyError.message, verifyError.response?.status);
            }
          }
        } catch (error) {
          console.log('Purchase verification outer error:', error.message);
          // Continue if purchase not found
        }

        if (cartItems.length === 0) {
          console.log('Cart is empty, cannot save purchase');
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

        // Update userId with session data if available
        let updatedUserId = userId;

        try {
          // Safely access session userId
          if (sessionResponse?.data?.session?.userId) {
            updatedUserId = updatedUserId || sessionResponse.data.session.userId;

            // Store userId in localStorage if we got it from the session
            if (!userId && updatedUserId) {
              localStorage.setItem('userId', updatedUserId);
              console.log('Stored userId from session:', updatedUserId);
            }
          }
        } catch (err) {
          console.log('Error accessing session userId:', err.message);
        }

        // Fallback if we still don't have a userId
        if (!updatedUserId) {
          console.log('No userId available, using fallback');
          // Try to extract from URL if present in query params
          const urlParams = new URLSearchParams(window.location.search);
          const urlUserId = urlParams.get('user_id');
          if (urlUserId) {
            updatedUserId = urlUserId;
            localStorage.setItem('userId', urlUserId);
            console.log('Using userId from URL:', urlUserId);
          }
        }

        console.log('Saving purchase for user:', updatedUserId);

        const response = await axios.post(
          'https://s89-akhil-bookaura-3.onrender.com/api/payment/save-purchase',
          {
            sessionId,
            purchaseId,
            books: processedCartItems,
            userId: updatedUserId // Include userId in the request
          },
          {
            withCredentials: true,
            timeout: 15000,
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
            }
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
            // Use the same userId or get it again if needed
            let retryUserId = userId;

            try {
              // Safely access session userId
              if (sessionResponse?.data?.session?.userId) {
                retryUserId = retryUserId || sessionResponse.data.session.userId;
              }
            } catch (err) {
              console.log('Error accessing session userId during retry:', err.message);
            }

            // If we still don't have a userId, try to get it from localStorage again
            if (!retryUserId) {
              retryUserId = localStorage.getItem('userId');
              console.log('Retry using userId from localStorage:', retryUserId);
            }

            console.log('Retrying save purchase for user:', retryUserId);

            const retryResponse = await axios.post(
              'https://s89-akhil-bookaura-3.onrender.com/api/payment/save-purchase',
              {
                sessionId,
                purchaseId,
                books: cartItems.map(book => ({
                  ...book,
                  url: book.url || 'https://res.cloudinary.com/dg3i8akzq/raw/upload/v1746792433/bookstore/bookFiles/zspcnbobqoimglk83yz6'
                })),
                userId: retryUserId // Include userId in the request
              },
              {
                withCredentials: true,
                timeout: 20000,
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
                }
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
