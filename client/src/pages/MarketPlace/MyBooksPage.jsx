import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

import { Book, Calendar, ArrowLeft, FileText } from 'lucide-react';
import { SafeImage } from '../../utils/imageUtils';
import './MyBooksPage.css';
import LoadingAnimation from '../../components/LoadingAnimation';
import api from '../../services/api';


const MyBooksPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [groupedBooks, setGroupedBooks] = useState([]);

  // Fetch books inside useEffect directly
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const isLoggedIn = document.cookie.includes('isLoggedIn=true') || !!token;

    if (!isLoggedIn) {
      console.log('User is not logged in, redirecting to login page');
      navigate('/login');
      return;
    }

    const fetchPurchasedBooks = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/api/payment/my-purchases');

        if (response.data.success) {
          const bookMap = new Map();
          const processedBooks = [];

          // Process all books but prioritize epub format
          (response.data.purchasedBooks || []).forEach(book => {
            const bookId = book.bookId.toString();
            let processedBook = book;

            // Check if the book has a URL
            if (book.url) {
              // Process the book regardless of format
              processedBook = { ...book };

              if (!bookMap.has(bookId)) {
                bookMap.set(bookId, processedBook);
                processedBooks.push(processedBook);
              }
            }
          });

          // Group by payment ID
          const groupedByPaymentId = {};
          processedBooks.forEach(book => {
            const paymentId = book.paymentId || 'unknown';
            const purchaseDate = book.purchaseDate;

            if (!groupedByPaymentId[paymentId]) {
              groupedByPaymentId[paymentId] = {
                _id: paymentId,
                purchaseDate,
                books: [],
                totalAmount: 0
              };
            }

            groupedByPaymentId[paymentId].books.push(book);
            groupedByPaymentId[paymentId].totalAmount += book.price;
          });

          const groupedArray = Object.values(groupedByPaymentId).sort((a, b) =>
            new Date(b.purchaseDate) - new Date(a.purchaseDate)
          );

          setGroupedBooks(groupedArray);
        } else {
          setError('Failed to fetch your purchased books');
        }
      } catch (error) {
        if (error.response) {
          if (error.response.status === 401) {
            setError('Authentication error. Please log in again.');
            setTimeout(() => navigate('/login'), 2000);
          } else if (error.response.status === 404) {
            setError('No purchased books found.');
          } else {
            setError(`Server error (${error.response.status}): ${error.response.data.message || 'An error occurred.'}`);
          }
        } else if (error.request) {
          setError('Could not connect to server. Check your internet.');
        } else {
          setError('An error occurred while preparing your request.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPurchasedBooks();
  }, [navigate]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <Navbar />
      <div className="my-books-page">
        <div className="my-books-header">
          <h1 className="my-books-title">My Books</h1>
          <p className="my-books-subtitle">Access your purchased books anytime, anywhere</p>
        </div>

        <div className="my-books-content">
          <Link to="/books" className="back-link">
            <ArrowLeft size={16} />
            Back to Marketplace
          </Link>

          {loading ? (
            <div className="loading-container">
              <LoadingAnimation text="Loading your books..." />
            </div>
          ) : error ? (
            <div className="error-container">
              <p className="error-message">{error}</p>
              <p>Please try again or contact support if the problem persists.</p>
              <button
                className="retry-button"
                onClick={() => window.location.reload()}
              >
                <ArrowLeft size={16} style={{ transform: 'rotate(225deg)' }} /> Retry Loading Books
              </button>
            </div>
          ) : groupedBooks.length === 0 ? (
            <div className="empty-books">
              <div className="empty-icon">
                <Book size={64} />
              </div>
              <h2>You haven't purchased any books yet</h2>
              <p>Explore our marketplace to find your next favorite read!</p>
              <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', fontSize: '14px', border: '1px solid #ffeaa7' }}>
                <strong>⚠️ Important Notice:</strong> Due to server limitations, EPUB files are stored temporarily in memory and get cleared when the server restarts.
                <br/><br/>
                <strong>📚 If you can't read your books:</strong>
                <br/>• Upload them again using the "Add Products" page
                <br/>• The system will work perfectly with newly uploaded books
                <br/>• This is a temporary limitation of the current hosting setup
                <br/><br/>
                <strong>🔄 If books don't appear after purchase:</strong>
                <br/>• <button
                  onClick={() => window.location.reload()}
                  style={{
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    padding: '5px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Refresh Page
                </button> to reload your books
              </div>
              <Link to="/books" className="browse-books-btn">
                Browse Books
              </Link>
            </div>
          ) : (
            <div className="purchases-list">
              {groupedBooks.map((purchase) => (
                <div key={purchase._id} className="purchase-card">
                  <div className="purchase-header">
                    <div className="purchase-info">
                      <span className="purchase-date">
                        <Calendar size={14} />
                        {formatDate(purchase.purchaseDate)}
                      </span>
                      <span className="purchase-id">
                        Order #{purchase._id.substring(0, 8)}
                      </span>
                      <span className="purchase-amount">
                        ₹{purchase.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="books-grid">
                    {purchase.books.map((book, index) => (
                      <div key={index} className="book-item">
                        <div className="book-cover">
                          <SafeImage src={book.coverimage} alt={book.title} />
                        </div>
                        <div className="book-info">
                          <h3 className="book-title">{book.title}</h3>
                          <p className="book-author">by {book.author}</p>
                          <div className="book-actions">
                            <button
                              className="read-button"
                              onClick={async () => {
                                const bookId = book.bookId || book._id;
                                console.log("📖 Attempting to read book:", bookId);
                                console.log("📖 Book URL:", book.url);

                                // Check if it's an in-memory storage URL
                                if (book.url?.includes('/api/books/file/')) {
                                  console.log("🔍 Checking if file exists in memory...");
                                  try {
                                    const response = await fetch(book.url, { method: 'HEAD' });
                                    if (response.ok) {
                                      console.log("✅ File exists in memory, proceeding to reader");
                                      navigate(`/reader/${bookId}`);
                                    } else {
                                      console.log("❌ File not found in memory");
                                      const shouldProceed = window.confirm(
                                        '⚠️ This book file is not available (server may have restarted). ' +
                                        'Would you like to try reading it anyway? A sample book will be shown instead.'
                                      );
                                      if (shouldProceed) {
                                        navigate(`/reader/${bookId}`);
                                      }
                                    }
                                  } catch (error) {
                                    console.log("❌ Error checking file:", error);
                                    navigate(`/reader/${bookId}`);
                                  }
                                } else {
                                  // For other URLs, proceed normally
                                  if (book.url && book.url.startsWith('http')) {
                                    const isFromBookFiles = book.url.includes('/bookstore/bookFiles/') ||
                                                           book.url.includes('/bookFiles/') ||
                                                           book.url.includes('/ebooks/');

                                    if (isFromBookFiles) {
                                      console.log("Opening EPUB in reader page:", book.url);
                                      navigate(`/reader/${bookId}`);
                                    } else {
                                      console.log("Opening non-EPUB in new tab:", book.url);
                                      window.open(book.url, '_blank');
                                    }
                                  } else {
                                    alert('This book does not have a valid URL');
                                  }
                                }
                              }}
                            >
                              <FileText size={16} />
                              {book.url && (book.url.includes('/bookstore/bookFiles/') || book.url.includes('/bookFiles/') || book.url.includes('/ebooks/'))
                                ? 'Read Book'
                                : 'Open Book'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>


      </div>
      <Footer />
    </>
  );
};

export default MyBooksPage;
