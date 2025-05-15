import React, { useEffect } from 'react';
import './CartPage.css';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useCart } from './cart';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import { SafeImage } from '../../utils/imageUtils';
import LoadingAnimation from '../../components/LoadingAnimation';

const CartPage = () => {
  const { cartItems, removeFromCart, clearCart, refreshCart, totalPrice, isLoading, isLoggedIn } = useCart();

  // Refresh cart when component mounts
  useEffect(() => {
    if (isLoggedIn) {
      console.log('CartPage mounted, refreshing cart...');
      refreshCart();
    }
  }, []);
  const navigate = useNavigate();

  // Calculate tax (10% of total)
  const tax = totalPrice * 0.10;
  // Calculate final total
  const finalTotal = totalPrice + tax;


  const handleBuy = async() => {
    try {
        // Check if cart is empty
        if (cartItems.length === 0) {
            alert('Your cart is empty. Add some books before checking out.');
            return;
        }

        // Send all books in the cart to the checkout using our API service
        const response = await api.post(
            '/api/payment/create-checkout-session',
            { books: cartItems }
        );

        const { url } = response.data;
        window.location.href = url;
    } catch (error) {
        console.error('Checkout error:', error);
        if (error.response?.status === 401) {
            alert('Please log in to checkout');
            navigate('/login');
        } else {
            alert('There was an error processing your payment. Please try again.');
        }
    }
  };

  return (
    <>
      <Navbar />
      <div className="cart-page">
        <div className="cart-container">
          <div className="cart-header">
            <h1 className="cart-title">Your Cart</h1>
            {isLoading ? (
              <p className="cart-subtitle">Loading your cart...</p>
            ) : (
              <p className="cart-subtitle">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart</p>
            )}
          </div>

          {isLoading ? (
            <div className="loading-cart">
              <LoadingAnimation text="Loading your cart..." />
            </div>
          ) : cartItems.length === 0 ? (
            <div className="empty-cart">
              <div className="empty-cart-icon">
                <ShoppingBag size={64} />
              </div>
              <h2>Your cart is empty</h2>
              <p>Looks like you haven't added any books to your cart yet.</p>
              <Link to="/books" className="continue-shopping">
                <ArrowLeft size={16} />
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="cart-content">
              <div className="cart-items">
                {cartItems.map((item) => (
                  <div className="cart-item" key={item._id}>
                    <div className="cart-item-image">
                      <SafeImage src={item.coverimage} alt={item.title} />
                    </div>
                    <div className="cart-item-details">
                      <h3 className="cart-item-title">{item.title}</h3>
                      <p className="cart-item-author">by {item.author}</p>
                      <p className="cart-item-price">₹{item.price}</p>
                    </div>
                    <button
                      className="remove-item"
                      onClick={async () => {
                        const itemId = item._id || item.bookId;
                        console.log('Removing item with ID:', itemId);
                        await removeFromCart(itemId);

                        // Refresh cart after removal to ensure UI is in sync with server
                        if (isLoggedIn) {
                          console.log('Refreshing cart after item removal');
                          setTimeout(() => refreshCart(), 300); // Small delay to ensure server has time to process
                        }
                      }}
                      aria-label="Remove item"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="cart-summary">
                <h2 className="summary-title">Order Summary</h2>

                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>₹{totalPrice.toFixed(2)}</span>
                </div>



                <div className="summary-divider"></div>

                <div className="summary-row total">
                  <span>Total</span>
                  <span>₹{totalPrice.toFixed(2)}</span>
                </div>

                <button
                  className="checkout-button"
                  onClick={handleBuy}
                  disabled={cartItems.length === 0}
                >
                  Proceed to Checkout
                </button>

                <button
                  className="clear-cart"
                  onClick={async () => {
                    console.log('Clearing cart...');
                    await clearCart();

                    // Refresh cart after clearing to ensure UI is in sync with server
                    if (isLoggedIn) {
                      console.log('Refreshing cart after clearing');
                      setTimeout(() => refreshCart(), 300); // Small delay to ensure server has time to process
                    }
                  }}
                >
                  Clear Cart
                </button>

                <Link to="/books" className="continue-shopping-link">
                  <ArrowLeft size={16} />
                  Continue Shopping
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CartPage;
