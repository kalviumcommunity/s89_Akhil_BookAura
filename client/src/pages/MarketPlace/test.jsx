import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import axios from 'axios';
import '../pagescss/Marketplace.css';

const Marketplace = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    axios.get('http://localhost:5000/router/getBooks')
      .then(response => {
        // Ensure books is always an array
        const booksData = Array.isArray(response.data)
          ? response.data
          : (response.data?.data || []);

        setBooks(booksData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching books:', err);
        setError('Failed to fetch books');
        setLoading(false);
      });
  }, []);

  // Filter books based on search term and active filter
  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author?.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeFilter === 'All') return matchesSearch;
    // Add more filter conditions here when you have genre or other filters
    return matchesSearch;
  });

  if (loading) return (
    <div className="marketplace-container">
      <Navbar />
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading amazing books for you...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="marketplace-container">
      <Navbar />
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <p>{error}</p>
        <button
          className="filter-button"
          onClick={() => window.location.reload()}
          style={{ marginTop: '20px' }}
        >
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="marketplace-container">
      <Navbar />

      <div className="marketplace-header">
        <h1 className="marketplace-title">Book Marketplace</h1>
        <p className="marketplace-subtitle">
          Discover a world of knowledge with our curated collection of books.
          Find your next favorite read and expand your horizons.
        </p>
      </div>

      <div className="marketplace-filters">
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search by title or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-options">
          <button
            className={`filter-button ${activeFilter === 'All' ? 'active' : ''}`}
            onClick={() => setActiveFilter('All')}
          >
            All Books
          </button>
          <button
            className={`filter-button ${activeFilter === 'New' ? 'active' : ''}`}
            onClick={() => setActiveFilter('New')}
          >
            New Releases
          </button>
          <button
            className={`filter-button ${activeFilter === 'Popular' ? 'active' : ''}`}
            onClick={() => setActiveFilter('Popular')}
          >
            Popular
          </button>
        </div>
      </div>

      {filteredBooks.length === 0 ? (
        <div className="no-books-container">
          <img
            className="empty-illustration"
            src="https://cdn-icons-png.flaticon.com/512/5058/5058432.png"
            alt="No books found"
          />
          <p>No books available matching your criteria</p>
          {searchTerm && (
            <button
              className="filter-button"
              onClick={() => setSearchTerm('')}
              style={{ marginTop: '15px' }}
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="books-grid">
            {filteredBooks.map((book, index) => (
              <ProductCard key={index} book={book} />
            ))}
          </div>

          {/* Pagination - can be implemented with actual functionality later */}
          <div className="pagination">
            <button className="page-button active">1</button>
            <button className="page-button">2</button>
            <button className="page-button">3</button>
            <button className="page-button">→</button>
          </div>
        </>
      )}
    </div>
  );
};

export default Marketplace;
