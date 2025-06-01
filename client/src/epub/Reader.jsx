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
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await axios.get(`${baseUrl}/api/books/${id}`);
        setBook({
          _id: res.data._id,
          title: res.data.title,
          author: res.data.author,
          description: res.data.description,
          genre: res.data.genre,
          categories: res.data.categories,
          isBestSeller: res.data.isBestSeller,
          isFeatured: res.data.isFeatured,
          isNewRelease: res.data.isNewRelease,
          publishedDate: res.data.publishedDate,
          coverimage: res.data.coverimage,
          epubUrl: res.data.epubUrl || res.data.url
        });
        console.log("📖 Book loaded:", res.data);
      } catch (error) {
        console.error('Error fetching book:', error);
      }
    };
    fetchBook();
  }, [id]);

  if (!book) return <p>Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Book Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
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
        <EpubViewer epubUrl={book.epubUrl} />
      </div>
    </div>
  );
}

export default Reader;
