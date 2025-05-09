import React, { useState, useEffect } from 'react';
import './Book.css';
import Navbar from '../../components/Navbar';
import categories from './categories.json';
import { Search } from 'lucide-react';
import ProductCard from '../../components/ProductCard';
import axios from 'axios';
import BookDetailView from './BookDetailView';
import {useCart} from './cart';


const Book = () => {
  const [books, setBooks] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [priceRange, setPriceRange] = useState(1000); // adjust max if needed
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [hidden, setHidden] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showBestsellers, setShowBestsellers] = useState(false);
  const [showFeatured, setShowFeatured] = useState(false);
  const [showNewReleases, setShowNewReleases] = useState(false);


  useEffect(() => {
    const fetchBooks = async () => {
      try {
        // Build query parameters based on filters
        const params = new URLSearchParams();

        if (showBestsellers) {
          params.append('bestseller', 'true');
        }

        if (showFeatured) {
          params.append('featured', 'true');
        }

        if (showNewReleases) {
          params.append('newrelease', 'true');
        }

        // If any category is selected, use the first one as a filter
        if (selectedCategories.length > 0) {
          params.append('category', selectedCategories[0]);
        }

        const queryString = params.toString();
        const url = `http://localhost:5000/router/getBooks${queryString ? `?${queryString}` : ''}`;

        const response = await axios.get(url);
        setBooks(response.data.data);
      } catch (error) {
        console.error('Failed to fetch books:', error);
      }
    };

    fetchBooks();
  }, [showBestsellers, showFeatured, showNewReleases, selectedCategories]);

  const handleGenreChange = (genre) => {
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre]
    );
  };

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



  return (
    <>
      <div className='navbar'>
        <Navbar />
      </div>
      <main>
        <div className='main-box-books'>
          {/* Left filter panel */}
          <div className='left-box-books'>
            <div className='filter-heading'>
              <p>Filters</p>
              <button className='clearall-button' onClick={clearAllFilters}>
                Clear All
              </button>
            </div>

            <div className='range-box'>
              <p>Price Range</p>
              <label>0</label>
              <input
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
                    <label htmlFor={`genre-${category.id}`}>
                      {category.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="filter-section">
            </div>
          </div>

          {/* Right book list panel */}
          <div className='right-box-books'>
            <div className='search1-button'>
              <div className='search1'>
                <Search />
                <input
                  type='text'
                  placeholder='Search for books, authors, or genres...'
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
            </div>

            <div className='allbooks-list'>
              {filteredBooks.length > 0 ? (
                filteredBooks.map((book, index) => (
                  <div key={index} onClick={() => handleBookClick(book)}>
                    <ProductCard book={book} />
                  </div>
                ))
              ) : (
                <p>No books found matching the filters.</p>
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
      </main>
    </>
  );
};

export default Book;
