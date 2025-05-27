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
                // Convert to simple format
                setBook({
                  _id: foundBook.bookId || foundBook._id,
                  title: foundBook.title,
                  author: foundBook.author,
                  epubUrl: foundBook.epubUrl || foundBook.url
                });
                console.log("📖 Book found in purchases:", foundBook);
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
          setBook(res.data);
          console.log("📖 Book found via direct API:", res.data);
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
