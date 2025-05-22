import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import EpubViewer from '../../components/EpubViewer';
import SimpleEpubViewer from '../../components/SimpleEpubViewer';
import BasicEpubViewer from '../../components/BasicEpubViewer';
import ErrorBoundary from '../../components/ErrorBoundary';
import { Book, Calendar, ArrowLeft, FileText } from 'lucide-react';
import { SafeImage } from '../../utils/imageUtils';
import './MyBooksPage.css';
import LoadingAnimation from '../../components/LoadingAnimation';
import api from '../../services/api';

const MyBooksPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [groupedBooks, setGroupedBooks] = useState([]);
  const [useSimpleViewer, setUseSimpleViewer] = useState(false);
  const [viewerError, setViewerError] = useState(false);

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
                                if (book.url && book.url.startsWith('http')) {
                                  // Check if it's an EPUB file by extension or content type
                                  const isEpub = book.url.toLowerCase().endsWith('.epub') ||
                                                book.url.toLowerCase().includes('epub');

                                  if (isEpub) {
                                    console.log("Opening EPUB in viewer:", book.url);
                                    // Set viewerError to true to use BasicEpubViewer first
                                    setViewerError(true);
                                    setUseSimpleViewer(false);
                                    setSelectedBook(book.url);
                                  } else {
                                    // For non-EPUB files, open in a new tab
                                    console.log("Opening non-EPUB in new tab:", book.url);
                                    window.open(book.url, '_blank');
                                  }
                                } else {
                                  // Skip books without valid URLs
                                  alert('This book does not have a valid URL');
                                }
                              }}
                            >
                              <FileText size={16} />
                              {book.url && (book.url.toLowerCase().endsWith('.epub') || book.url.toLowerCase().includes('epub'))
                                ? 'Read EPUB'
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

        {selectedBook && (
          <div className="epub-viewer-overlay">
            <div className="epub-viewer-wrapper">
              <div className="epub-viewer-header">
                <h3>Reading EPUB Book</h3>
                <div className="epub-viewer-actions">
                  <div className="viewer-buttons">
                    <button
                      className="switch-viewer-button"
                      onClick={() => {
                        setViewerError(false);
                        setUseSimpleViewer(false);
                      }}
                      style={{
                        marginRight: '10px',
                        backgroundColor: !viewerError && !useSimpleViewer ? '#A67C52' : '#845b32',
                        color: 'white',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Advanced Viewer
                    </button>
                    <button
                      className="switch-viewer-button"
                      onClick={() => {
                        setViewerError(true);
                        setUseSimpleViewer(false);
                      }}
                      style={{
                        marginRight: '10px',
                        backgroundColor: viewerError && !useSimpleViewer ? '#A67C52' : '#845b32',
                        color: 'white',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Basic Viewer
                    </button>
                    <button
                      className="switch-viewer-button"
                      onClick={() => {
                        setUseSimpleViewer(true);
                      }}
                      style={{
                        marginRight: '10px',
                        backgroundColor: useSimpleViewer ? '#A67C52' : '#845b32',
                        color: 'white',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Simple Viewer
                    </button>
                  </div>
                  <button
                    className="close-button"
                    onClick={() => {
                      setSelectedBook(null);
                      setUseSimpleViewer(false);
                      setViewerError(false);
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="epub-viewer-content">
                <div className="epub-viewer-container-wrapper">
                  <ErrorBoundary
                    showDetails={false}
                    onError={() => {
                      console.error("Error in EpubViewer, switching to simple viewer");
                      setViewerError(true);
                      setUseSimpleViewer(true);
                    }}
                  >
                    {useSimpleViewer ? (
                      <SimpleEpubViewer key={`simple-${selectedBook}`} epubUrl={selectedBook} />
                    ) : viewerError ? (
                      <BasicEpubViewer key={`basic-${selectedBook}`} epubUrl={selectedBook} />
                    ) : (
                      <EpubViewer
                        key={`full-${selectedBook}`}
                        epubUrl={selectedBook}
                        onError={() => {
                          console.error("Error in EpubViewer component");
                          setViewerError(true);
                          setUseSimpleViewer(true);
                        }}
                      />
                    )}
                  </ErrorBoundary>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default MyBooksPage;
