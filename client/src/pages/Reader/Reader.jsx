import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import FastEpubViewer from '../../epub/FastEpubViewer';

function Reader() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);

  // Fallback EPUB URL for when books don't work
  const FALLBACK_EPUB_URL = 'https://res.cloudinary.com/dg3i8akzq/raw/upload/v1748511974/ebooks/inzg33a5nsxjff2i2kyn';

  console.log("Loading book with ID:", bookId);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const res = await axios.get(`https://s89-akhil-bookaura-3.onrender.com/api/books/${bookId}`);
        setBook(res.data);
      } catch (error) {
        console.error("Error fetching book:", error);

        // Try to find in purchased books as fallback
        try {
          const token = localStorage.getItem('authToken');
          const purchasedResponse = await axios.get('https://s89-akhil-bookaura-3.onrender.com/api/payment/my-purchases', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (purchasedResponse.data.success && purchasedResponse.data.purchasedBooks) {
            const foundBook = purchasedResponse.data.purchasedBooks.find(
              book => (book.bookId || book._id) === bookId
            );
            if (foundBook) {
              setBook({
                _id: foundBook.bookId || foundBook._id,
                title: foundBook.title,
                author: foundBook.author,
                description: foundBook.description,
                genre: foundBook.genre,
                categories: foundBook.categories,
                isBestSeller: foundBook.isBestSeller,
                isFeatured: foundBook.isFeatured,
                isNewRelease: foundBook.isNewRelease,
                publishedDate: foundBook.publishedDate,
                coverimage: foundBook.coverimage,
                epubUrl: foundBook.epubUrl || foundBook.url
              });
            }
          }
        } catch (purchaseError) {
          console.error("Error fetching purchased books:", purchaseError);
        }
      }
    };

    if (bookId) {
      fetchBook();
    }
  }, [bookId]);

  const handleGoBack = () => {
    navigate('/my-books');
  };

  if (!book) return <p>Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Book Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <button
            onClick={handleGoBack}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to My Books
          </button>
          <div className="flex items-start space-x-6">
            {book.coverimage && (
              <img
                src={book.coverimage}
                alt={book.title}
                className="w-24 h-32 object-cover rounded-lg shadow-md"
              />
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{book.title}</h1>
              <p className="text-xl text-gray-600 mb-3">by {book.author}</p>

              {book.description && (
                <p className="text-gray-700 mb-4 max-w-3xl">{book.description}</p>
              )}

              <div className="flex flex-wrap gap-2">
                {book.genre && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">{book.genre}</span>
                )}
                {book.isBestSeller && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">Best Seller</span>
                )}
                {book.isFeatured && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">Featured</span>
                )}
                {book.isNewRelease && (
                  <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">New Release</span>
                )}
              </div>

              {book.categories && book.categories.length > 0 && (
                <div className="mt-3">
                  <span className="text-sm text-gray-500">Categories: </span>
                  {book.categories.map((category, index) => (
                    <span key={index} className="text-sm text-gray-600">
                      {category}{index < book.categories.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
              )}

              {book.publishedDate && (
                <p className="text-sm text-gray-500 mt-2">
                  Published: {new Date(book.publishedDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* EPUB Viewer */}
      <div className="flex-1 p-4">
        <FastEpubViewer epubUrl={book.epubUrl || book.url} />
      </div>
    </div>
  );
}

export default Reader;
