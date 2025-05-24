// src/pages/MyBooksPage.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Book, Calendar, ArrowLeft, FileText, ExternalLink } from 'lucide-react';
import { SafeImage } from '../../utils/imageUtils';
import './MyBooksPage.css';
import LoadingAnimation from '../../components/LoadingAnimation';
import api from '../../services/api';

const MyBooksPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupedBooks, setGroupedBooks] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const isLoggedIn = document.cookie.includes('isLoggedIn=true') || !!token;

    if (!isLoggedIn) {
      console.log('User  is not logged in, redirecting to login page');
      navigate('/login');
      return;
    }

    const fetchPurchasedBooks = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/api/payment/my-purchases');

        if (response.data.success) {
          const processedBooks = response.data.purchasedBooks || [];
          const groupedByPaymentId = {};

          processedBooks.forEach(book => {
            const paymentId = book.paymentId || 'unknown';
            if (!groupedByPaymentId[paymentId]) {
              groupedByPaymentId[paymentId] = {
                _id: paymentId,
                purchaseDate: book.purchaseDate,
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
          } else {
            setError(`Server error: ${error.response.data.message || 'An error occurred.'}`);
          }
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
                            {book.url && (book.url.toLowerCase().endsWith('.epub') || book.url.toLowerCase().includes('epub')) ? (
                              <>
                                <button
                                  className="read-button"
                                  onClick={() => {
                                    const encodedUrl = encodeURIComponent(book.url);
                                    navigate(`/epub-reader/${encodedUrl}`);
                                  }}
                                >
                                  <FileText size={16} /> Read EPUB
                                </button>
                                <button
                                  className="open-button"
                                  onClick={() => window.open(book.url, '_blank')}
                                >
                                  <ExternalLink size={16} /> Open Directly
                                </button>
                              </>
                            ) : (
                              <button
                                className="read-button"
                                onClick={() => window.open(book.url, '_blank')}
                              >
                                <FileText size={16} /> Open Book
                              </button>
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
      </div>
      <Footer />
    </>
  );
};

export default MyBooksPage;
