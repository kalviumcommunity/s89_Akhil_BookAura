import React, { useState, useEffect } from 'react';
import './Book.css';
import Navbar from '../../components/Navbar';
import categories from './categories.json';
import { Search, Filter, X } from 'lucide-react';
import ProductCard from '../../components/ProductCard';
import api from '../../services/api';
import BookDetailView from './BookDetailView';
import LoadingAnimation from '../../components/LoadingAnimation';


const Book = () => {
  // IMPORTANT: This component ONLY shows books that the user has NOT purchased
  // The books state will NEVER contain purchased books due to server-side filtering
  const [books, setBooks] = useState([]); // Contains ONLY unpurchased books
  const [searchText, setSearchText] = useState('');
  const [priceRange, setPriceRange] = useState(1000); // adjust max if needed
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [hidden, setHidden] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showBestsellers, setShowBestsellers] = useState(false);
  const [showFeatured, setShowFeatured] = useState(false);
  const [showNewReleases, setShowNewReleases] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);


  // Effect to handle filter visibility on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setFilterOpen(true); // Always show filters on larger screens
      } else {
        setFilterOpen(false); // Hide filters by default on mobile
      }
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchUnpurchasedBooks = async () => {
      setLoading(true);

      // Check if user is authenticated
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('❌ No auth token found - user not logged in');
        setBooks([]); // Show no books if not logged in
        setLoading(false);
        return;
      }

      // ========================================
      // CRITICAL: This function ONLY fetches books that the user has NOT purchased
      // The endpoint /api/unpurchased-books/unpurchased is specifically designed to:
      // 1. Authenticate the user
      // 2. Get their purchased books list
      // 3. Return ONLY books NOT in that list
      // 4. NEVER return purchased books under any circumstances
      // ========================================

      try {
        console.log('📚 Fetching ONLY unpurchased books using DEDICATED endpoint...');

        // Build query parameters for filtering
        const params = new URLSearchParams();
        if (showBestsellers) params.append('bestseller', 'true');
        if (showFeatured) params.append('featured', 'true');
        if (showNewReleases) params.append('newrelease', 'true');
        if (selectedCategories.length > 0) params.append('category', selectedCategories[0]);
        if (selectedGenres.length > 0) params.append('genre', selectedGenres[0]);

        const queryString = params.toString();
        // NEW DEDICATED ENDPOINT: /api/unpurchased-books/unpurchased
        const endpoint = `/api/unpurchased-books/unpurchased${queryString ? `?${queryString}` : ''}`;

        console.log('📡 Making request to DEDICATED unpurchased endpoint:', endpoint);
        console.log('🔒 This endpoint is SPECIFICALLY designed to ONLY return unpurchased books');

        // CRITICAL: This dedicated endpoint filters out purchased books on the server side
        const response = await api.get(endpoint);

        console.log('✅ Received response from dedicated unpurchased endpoint:', response.data);

        // Extract unpurchased books from response
        const unpurchasedBooks = response.data.data || response.data || [];

        // Additional verification log
        console.log(`🛡️ Server confirmed: User has purchased ${response.data.userPurchasedCount || 0} books`);
        console.log(`📚 Displaying ${unpurchasedBooks.length} VERIFIED unpurchased books`);
        console.log('📋 Unpurchased book titles:', unpurchasedBooks.map(book => book.title));

        setBooks(unpurchasedBooks);

      } catch (error) {
        console.error('❌ Failed to fetch unpurchased books:', error);

        // IMPORTANT: Never fallback to showing all books
        // This ensures purchased books are never displayed
        setBooks([]);

        // Handle different error types
        if (error.response?.status === 401) {
          console.error('🔐 Authentication error - clearing token and showing login message');
          localStorage.removeItem('authToken');
        } else if (error.response?.status === 403) {
          console.error('🚫 Access forbidden - user may not have permission');
        } else {
          console.error('🌐 Network or server error:', error.message);
        }
      }
      setLoading(false);
    };

    // Fetch unpurchased books whenever filters change
    fetchUnpurchasedBooks();
  }, [showBestsellers, showFeatured, showNewReleases, selectedCategories, selectedGenres]);

  const handleGenreChange = (genre) => {
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre]
    );
  };

  // These functions can be uncommented if you want to add category filters in the future
  /*
  const handleCategoryChange = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleSpecialCategoryChange = (type) => {
    if (type === 'bestseller') {
      setShowBestsellers(!showBestsellers);
    } else if (type === 'featured') {
      setShowFeatured(!showFeatured);
    } else if (type === 'newrelease') {
      setShowNewReleases(!showNewReleases);
    }
  };
  */

  const clearAllFilters = () => {
    setSearchText('');
    setPriceRange(1000);
    setSelectedGenres([]);
    setSelectedCategories([]);
    setShowBestsellers(false);
    setShowFeatured(false);
    setShowNewReleases(false);
  };

  const filteredBooks = books.filter((book) => {
    // Match search text in title or author
    const matchesSearch =
      book.title.toLowerCase().includes(searchText.toLowerCase()) ||
      book.author.toLowerCase().includes(searchText.toLowerCase());

    // Match primary genre
    const matchesGenre =
      selectedGenres.length === 0 ||
      selectedGenres.some((g) => g.toLowerCase() === book.genre.toLowerCase());

    // Match price range
    const matchesPrice = book.price <= priceRange;

    // Match additional categories if any are selected
    const matchesCategories =
      selectedCategories.length === 0 ||
      (book.categories && selectedCategories.some(cat =>
        book.categories.includes(cat)
      ));

    return matchesSearch && matchesGenre && matchesPrice && matchesCategories;
  });

  const handleBookClick = (book) => {
    setSelectedBook(book);
    setHidden(true);
    // Prevent scrolling of the background when modal is open
    document.body.style.overflow = 'hidden';
  }

  const handleCloseDetail = () => {
    setHidden(false);
    setSelectedBook(null);
    // Re-enable scrolling when modal is closed
    document.body.style.overflow = 'auto';
  }



  const toggleFilter = () => {
    setFilterOpen(!filterOpen);
  };

  return (
    <>
      <div className='navbar'>
        <Navbar />
      </div>
      <main>
        {loading ? (
          <div className="books-loading-container">
            <LoadingAnimation text="Loading books..." />
          </div>
        ) : (
          <div className='main-box-books'>
            {/* Mobile filter toggle button */}
            <button className="filter-toggle" onClick={toggleFilter}>
              {filterOpen ? (
                <>
                  <X size={18} /> Hide Filters
                </>
              ) : (
                <>
                  <Filter size={18} /> Show Filters
                </>
              )}
            </button>

            {/* Left filter panel */}
            <div className={`left-box-books ${filterOpen ? 'open' : ''}`}>
              <div className='filter-heading'>
                <p>Filters</p>
                <button className='clearall-button' onClick={clearAllFilters}>
                  Clear All
                </button>
              </div>

              <div className='range-box'>
                <p>Price Range</p>
                <label htmlFor="price-range">0</label>
                <input
                  id="price-range"
                  name="price-range"
                  className='range-input-bar'
                  type='range'
                  min={0}
                  max={1000}
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                />
                <label>{priceRange}</label>
              </div>
              <div>
                <p>Genre</p>
                <div className='checkbox-menu'>
                  {categories.map((category) => (
                    <div key={category.id}>
                      <input
                        type='checkbox'
                        id={`genre-${category.id}`}
                        checked={selectedGenres.includes(category.name)}
                        onChange={() => handleGenreChange(category.name)}
                      />
                      <label htmlFor={`genre-${category.id}` } className='checkbox-label'>
                        {category.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="filter-section">
                {/* Special categories can be added here if needed */}
              </div>
            </div>

            {/* Right book list panel */}
            <div className='right-box-books'>
              <div className='search1-button'>
                <div className='search1'>
                  <Search size={20} />
                  <input
                    id="book-search"
                    name="book-search"
                    type='text'
                    placeholder='Search for books, authors, or genres...'
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </div>
              </div>

              <div className='allbooks-list'>
                {filteredBooks.length > 0 ? (
                  filteredBooks.map((book) => (
                    <div key={book._id || book.id} onClick={() => handleBookClick(book)}>
                      <ProductCard book={book} />
                    </div>
                  ))
                ) : books.length === 0 ? (
                  <div className="no-books-message">
                    {!localStorage.getItem('authToken') ? (
                      <>
                        <h3>🔐 Please Log In</h3>
                        <p>You need to be logged in to view available books for purchase.</p>
                        <p>Please log in to your account to see books you haven't purchased yet.</p>
                      </>
                    ) : (
                      <>
                        <h3>🎉 Congratulations!</h3>
                        <p>You have purchased all available books, or there are no books available for purchase at the moment.</p>
                        <p>Check back later for new releases!</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="no-books-message">
                    <h3>📚 No books match your current filters</h3>
                    <p>Try adjusting your search criteria or clearing the filters to see more books.</p>
                  </div>
                )}
              </div>
            </div>
            {hidden && selectedBook && (
              <BookDetailView
                book={selectedBook}
                onClose={handleCloseDetail}
              />
            )}
          </div>
        )}
      </main>
    </>
  );
};

export default Book;
