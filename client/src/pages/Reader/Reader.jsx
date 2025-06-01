import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FastEpubViewer from '../../epub/FastEpubViewer';
import './Reader.css';

function Reader() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);

  console.log("Loading book with ID:", bookId);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        // First try to get from purchased books (your current system)
        const baseUrl = import.meta.env.VITE_API_URL || 'https://s89-akhil-bookaura-3.onrender.com';

        try {
          const response = await fetch(`${baseUrl}/api/payment/my-purchases`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              // Find the book with matching ID
              const foundBook = data.purchasedBooks.find(book =>
                book.bookId.toString() === bookId || book._id === bookId
              );

              if (foundBook) {
                // Convert to match your working code format
                setBook({
                  _id: foundBook.bookId || foundBook._id,
                  title: foundBook.title,
                  author: foundBook.author,
                  epubUrl: foundBook.epubUrl || foundBook.url  // Use epubUrl if available, fallback to url
                });
                console.log("📖 Book found in purchases:", foundBook);
                console.log("📖 Using EPUB URL:", foundBook.epubUrl || foundBook.url);
                return;
              }
            }
          }
        } catch (purchaseError) {
          console.log("Purchase API failed, trying direct book API...");
        }

        // Fallback: Try direct book API (like your working model)
        try {
          const directResponse = await fetch(`${baseUrl}/api/books/${bookId}`);
          if (directResponse.ok) {
            const bookData = await directResponse.json();
            // Use epubUrl if available, otherwise use url
            setBook({
              _id: bookData._id,
              title: bookData.title,
              author: bookData.author,
              epubUrl: bookData.epubUrl || bookData.url
            });
            console.log("📖 Book found via direct API:", bookData);
            console.log("📖 Direct API EPUB URL:", bookData.epubUrl || bookData.url);
            return;
          }
        } catch (directError) {
          console.log("Direct API also failed:", directError);
        }

        console.log("❌ Book not found in any source");

      } catch (error) {
        console.error('Error fetching book:', error);
      }
    };

    if (bookId) {
      fetchBook();
    }
  }, [bookId]);

  const handleGoBack = () => {
    navigate('/my-books');
  };

  if (!book) {
    return (
      <div className="reader-loading">
        <p>Loading book...</p>
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
        <FastEpubViewer epubUrl={book.epubUrl} />
      </div>
    </div>
  );
}

export default Reader;
