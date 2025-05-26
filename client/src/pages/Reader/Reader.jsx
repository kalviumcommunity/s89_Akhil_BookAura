import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SimpleEpubViewer from '../../epub/SimpleEpubViewer';
import api from '../../services/api';
import './Reader.css';

function Reader() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log("📖 Reader: Loading book with ID:", bookId);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        setError(null);

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
          } else {
            setError('Book not found in your purchases');
          }
        } else {
          setError('Failed to fetch your books');
        }
      } catch (error) {
        console.error('Error fetching book:', error);
        setError('Failed to load book');
      } finally {
        setLoading(false);
      }
    };

    if (bookId) {
      fetchBook();
    }
  }, [bookId]);

  const handleGoBack = () => {
    navigate('/my-books');
  };

  if (loading) {
    return (
      <div className="reader-loading">
        <p>Loading book...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reader-container">
        <div className="reader-header">
          <button onClick={handleGoBack} className="back-button">
            ← Back to My Books
          </button>
          <h1 className="reader-title">Error</h1>
        </div>
        <div className="reader-content">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="reader-loading">
        <p>Book not found...</p>
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
        <SimpleEpubViewer epubUrl={book.url} />
      </div>
    </div>
  );
}

export default Reader;
