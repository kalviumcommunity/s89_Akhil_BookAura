import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import PdfViewer from '../../components/PdfViewer';
import { Book, Calendar, ArrowLeft, FileText } from 'lucide-react';
import { SafeImage } from '../../utils/imageUtils';
import './MyBooksPage.css';

const MyBooksPage = () => {
  const [purchasedBooks, setPurchasedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [groupedBooks, setGroupedBooks] = useState([]);

  useEffect(() => {
    const fetchPurchasedBooks = async () => {
      try {
        setLoading(true);
        console.log('Fetching purchased books...');

        const response = await axios.get('http://localhost:5000/api/payment/my-purchases', {
          withCredentials: true
        });

        if (response.data.success) {
          console.log('Purchased books fetched successfully:', response.data);

          // Store the raw purchased books
          setPurchasedBooks(response.data.purchasedBooks || []);

          // Group books by purchase date for display
          const books = response.data.purchasedBooks || [];

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
        setError('An error occurred while fetching your purchased books');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchasedBooks();
  }, []);

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
              <div className="loading-spinner"></div>
              <p>Loading your books...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p className="error-message">{error}</p>
              <p>Please try again later or contact support if the problem persists.</p>
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
                            {book.url ? (
                              <>
                                <button
                                  className="read-button"
                                  onClick={() => setSelectedPdf(book.url)}
                                >
                                  <FileText size={14} />
                                  Read Now
                                </button>
                                <a
                                  href={book.url}
                                  download={`${book.title}.pdf`}
                                  className="download-button"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Download
                                </a>
                              </>
                            ) : (
                              <p className="no-url-message">Book content not available</p>
                            )}
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
                <PdfViewer fileUrl={selectedPdf} />
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
