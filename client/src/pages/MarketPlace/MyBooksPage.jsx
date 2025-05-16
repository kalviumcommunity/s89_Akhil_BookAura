import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import BasicPdfViewer from '../../components/BasicPdfViewer';
import ErrorBoundary from '../../components/ErrorBoundary';
import { Book, Calendar, ArrowLeft, FileText } from 'lucide-react';
import { SafeImage } from '../../utils/imageUtils';
import { getMyPurchasesUrl } from '../../utils/apiConfig';
import './MyBooksPage.css';
import LoadingAnimation from '../../components/LoadingAnimation';

const MyBooksPage = () => {
  const [purchasedBooks, setPurchasedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [groupedBooks, setGroupedBooks] = useState([]);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2; // Maximum number of automatic retries

  useEffect(() => {
    const fetchPurchasedBooks = async () => {
      try {
        setLoading(true);
        setError(null);
        setErrorDetails(null);
        console.log('Fetching purchased books... (Attempt', retryCount + 1, 'of', maxRetries + 1, ')');

        // Check if auth token exists
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
          console.log('No auth token found, user may not be logged in');
        }

        // Create a minimal request configuration to avoid CORS issues
        const response = await axios.get(getMyPurchasesUrl(), {
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${authToken || ''}`
            // No additional headers that might trigger CORS preflight
          }
        });

        if (response.data.success) {
          console.log('Purchased books fetched successfully:', response.data);
          console.log(`Received ${response.data.count || 0} purchased books from server`);

          console.log(`Processing ${response.data.purchasedBooks?.length || 0} books`);

          // Use our processBooks function to handle the data
          const processedBooks = response.data.purchasedBooks || [];
          setPurchasedBooks(processedBooks);

          // Group the books by payment ID
          const groupedArray = processBooks(processedBooks);
          setGroupedBooks(groupedArray);

          console.log(`Processed ${processedBooks.length} books into ${groupedArray.length} purchase groups`);

          // Reset retry count on success
          setRetryCount(0);
        } else {
          console.error('Server returned error:', response.data);
          setError(response.data.message || 'Failed to fetch your purchased books');
          setErrorDetails(response.data);

          // Retry if we haven't reached max retries
          if (retryCount < maxRetries) {
            console.log(`Retrying in 2 seconds... (${retryCount + 1}/${maxRetries})`);
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, 2000);
          }
        }
      } catch (error) {
        console.error('Error fetching purchased books:', error);

        // Handle authentication errors
        if (error.response?.status === 401) {
          setError('Authentication required. Please log in to view your purchased books.');
          setErrorDetails({
            status: 401,
            message: 'You need to be logged in to view your purchased books',
            solution: 'Please log in and try again'
          });

          // Redirect to login page after a delay
          setTimeout(() => {
            window.location.href = '/login?redirect=/my-books';
          }, 3000);
        } else if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
          // Handle CORS errors or network issues
          setError('Network error while fetching your purchased books');
          setErrorDetails({
            message: 'This may be due to a CORS issue or network connectivity problem',
            status: 'NETWORK_ERROR',
            solution: 'Please try refreshing the page or using a different browser'
          });

          console.log('Detected network/CORS error, trying alternative approach...');

          // Try an alternative approach without credentials for CORS issues
          try {
            // Create a fallback request without credentials or complex headers
            const fallbackResponse = await axios.get(getMyPurchasesUrl(), {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
              },
              // No withCredentials to avoid CORS preflight
              timeout: 15000
            });

            if (fallbackResponse.data.success) {
              console.log('Fallback request successful!');
              // Process the successful response
              setPurchasedBooks(fallbackResponse.data.purchasedBooks || []);
              setGroupedBooks(processBooks(fallbackResponse.data.purchasedBooks || []));
              setError(null);
              setErrorDetails(null);
              return; // Exit the error handler since we recovered
            }
          } catch (fallbackError) {
            console.error('Fallback request also failed:', fallbackError);
          }

          // If we're here, both approaches failed
          // Retry if we haven't reached max retries
          if (retryCount < maxRetries) {
            console.log(`Retrying in 3 seconds... (${retryCount + 1}/${maxRetries})`);
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, 3000);
          }
        } else {
          // Handle other types of errors
          setError('An error occurred while fetching your purchased books');
          setErrorDetails({
            message: error.message,
            status: error.response?.status,
            data: error.response?.data
          });

          // Retry if we haven't reached max retries and it's not an auth error
          if (retryCount < maxRetries && error.response?.status !== 401) {
            console.log(`Retrying in 2 seconds... (${retryCount + 1}/${maxRetries})`);
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, 2000);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPurchasedBooks();
  }, [retryCount, maxRetries]);

  // Function to process books and group them by payment ID
  const processBooks = (books) => {
    try {
      // Process books to ensure URLs are valid and remove duplicates
      const bookMap = new Map();
      const processedBooks = [];

      // Process each book
      (books || []).forEach(book => {
        try {
          // Safely access bookId with fallback
          const bookId = (book.bookId?.toString() || book._id?.toString() || Math.random().toString());

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
        } catch (err) {
          console.error('Error processing book:', err, book);
          // Continue with next book
        }
      });

      // Group books by payment ID (same transaction)
      const groupedByPaymentId = {};

      processedBooks.forEach(book => {
        try {
          const paymentId = book.paymentId || 'unknown';
          const purchaseDate = book.purchaseDate || new Date();

          if (!groupedByPaymentId[paymentId]) {
            groupedByPaymentId[paymentId] = {
              _id: paymentId,
              purchaseDate: purchaseDate,
              books: [],
              totalAmount: 0
            };
          }

          groupedByPaymentId[paymentId].books.push(book);
          groupedByPaymentId[paymentId].totalAmount += (book.price || 0);
        } catch (err) {
          console.error('Error grouping book:', err, book);
          // Continue with next book
        }
      });

      // Convert to array and sort by date (newest first)
      return Object.values(groupedByPaymentId).sort((a, b) =>
        new Date(b.purchaseDate || 0) - new Date(a.purchaseDate || 0)
      );
    } catch (error) {
      console.error('Error in processBooks:', error);
      return [];
    }
  };

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
              <p>Please try again later or contact support if the problem persists.</p>

              {errorDetails?.status === 401 ? (
                <div className="auth-error">
                  <p>You need to be logged in to view your purchased books.</p>
                  <Link to="/login?redirect=/my-books" className="login-button">
                    Log In
                  </Link>
                </div>
              ) : errorDetails?.status === 'NETWORK_ERROR' ? (
                <div className="network-error">
                  <p>{errorDetails.message}</p>
                  <p>{errorDetails.solution}</p>
                  <div className="error-actions">
                    <button
                      className="retry-button"
                      onClick={() => setRetryCount(prev => prev + 1)}
                    >
                      Retry Now
                    </button>
                    <button
                      className="refresh-button"
                      onClick={() => window.location.reload()}
                    >
                      Refresh Page
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="retry-button"
                  onClick={() => setRetryCount(prev => prev + 1)}
                >
                  Retry Now
                </button>
              )}
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
