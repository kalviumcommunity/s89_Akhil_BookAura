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
  // SIMPLE FRONTEND FILTERING: Fetch all books and user's purchased books, then filter on frontend
  const [allBooks, setAllBooks] = useState([]); // All books from server
  const [purchasedBookIds, setPurchasedBookIds] = useState([]); // User's purchased book IDs
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

  // Fetch all books and user's purchased books, then filter on frontend
  useEffect(() => {
    const fetchBooksAndUserData = async () => {
      setLoading(true);

      try {
        // Check if user is authenticated
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.log('❌ No auth token found - user not logged in');
          setAllBooks([]);
          setPurchasedBookIds([]);
          setLoading(false);
          return;
        }

        console.log('📚 Fetching all books and user purchased books...');

        // Fetch all books from the server
        const booksResponse = await api.get('/api/books');
        const allBooksData = booksResponse.data || [];
        setAllBooks(allBooksData);
        console.log(`📖 Fetched ${allBooksData.length} total books`);

        // Fetch user's purchased books
        const userResponse = await api.get('/router/profile');
        const userData = userResponse.data.user || userResponse.data || {};
        const userPurchasedBooks = userData.purchasedBooks || [];
        const purchasedIds = userPurchasedBooks.map(book => book.bookId || book._id).filter(Boolean);
        setPurchasedBookIds(purchasedIds);
        console.log(`🛒 User has purchased ${purchasedIds.length} books:`, purchasedIds);

      } catch (error) {
        console.error('❌ Failed to fetch books or user data:', error);
        setAllBooks([]);
        setPurchasedBookIds([]);

        // Handle authentication errors
        if (error.response?.status === 401) {
          console.error('🔐 Authentication error - clearing token');
          localStorage.removeItem('authToken');
        }
      }
      setLoading(false);
    };

    fetchBooksAndUserData();
  }, []); // Only run once on component mount

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

  // Frontend filtering: Remove purchased books and apply filters
  const filteredBooks = allBooks.filter((book) => {
    // CRITICAL: Exclude purchased books
    const isPurchased = purchasedBookIds.includes(book._id || book.id);
    if (isPurchased) {
      return false; // Don't show purchased books
    }

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

    // Match special filters
    const matchesBestseller = !showBestsellers || book.isBestSeller;
    const matchesFeatured = !showFeatured || book.isFeatured;
    const matchesNewRelease = !showNewReleases || book.isNewRelease;

    return matchesSearch && matchesGenre && matchesPrice && matchesCategories &&
           matchesBestseller && matchesFeatured && matchesNewRelease;
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
                <p>Special Categories</p>
                <div className='checkbox-menu'>
                  <div>
                    <input
                      type='checkbox'
                      id='bestseller-filter'
                      checked={showBestsellers}
                      onChange={() => setShowBestsellers(!showBestsellers)}
                    />
                    <label htmlFor='bestseller-filter' className='checkbox-label'>
                      Bestsellers
                    </label>
                  </div>
                  <div>
                    <input
                      type='checkbox'
                      id='featured-filter'
                      checked={showFeatured}
                      onChange={() => setShowFeatured(!showFeatured)}
                    />
                    <label htmlFor='featured-filter' className='checkbox-label'>
                      Featured
                    </label>
                  </div>
                  <div>
                    <input
                      type='checkbox'
                      id='newrelease-filter'
                      checked={showNewReleases}
                      onChange={() => setShowNewReleases(!showNewReleases)}
                    />
                    <label htmlFor='newrelease-filter' className='checkbox-label'>
                      New Releases
                    </label>
                  </div>
                </div>
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
                ) : allBooks.length === 0 ? (
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
