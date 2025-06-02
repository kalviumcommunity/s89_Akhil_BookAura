import React, { useState } from 'react';
import './BookDetailView.css';
import Navbar from '../../components/Navbar';
import { ArrowLeft, ShoppingCart, Check, FileText } from 'lucide-react';
import axios from 'axios';
import { useCart } from './cart';
import { SafeImage } from '../../utils/imageUtils';
import SimpleEpubViewer from '../../components/SimpleEpubViewer';

const BookDetailView = ({ book, onClose }) => {
  if (!book) return null;

  const { addToCart, cartItems } = useCart();
  const [showReader, setShowReader] = useState(false);

  // Check if book is already in cart
  const isInCart = cartItems.some(item => item._id === book._id);

  const handleAddToCart = () => {
    addToCart(book);
  };

  const handleReadBook = () => {
    console.log('📖 Opening book for reading:', book.title);
    console.log('📖 EPUB URL:', book.epubUrl || book.url);
    setShowReader(true);
  };

  const handleCloseReader = () => {
    setShowReader(false);
  };

  const handleBuy = async() => {
    try {
        const response = await axios.post(
            'https://s89-akhil-bookaura-3.onrender.com/api/payment/create-checkout-session',
            { book },
            {
                withCredentials: true // This will send cookies with the request
            }
        );

        const { url } = response.data;
        window.location.href = url;
    } catch (error) {
        console.error('Checkout error:', error);
        if (error.response?.status === 401) {
            alert('Please log in to checkout');
            onClose();
        } else {
            alert('There was an error processing your payment. Please try again.');
        }
    }
  };

  // If reader is open, show the EPUB viewer
  if (showReader) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          padding: '10px 20px',
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #dee2e6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{ margin: '0', color: '#495057' }}>📖 {book.title}</h2>
          <button
            onClick={handleCloseReader}
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ✕ Close Reader
          </button>
        </div>
        <div style={{ flex: 1 }}>
          <SimpleEpubViewer
            epubUrl={book.epubUrl || book.url}
            title={book.title}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="book-detail">
      <div className="navbar">
        <Navbar />
      </div>
      <button onClick={onClose} className="go-back-button" ><ArrowLeft/>Back to Books</button>
      <div className="book-detail-content">
        <SafeImage
          className="book-detail-image"
          src={book.coverimage}
          alt={`Cover of ${book.title}`}
        />

        <div className="book-detail-info">
          <h2 className="book-detail-title">{book.title}</h2>
          <p className="book-detail-author">by {book.author}</p>
          <p className="book-detail-price">₹{book.price}</p>
          <span className="book-detail-genre">{book.genre}</span>

          <p className="book-detail-description">
            {book.description || "No description available for this book."}
          </p>

          <div className="book-detail-actions">
            <button className="book-detail-button book-detail-buy" onClick={handleBuy}>Buy Now</button>
            <button
              className={`book-detail-button book-detail-cart ${isInCart ? 'in-cart' : ''}`}
              onClick={handleAddToCart}
              disabled={isInCart}
            >
              {isInCart ? (
                <>
                  <ShoppingCart size={16} /> In Cart
                </>
              ) : (
                'Add to Cart'
              )}
            </button>
            <button
              className="book-detail-button book-detail-read"
              onClick={handleReadBook}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '10px'
              }}
            >
              <FileText size={16} />
              📖 Read Book (Preview)
            </button>
          </div>

          <div className="book-detail-additional">
            <h3 className="book-detail-section-title">Book Details</h3>
            <div className="book-detail-specs">
              <div className="book-detail-spec-item">
                <span className="book-detail-spec-label">Author</span>
                <span className="book-detail-spec-value">{book.author}</span>
              </div>
              <div className="book-detail-spec-item">
                <span className="book-detail-spec-label">Genre</span>
                <span className="book-detail-spec-value">{book.genre}</span>
              </div>
              <div className="book-detail-spec-item">
                <span className="book-detail-spec-label">Price</span>
                <span className="book-detail-spec-value">₹{book.price}</span>
              </div>
              <div className="book-detail-spec-item">
                <span className="book-detail-spec-label">Language</span>
                <span className="book-detail-spec-value">English</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetailView;