import React from 'react';
import './BookDetailView.css';
import Navbar from '../../components/Navbar';
import { ArrowLeft } from 'lucide-react';
import axios from 'axios'

const BookDetailView = ({ book, onClose }) => {
  if (!book) return null;

  const handleBuy = async() => {
    try {
        const response = await axios.post(
            'http://localhost:5000/api/payment/create-checkout-session',
            { book }
          );
          const { url } = response.data;
          window.location.href = url;
    } catch (error) {
        console.log(error)
    }
  };

  return (
    <div className="book-detail">
      <div className="navbar">
        <Navbar />
      </div>
      <button onClick={onClose} className="go-back-button" ><ArrowLeft/>Back to Books</button>
      <div className="book-detail-content">
        <img
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
            <button className="book-detail-button book-detail-cart">Add to Cart</button>
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
