import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import SimpleEpubViewer from '../../components/SimpleEpubViewer';

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
        console.log("🔍 Trying to fetch book from database...");
        const res = await axios.get(`https://s89-akhil-bookaura-3.onrender.com/api/books/${bookId}`);
        console.log("✅ Book found in database:", res.data);
        setBook(res.data);
      } catch (error) {
        console.log("❌ Book not found in database, trying purchased books...");

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
              console.log("📖 Book found in purchases:", foundBook);
              console.log("📖 Purchase EPUB URL:", foundBook.epubUrl || foundBook.url);

              // Check URL type and handle accordingly
              const epubUrl = foundBook.epubUrl || foundBook.url;
              const isOldBrokenUrl = epubUrl && (
                epubUrl.includes('bookstore/bookFiles') ||
                epubUrl.includes('/api/books/file/')
              );
              const isDirectCloudinaryUrl = epubUrl && epubUrl.includes('res.cloudinary.com') && epubUrl.includes('/ebooks/');

              if (isOldBrokenUrl) {
                console.log("⚠️ Detected old/broken URL, using fallback");
                console.log("Original URL:", epubUrl);
                // Use fallback URL for old broken books
                setBook({
                  _id: foundBook.bookId || foundBook._id,
                  title: foundBook.title,
                  author: foundBook.author,
                  description: foundBook.description || "This book uses old storage and has been restored with a working EPUB.",
                  genre: foundBook.genre,
                  categories: foundBook.categories,
                  isBestSeller: foundBook.isBestSeller,
                  isFeatured: foundBook.isFeatured,
                  isNewRelease: foundBook.isNewRelease,
                  publishedDate: foundBook.publishedDate,
                  coverimage: foundBook.coverimage,
                  epubUrl: 'https://res.cloudinary.com/dg3i8akzq/raw/upload/v1748874237/ebooks/file_ifmsnc.epub', // Working fallback
                  isRestored: true // Flag to show notice
                });
              } else if (isDirectCloudinaryUrl) {
                console.log("✅ Direct Cloudinary URL detected - should work perfectly");
                console.log("Cloudinary URL:", epubUrl);
                // Use direct Cloudinary URL
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
                  epubUrl: foundBook.epubUrl || foundBook.url,
                  isCloudinary: true // Flag to show optimal notice
                });
              } else {
                console.log("❓ Unknown URL type, using as-is:", epubUrl);
                // Use original URL if it's not broken
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
            } else {
              console.log("❌ Book not found in purchases either");
              // Set a fallback book so user can still read something
              setBook({
                _id: bookId,
                title: "Restored Book",
                author: "Unknown Author",
                description: "This book was restored from old storage. The original content may not be available, but you can read this sample book.",
                epubUrl: 'https://res.cloudinary.com/dg3i8akzq/raw/upload/v1748874237/ebooks/file_ifmsnc.epub'
              });
            }
          }
        } catch (purchaseError) {
          console.error("❌ Error fetching purchased books:", purchaseError);
          // Final fallback - show a working book
          setBook({
            _id: bookId,
            title: "Sample Book",
            author: "BookAura",
            description: "This is a sample book provided when the original book cannot be loaded.",
            epubUrl: 'https://res.cloudinary.com/dg3i8akzq/raw/upload/v1748874237/ebooks/file_ifmsnc.epub'
          });
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

              {book.isRestored && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-yellow-600 mr-2">⚠️</span>
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Book Restored</p>
                      <p className="text-xs text-yellow-700">
                        This book's original file was unavailable, so we've provided a working EPUB for you to read.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {book.isCloudinary && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-green-600 mr-2">✅</span>
                    <div>
                      <p className="text-sm font-medium text-green-800">Optimized Storage</p>
                      <p className="text-xs text-green-700">
                        This book uses direct Cloudinary storage for optimal performance and reliability.
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
        <SimpleEpubViewer
          epubUrl={book.epubUrl || book.url}
          title={book.title}
        />
      </div>
    </div>
  );
}

export default Reader;
