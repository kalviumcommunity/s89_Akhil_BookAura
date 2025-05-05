import React from 'react';
import './ProductCard.css'; 

const ProductCard = ({ book }) => {
  return (
    <div className="book-card">
      <img className="book-cover" src={book.coverimage} alt={`Cover of ${book.title}`} />
      <div className="book-details">
        <h3 className="book-title">{book.title}</h3>
        <p className="book-author">by {book.author}</p>
        <p className="book-price">₹{book.price}</p>
        <button className="buy-button">Add to Cart</button>
      </div>
    </div>
  );
};

export default ProductCard;
