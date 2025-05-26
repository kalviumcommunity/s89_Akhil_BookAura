import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FastEpubViewer from '../../epub/FastEpubViewer';
import api from '../../services/api';
import './Reader.css';

function Reader() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);

  console.log("📖 Reader: Loading book with ID:", bookId);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        // Fetch book data from your purchased books
        const response = await api.get('/api/payment/my-purchases');

        if (response.data.success) {
          // Find the book with matching ID
          const foundBook = response.data.purchasedBooks.find(book =>
            book.bookId.toString() === bookId || book._id === bookId
          );

          if (foundBook) {
            setBook(foundBook);
            console.log("📖 Book found:", foundBook);
          }
        }
      } catch (error) {
        console.error('Error fetching book:', error);
      }
    };

    if (bookId) {
      fetchBook();
    }
  }, [bookId]);

  const handleGoBack = () => {
    navigate('/my-books');
  };

  if (!book) {
    return (
      <div className="reader-loading">
        <p>Loading book...</p>
      </div>
    );
  }

  return (
    <div className="reader-container">
      <div className="reader-header">
        <button onClick={handleGoBack} className="back-button">
          ← Back to My Books
        </button>
        <h1 className="reader-title">{book.title} by {book.author}</h1>
      </div>

      <div className="reader-content">
        <FastEpubViewer epubUrl={book.url} />
      </div>
    </div>
  );
}

export default Reader;
