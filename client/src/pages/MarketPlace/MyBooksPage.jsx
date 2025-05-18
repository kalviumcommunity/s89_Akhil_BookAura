import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import BasicPdfViewer from '../../components/BasicPdfViewer';
import ErrorBoundary from '../../components/ErrorBoundary';
import { Book, Calendar, ArrowLeft, FileText } from 'lucide-react';
import { SafeImage } from '../../utils/imageUtils';
import './MyBooksPage.css';
import LoadingAnimation from '../../components/LoadingAnimation';
import api from '../../services/api';

const MyBooksPage = () => {
  const navigate = useNavigate();
  const [purchasedBooks, setPurchasedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [groupedBooks, setGroupedBooks] = useState([]);

  // Define fetchPurchasedBooks outside useEffect so it can be called from retry button
  const fetchPurchasedBooks = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      console.log('Fetching purchased books...');

      // Get token from localStorage for debugging
      const token = localStorage.getItem('authToken');
      console.log('Auth token from localStorage:', token ? 'Present' : 'Missing');

      // Check for cookies
      console.log('Cookies present:', document.cookie ? 'Yes' : 'No');

      // Log authentication status for debugging
      console.log('Checking authentication status...');
      const hasToken = localStorage.getItem('authToken');
      const hasCookie = document.cookie.includes('authToken=') || document.cookie.includes('token=');
      console.log('Auth token in localStorage:', hasToken ? 'Present' : 'Missing');
      console.log('Auth cookie:', hasCookie ? 'Present' : 'Missing');

      // Use the API service which will automatically handle authentication
      console.log('Making API call to fetch purchased books...');
      const response = await api.get('/api/payment/my-purchases');

      console.log('Response received:', response.status, response.statusText);

      if (response.data.success) {
        console.log('Purchased books fetched successfully:', response.data);
        console.log('Purchased books data:', response.data.purchasedBooks);

        // Process books to ensure URLs are valid and remove duplicates
        const bookMap = new Map();
        const processedBooks = [];

        // Process each book
        (response.data.purchasedBooks || []).forEach(book => {
          const bookId = book.bookId.toString();

          // Process the book URL
          let processedBook = book;

          // Ensure book has a valid URL
          if (!book.url || book.url === 'placeholder' || book.url.includes('placeholder.url')) {
            console.log(`Book ${book.title} has invalid URL: ${book.url}, using default PDF`);
            processedBook = {
              ...book,
              url: '/assets/better-placeholder.pdf'
            };
          } else {
            // Keep the original URL - we'll add .pdf extension only when needed for display/download
            processedBook = { ...book };
          }

          // Check if this is a duplicate book
          if (!bookMap.has(bookId)) {
            // First time seeing this book, add it
            bookMap.set(bookId, processedBook);
            processedBooks.push(processedBook);
          } else {
            console.log(`Skipping duplicate book: ${book.title} (${bookId})`);
          }
        });

        console.log(`Processed ${processedBooks.length} unique books out of ${response.data.purchasedBooks?.length || 0} total`);

        // Store the processed purchased books
        setPurchasedBooks(processedBooks);

        // Group books by purchase date for display
        const books = processedBooks;

        // Group books by payment ID (same transaction)
        const groupedByPaymentId = {};

        books.forEach(book => {
          const paymentId = book.paymentId || 'unknown';
          const purchaseDate = book.purchaseDate;

          if (!groupedByPaymentId[paymentId]) {
            groupedByPaymentId[paymentId] = {
              _id: paymentId,
              purchaseDate: purchaseDate,
              books: [],
              totalAmount: 0
            };
          }

          groupedByPaymentId[paymentId].books.push(book);
          groupedByPaymentId[paymentId].totalAmount += book.price;
        });

        // Convert to array and sort by date (newest first)
        const groupedArray = Object.values(groupedByPaymentId).sort((a, b) =>
          new Date(b.purchaseDate) - new Date(a.purchaseDate)
        );

        setGroupedBooks(groupedArray);
      } else {
        setError('Failed to fetch your purchased books');
      }
    } catch (error) {
      console.error('Error fetching purchased books:', error);

      // Provide more specific error messages based on the error type
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Server responded with error:', error.response.status, error.response.data);

        if (error.response.status === 401) {
          setError('Authentication error. Please log in again to access your books.');
          // Redirect to login page after a short delay
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else if (error.response.status === 404) {
          setError('No purchased books found. If you recently bought books, please try again later.');
        } else {
          setError(`Server error (${error.response.status}): ${error.response.data.message || 'An error occurred while fetching your purchased books'}`);
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        setError('Could not connect to the server. Please check your internet connection and try again.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Request setup error:', error.message);
        setError('An error occurred while preparing your request. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const isLoggedIn = document.cookie.includes('isLoggedIn=true') || !!token;

    if (!isLoggedIn) {
      console.log('User is not logged in, redirecting to login page');
      navigate('/login');
    } else {
      console.log('User is logged in, fetching purchased books');
      fetchPurchasedBooks();
    }
  }, [navigate, fetchPurchasedBooks]);

  // We're already calling fetchPurchasedBooks in the authentication check useEffect

  // Function to format date
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
                onClick={() => {
                  fetchPurchasedBooks();
                }}
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
                            {/* Always show Read Now button, even if URL is missing */}
                            <button
                              className="read-button"
                              onClick={() => {
                                // Check if the URL is valid before setting it
                                if (book.url && book.url.startsWith('http')) {
                                  console.log(`Setting PDF URL for ${book.title}:`, book.url);
                                  setSelectedPdf(book.url);
                                } else {
                                  console.log(`Using placeholder PDF for ${book.title}, original URL was:`, book.url);
                                  setSelectedPdf('/assets/better-placeholder.pdf');
                                }
                              }}
                            >
                              <FileText size={16} /> Read Now
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
        {selectedPdf && (
          <div className="pdf-viewer-overlay">
            <div className="pdf-viewer-wrapper">
              <div className="pdf-viewer-header">
                <h3>Reading Book</h3>
                <button
                  className="close-button"
                  onClick={() => setSelectedPdf(null)}
                >
                  Close
                </button>
              </div>
              <div className="pdf-viewer-content">
                <div className="pdf-viewer-container-wrapper">
                  {/* Use a key to force remount when selectedPdf changes */}
                  <ErrorBoundary showDetails={false}>
                    <BasicPdfViewer
                      key={selectedPdf}
                      fileUrl={selectedPdf}
                    />
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
