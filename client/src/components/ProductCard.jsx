import React from 'react';
import './ProductCard.css';
import {useCart} from '../pages/MarketPlace/cart'
import { ShoppingCart } from 'lucide-react';
import { SafeImage } from '../utils/imageUtils';

const ProductCard = ({ book }) => {
  const { addToCart, cartItems } = useCart();

  // Check if book is already in cart
  const isInCart = cartItems.some(item => item._id === book._id);

  const handleAddToCart = (e) => {
    e.stopPropagation(); // Prevent triggering parent click events
    addToCart(book);
  };

  return (
    <div className="book-card">
      <div className="image-container">
        <SafeImage
          className="book-cover-image"
          src={book.coverimage}
          alt={`Cover of ${book.title}`}
        />
      </div>
      <div className="book-details">
        <h3 className="book-title">{book.title}</h3>
        <p className="book-author">by {book.author}</p>
        <p className="book-price">₹{book.price}</p>
        <button
          className={`buy-button ${isInCart ? 'in-cart' : ''}`}
          onClick={handleAddToCart}
          disabled={isInCart}
        >
          {isInCart ? (
            <>
              <ShoppingCart size={14} /> In Cart
            </>
          ) : (
            'Add to Cart'
          )}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
