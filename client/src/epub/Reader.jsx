// Reader.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import EpubViewer from './EpubViewer';

function Reader() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  console.log("Loading book with ID:", id);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'https://s89-akhil-bookaura-3.onrender.com';

        // First try to get from purchased books (where the data actually is)
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
                book.bookId.toString() === id || book._id === id
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
                setBook({
                  _id: foundBook.bookId || foundBook._id,
                  title: foundBook.title,
                  author: foundBook.author,
                  epubUrl: foundBook.epubUrl || foundBook.url
                });
                return;
              }
            }
          }
        } catch (purchaseError) {
          console.log("Purchase API failed, trying direct book API...");
        }

        // Fallback: Try direct book API
        try {
          const res = await axios.get(`${baseUrl}/api/books/${id}`);
          setBook({
            _id: res.data._id,
            title: res.data.title,
            author: res.data.author,
            epubUrl: res.data.epubUrl || res.data.url
          });
          console.log("📖 Book found via direct API:", res.data);
          console.log("📖 Direct API EPUB URL:", res.data.epubUrl || res.data.url);
        } catch (directError) {
          console.log("Direct API also failed:", directError);
        }

      } catch (error) {
        console.error('Error fetching book:', error);
      }
    };
    fetchBook();
  }, [id]);

  if (!book) return <p>Loading...</p>;

  return (
    <div>
      <h1>{book.title} by {book.author}</h1>
      <EpubViewer epubUrl={book.epubUrl} />
    </div>
  );
}

export default Reader;
