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
  const [cleanupLoading, setCleanupLoading] = useState(false);

  const [groupedBooks, setGroupedBooks] = useState([]);

  // Utility function to detect URL types
  const detectUrlType = (url) => {
    if (!url || !url.startsWith('http')) {
      console.log('🔍 URL Detection: Invalid URL -', url);
      return 'invalid';
    }

    // New in-memory system URLs (both localhost and production)
    if (url.includes('/api/books/file/')) {
      console.log('🔍 URL Detection: New in-memory URL -', url);
      return 'new';
    }

    // Old Cloudinary URLs
    if (url.includes('/bookstore/bookFiles/') ||
        url.includes('/bookFiles/') ||
        url.includes('/ebooks/')) {
      console.log('🔍 URL Detection: Old Cloudinary URL -', url);
      return 'old';
    }

    // Other URLs
    console.log('🔍 URL Detection: Other URL type -', url);
    return 'other';
  };

  // Function to clean up old books
  const cleanupOldBooks = async () => {
    if (!window.confirm(
      '🧹 Clean Up Old Books\n\n' +
      'This will remove all books with old Cloudinary URLs that no longer work.\n\n' +
      '⚠️ Warning: This action cannot be undone!\n\n' +
      'Books with working URLs (new in-memory system) will be kept.\n\n' +
      'Continue with cleanup?'
    )) {
      return;
    }

    try {
      setCleanupLoading(true);
      const response = await api.post('/api/payment/admin/cleanup-old-books');

      if (response.data.success) {
        alert(
          `✅ Cleanup Complete!\n\n` +
          `${response.data.stats.booksRemoved} old books removed from ${response.data.stats.usersAffected} users.\n\n` +
          `The page will now refresh to show your updated library.`
        );
        window.location.reload();
      } else {
        alert('❌ Cleanup failed. Please try again.');
      }
    } catch (error) {
      console.error('Cleanup error:', error);
      alert('❌ Error during cleanup. Please try again or contact support.');
    } finally {
      setCleanupLoading(false);
    }
  };

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h1 className="my-books-title">My Books</h1>
              <p className="my-books-subtitle">Access your purchased books anytime, anywhere</p>
            </div>
            <button
              onClick={cleanupOldBooks}
              disabled={cleanupLoading}
              style={{
                padding: '8px 16px',
                backgroundColor: cleanupLoading ? '#ccc' : '#ff6b6b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: cleanupLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
              title="Remove books with broken old URLs"
            >
              {cleanupLoading ? '🧹 Cleaning...' : '🧹 Clean Old Books'}
            </button>
          </div>
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
                              onClick={() => {
                                const urlType = detectUrlType(book.url);
                                console.log("Book URL:", book.url);
                                console.log("URL Type:", urlType);

                                switch (urlType) {
                                  case 'new':
                                    // New system - navigate to reader with book ID
                                    const bookId = book.bookId || book._id;
                                    console.log("📖 Navigating to reader with book ID:", bookId);
                                    navigate(`/reader/${bookId}`);
                                    break;

                                  case 'old':
                                    // Old Cloudinary system - show warning and try direct URL
                                    console.log("⚠️ Old Cloudinary EPUB detected:", book.url);
                                    const shouldTryAnyway = window.confirm(
                                      `⚠️ This book uses old storage and may not work properly.\n\n` +
                                      `Book: "${book.title}" by ${book.author}\n\n` +
                                      `Options:\n` +
                                      `• Click "OK" to try opening it anyway (may fail)\n` +
                                      `• Click "Cancel" and re-upload this book for best experience\n\n` +
                                      `💡 Tip: Use "Add Products" page to re-upload this book.`
                                    );

                                    if (shouldTryAnyway) {
                                      // Try to open the old URL directly
                                      window.open(book.url, '_blank');
                                    }
                                    break;

                                  case 'other':
                                    // For non-EPUB files, open in a new tab
                                    console.log("Opening non-EPUB in new tab:", book.url);
                                    window.open(book.url, '_blank');
                                    break;

                                  default:
                                    // Invalid or missing URL
                                    alert('This book does not have a valid URL');
                                    break;
                                }
                              }}
                            >
                              <FileText size={16} />
                              {(() => {
                                const urlType = detectUrlType(book.url);
                                switch (urlType) {
                                  case 'new': return 'Read Book';
                                  case 'old': return '⚠️ Read (Old)';
                                  case 'other': return 'Open Book';
                                  default: return 'Invalid URL';
                                }
                              })()}
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
