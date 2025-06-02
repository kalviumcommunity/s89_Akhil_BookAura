import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SimpleEpubViewer from '../components/SimpleEpubViewer';
import { Book, Calendar, ArrowLeft, FileText, Upload } from 'lucide-react';

const AllBooksPage = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('https://s89-akhil-bookaura-3.onrender.com/api/books');
      setBooks(response.data);
      console.log('📚 Fetched books:', response.data);
    } catch (error) {
      console.error('❌ Error fetching books:', error);
      setError('Failed to fetch books. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReadBook = (book) => {
    console.log('📖 Opening book:', book.title);
    console.log('📖 EPUB URL:', book.epubUrl || book.url);
    
    // Check URL type for logging
    const epubUrl = book.epubUrl || book.url;
    if (epubUrl && epubUrl.includes('res.cloudinary.com') && epubUrl.includes('/ebooks/')) {
      console.log('✅ Direct Cloudinary URL detected - should work perfectly');
    } else if (epubUrl && epubUrl.includes('/api/books/file/')) {
      console.log('⚠️ In-memory storage URL detected - may not work after server restart');
    } else {
      console.log('❓ Unknown URL type:', epubUrl);
    }
    
    setSelectedBook(book);
  };

  const handleCloseReader = () => {
    setSelectedBook(null);
  };

  // Listen for ESC key event from EPUB viewer
  useEffect(() => {
    const handleCloseEvent = () => {
      setSelectedBook(null);
    };

    window.addEventListener('closeEpubReader', handleCloseEvent);
    return () => {
      window.removeEventListener('closeEpubReader', handleCloseEvent);
    };
  }, []);

  // If a book is selected, show the reader
  if (selectedBook) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
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
      <div style={{
        padding: '120px 20px 60px',
        minHeight: '100vh',
        backgroundColor: '#E6D9CC'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '30px'
          }}>
            <h1 style={{
              fontFamily: 'MightySouly, serif',
              fontSize: '2.5rem',
              color: '#333',
              margin: '0'
            }}>📚 All Books</h1>
            <button
              onClick={() => navigate('/working-epub')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#A67C52',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <Upload size={16} />
              Upload New Book
            </button>
          </div>

          <p style={{
            textAlign: 'center',
            color: '#666',
            marginBottom: '30px',
            fontSize: '16px'
          }}>
            Browse and read all uploaded books. New uploads with Cloudinary storage work perfectly!
          </p>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #A67C52',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 20px'
              }} />
              <p>Loading books...</p>
              <style jsx>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : error ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              backgroundColor: '#fff3f3',
              borderRadius: '8px',
              border: '1px solid #ffcdd2'
            }}>
              <p style={{ color: '#d32f2f', marginBottom: '16px' }}>{error}</p>
              <button
                onClick={fetchBooks}
                style={{
                  backgroundColor: '#A67C52',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🔄 Try Again
              </button>
            </div>
          ) : books.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px'
            }}>
              <Book size={64} style={{ color: '#A67C52', margin: '0 auto 20px' }} />
              <h3 style={{ color: '#333', marginBottom: '16px' }}>No books found</h3>
              <p style={{ color: '#666', marginBottom: '20px' }}>
                Upload your first book to get started!
              </p>
              <button
                onClick={() => navigate('/working-epub')}
                style={{
                  backgroundColor: '#A67C52',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                📚 Upload First Book
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px'
            }}>
              {books.map((book, index) => (
                <div key={index} style={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '20px',
                  border: '1px solid #dee2e6',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '15px',
                    marginBottom: '15px'
                  }}>
                    {book.coverimage && (
                      <img
                        src={book.coverimage}
                        alt={book.title}
                        style={{
                          width: '60px',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                          border: '1px solid #ddd'
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        margin: '0 0 8px 0',
                        fontSize: '16px',
                        color: '#333',
                        lineHeight: '1.3'
                      }}>{book.title}</h3>
                      <p style={{
                        margin: '0 0 8px 0',
                        fontSize: '14px',
                        color: '#666'
                      }}>by {book.author}</p>
                      {book.price && (
                        <p style={{
                          margin: '0',
                          fontSize: '14px',
                          color: '#A67C52',
                          fontWeight: 'bold'
                        }}>₹{book.price}</p>
                      )}
                    </div>
                  </div>

                  {/* URL Type Indicator */}
                  {book.epubUrl && book.epubUrl.includes('res.cloudinary.com') && book.epubUrl.includes('/ebooks/') && (
                    <div style={{
                      padding: '6px 10px',
                      backgroundColor: '#d4edda',
                      color: '#155724',
                      borderRadius: '4px',
                      fontSize: '12px',
                      marginBottom: '15px',
                      border: '1px solid #c3e6cb'
                    }}>
                      ✅ Cloudinary Storage - Optimal Performance
                    </div>
                  )}

                  <button
                    onClick={() => handleReadBook(book)}
                    style={{
                      width: '100%',
                      backgroundColor: '#A67C52',
                      color: 'white',
                      border: 'none',
                      padding: '10px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <FileText size={16} />
                    Read Book
                  </button>
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

export default AllBooksPage;
