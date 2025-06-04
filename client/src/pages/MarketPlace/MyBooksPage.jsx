import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

import { Book, Calendar, ArrowLeft, FileText } from 'lucide-react';
import { SafeImage } from '../../utils/imageUtils';
import './MyBooksPage.css';
import LoadingAnimation from '../../components/LoadingAnimation';
import api from '../../services/api';
import SimpleEpubViewer from '../../components/SimpleEpubViewer';
import DirectGoogleTranslate from '../../components/DirectGoogleTranslate';
import ErrorBoundary from '../../components/ErrorBoundary';


const MyBooksPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupedBooks, setGroupedBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);

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

  const handleReadBook = async (book) => {
    console.log('📖 Opening book:', book.title);
    console.log('📖 Original EPUB URL:', book.epubUrl || book.url);

    // Try to fetch fresh book data from the database
    let bookToRead = book;
    try {
      console.log('🔄 Fetching fresh book data from database...');
      const response = await api.get(`/api/books`);
      const allBooks = response.data || [];

      // Find the book by ID or title
      const freshBook = allBooks.find(dbBook =>
        (dbBook._id === book.bookId) ||
        (dbBook._id === book._id) ||
        (dbBook.title === book.title && dbBook.author === book.author)
      );

      if (freshBook) {
        console.log('✅ Found fresh book data:', freshBook.title);
        console.log('📖 Fresh EPUB URL:', freshBook.epubUrl || freshBook.url);
        bookToRead = {
          ...book,
          epubUrl: freshBook.epubUrl || freshBook.url,
          url: freshBook.url,
          _id: freshBook._id
        };
      } else {
        console.log('⚠️ Could not find fresh book data, using original');
      }
    } catch (error) {
      console.log('⚠️ Error fetching fresh book data:', error.message);
    }

    // Check URL type for logging
    const epubUrl = bookToRead.epubUrl || bookToRead.url;
    if (epubUrl && epubUrl.includes('res.cloudinary.com') && epubUrl.includes('/ebooks/')) {
      console.log('✅ Direct Cloudinary URL detected - should work perfectly');
    } else if (epubUrl && epubUrl.includes('/api/books/file/')) {
      console.log('⚠️ In-memory storage URL detected - may not work after server restart');
    } else if (epubUrl && epubUrl.includes('bookstore/bookFiles')) {
      console.log('⚠️ Old broken Cloudinary URL detected - will use fallback');
    } else {
      console.log('❓ Unknown URL type:', epubUrl);
    }

    setSelectedBook(bookToRead);
  };

  const handleCloseReader = () => {
    setSelectedBook(null);
  };

  // ESC key handler - must be before conditional return
  useEffect(() => {
    if(!selectedBook) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleCloseReader();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedBook]);

  // If a book is selected, show the reader
  if (selectedBook) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Google Translate Widget for Book Reader */}
        <ErrorBoundary>
          <DirectGoogleTranslate position="top-right" />
        </ErrorBoundary>

        <div style={{
          padding: '10px 20px',
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #dee2e6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{ margin: '0', color: '#495057' }}>📖 {selectedBook.title}</h2>
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
            epubUrl={selectedBook.epubUrl || selectedBook.url}
            title={selectedBook.title}
          />
        </div>
      </div>
    );
  }

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
                              onClick={() => handleReadBook(book)}
                            >
                             
                              📖 Read Book
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
