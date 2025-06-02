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
                console.log("📖 Book found in purchases:", foundBook);
                console.log("📖 Purchase EPUB URL:", foundBook.epubUrl || foundBook.url);

                // Always fetch fresh book data from database to get correct URLs
                console.log("🔄 Fetching fresh book data from database...");
                try {
                  const freshBookResponse = await fetch(`${baseUrl}/api/books/${foundBook.bookId || foundBook._id}`);
                  if (freshBookResponse.ok) {
                    const freshBookData = await freshBookResponse.json();
                    setBook({
                      _id: freshBookData._id,
                      title: freshBookData.title,
                      author: freshBookData.author,
                      epubUrl: freshBookData.epubUrl || freshBookData.url
                    });
                    console.log("✅ Fresh book data from database:", freshBookData);
                    console.log("✅ Using fresh EPUB URL:", freshBookData.epubUrl || freshBookData.url);
                    return;
                  }
                } catch (freshError) {
                  console.log("❌ Failed to fetch fresh book data, using purchase data");
                }

                // Fallback to purchase data if fresh fetch fails
                console.log("❌ Fresh book data not found, using purchase data");
                console.log("📖 Using purchase data as fallback:", foundBook);

                // Check if the URL is from the new in-memory system or old Cloudinary
                const epubUrl = foundBook.epubUrl || foundBook.url;
                const isNewInMemoryUrl = epubUrl && (epubUrl.includes('/api/books/file/') || epubUrl.includes('s89-akhil-bookaura-3.onrender.com/api/books/file/'));
                const isOldCloudinaryUrl = epubUrl && epubUrl.includes('cloudinary.com');

                if (isOldCloudinaryUrl && !isNewInMemoryUrl) {
                  console.log("⚠️ This book uses old Cloudinary storage and may not work");
                  console.log("💡 Please re-upload this book for the best experience");
                }

                setBook({
                  _id: foundBook.bookId || foundBook._id,
                  title: foundBook.title,
                  author: foundBook.author,
                  epubUrl: epubUrl,
                  isOldUrl: isOldCloudinaryUrl && !isNewInMemoryUrl
                });
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

        {book.isOldUrl && (
          <div style={{
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '8px',
            padding: '12px',
            margin: '10px 0',
            fontSize: '14px'
          }}>
            <strong>⚠️ Notice:</strong> This book uses old storage and may not load properly.
            <br />
            <strong>💡 Solution:</strong> Please re-upload this book using the "Add Products" page for the best experience.
          </div>
        )}
      </div>

      <div className="reader-content">
        <FastEpubViewer epubUrl={book.epubUrl} />
      </div>
    </div>
  );
}

export default Reader;
