import React, { useState, useEffect } from 'react';
import './Book.css';
import Navbar from '../../components/Navbar';
import categories from './categories.json';
import { Search } from 'lucide-react';
import ProductCard from '../../components/ProductCard';
import axios from 'axios';
import BookDetailView from './BookDetailView';

const Book = () => {
  const [books, setBooks] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [priceRange, setPriceRange] = useState(1000); // adjust max if needed
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [hidden, setHidden] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);


  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await axios.get('http://localhost:5000/router/getBooks');
        setBooks(response.data.data);
      } catch (error) {
        console.error('Failed to fetch books:', error);
      }
    };

    fetchBooks();
  }, []);

  const handleGenreChange = (genre) => {
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre]
    );
  };

  const clearAllFilters = () => {
    setSearchText('');
    setPriceRange(1000);
    setSelectedGenres([]);
  };

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchText.toLowerCase()) ||
      book.author.toLowerCase().includes(searchText.toLowerCase());

      const matchesGenre =
      selectedGenres.length === 0 ||
      selectedGenres.some((g) => g.toLowerCase() === book.genre.toLowerCase());

    const matchesPrice = book.price <= priceRange;

    return matchesSearch && matchesGenre && matchesPrice;
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
