import React, { useState } from 'react';
import './ProductCard.css';
import {useCart} from '../pages/MarketPlace/cart'
import { ShoppingCart } from 'lucide-react';
import { SafeImage } from '../utils/imageUtils';
import { getAuthHeaders } from '../utils/authUtils';
import { processBookCoverUrl } from '../utils/bookImageUtils';

const ProductCard = ({ book }) => {
  const { addToCart, cartItems } = useCart();
  const [imageError, setImageError] = useState(false);

  // Check if book is already in cart
  const isInCart = cartItems.some(item => item._id === book._id);

  const handleAddToCart = (e) => {
    e.stopPropagation(); // Prevent triggering parent click events

    // Add authentication headers for cart operations
    const headers = getAuthHeaders();
    console.log('Adding to cart with auth headers:', headers);

    addToCart(book);
  };

  // Handle image loading errors
  const handleImageError = () => {
    setImageError(true);
  };

  // Get image source with fallback using utility function
  const getImageSrc = () => {
    if (imageError) {
      return 'https://dummyimage.com/300x400/f0f0f0/666666&text=Book+Cover';
    }

    // Use the utility function to process the book cover URL
    return processBookCoverUrl(book.coverimage, book.title);
  };

  return (
    <div className="book-card">
      <div className="image-container">
        <SafeImage
          className="book-cover-image"
          src={getImageSrc()}
          alt={`Cover of ${book.title}`}
          onError={handleImageError}
          style={{
            backgroundColor: imageError ? '#f0f0f0' : 'transparent'
          }}
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
