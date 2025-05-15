import React, { useState, useEffect } from 'react'
import './MarketPlace.css'
import {Search, BookOpen, Sparkles, Award, BookMarked, TrendingUp, Star, Clock} from 'lucide-react'
import Navbar from '../../components/Navbar'
import {Link} from 'react-router-dom'
import Footer from '../../components/Footer'
import axios from 'axios';
import ProductCard from '../../components/ProductCard';
import LoadingAnimation from '../../components/LoadingAnimation';

const Marketplace = () => {
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [bestsellerBooks, setBestsellerBooks] = useState([]);
  const [newReleaseBooks, setNewReleaseBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);

        // Fetch featured books
        const featuredResponse = await axios.get('https://s89-akhil-bookaura-2.onrender.com/router/featured');
        setFeaturedBooks(featuredResponse.data.data.slice(0, 4)); // Limit to 4 books

        // Fetch bestseller books
        const bestsellerResponse = await axios.get('https://s89-akhil-bookaura-2.onrender.com/router/bestsellers');
        setBestsellerBooks(bestsellerResponse.data.data.slice(0, 4)); // Limit to 4 books

        // Fetch new release books
        const newReleaseResponse = await axios.get('https://s89-akhil-bookaura-2.onrender.com/router/newreleases');
        setNewReleaseBooks(newReleaseResponse.data.data.slice(0, 4)); // Limit to 4 books

        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch books:', error);
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchText.trim()) {
      // Redirect to books page with search query
      window.location.href = `/books?search=${encodeURIComponent(searchText)}`;
    }
  };

  return (
    <>
    <Navbar />
      {loading ? (
        <div className="marketplace-loading">
          <LoadingAnimation text="Loading books..." />
        </div>
      ) : (
        <>
          <div className='marketplace-main'>
            <div className='marketplace-box'>
              <h1 className='marketplace-title'>Discover Your Next<br/><span className='highlight'>Favorite Book</span></h1>
            </div>
            <div>
              <h2>Explore our curated collection of books spanning every genre. From timeless classics to the latest bestsellers, find your perfect read today.</h2>
            </div>
            <div className='search-button'>
              <form onSubmit={handleSearch} className='search'>
                <Search/>
                <input
                  type="text"
                  placeholder="Search for books, authors, or genres..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </form>
              <Link className='link-button-marketplace' to={'/books'}>Browse All Books</Link>
            </div>
          </div>
        </>
      )}

      <div className='features'>
        <div className='collection'>
          <div className='collection-icon'><BookOpen size={24} /></div>
          <h3>Vast Collection</h3>
          <p>Discover thousands of titles across every genre imaginable.</p>
        </div>
        <div className='collection'>
          <div className='collection-icon'><Sparkles size={24} /></div>
          <h3>Personalized Recommendations</h3>
          <p>Find your next favorite read with tailored suggestions.</p>
        </div>
        <div className='collection'>
          <div className='collection-icon'><Award size={24} /></div>
          <h3>Award Winners</h3>
          <p>Explore critically acclaimed and award-winning titles.</p>
        </div>
        <div className='collection'>
          <div className='collection-icon'><BookMarked size={24} /></div>
          <h3>Your Digital Library</h3>
          <p>Access your purchased books anytime, anywhere.</p>
        </div>
      </div>

      {/* Featured Books Section */}
      {featuredBooks.length > 0 && (
        <div className='book-category-section'>
          <div className='category-header'>
            <h2><Star className="category-icon" /> Featured Books</h2>
            <Link to="/books?featured=true" className="view-all-link">View All</Link>
          </div>
          <div className='book-grid'>
            {featuredBooks.map((book, index) => (
              <Link to={`/books?id=${book._id}`} key={index} className="book-card-link">
                <ProductCard book={book} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bestsellers Section */}
      {bestsellerBooks.length > 0 && (
        <div className='book-category-section'>
          <div className='category-header'>
            <h2><TrendingUp className="category-icon" /> Bestsellers</h2>
            <Link to="/books?bestseller=true" className="view-all-link">View All</Link>
          </div>
          <div className='book-grid'>
            {bestsellerBooks.map((book, index) => (
              <Link to={`/books?id=${book._id}`} key={index} className="book-card-link">
                <ProductCard book={book} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* New Releases Section */}
      {newReleaseBooks.length > 0 && (
        <div className='book-category-section'>
          <div className='category-header'>
            <h2><Clock className="category-icon" /> New Releases</h2>
            <Link to="/books?newrelease=true" className="view-all-link">View All</Link>
          </div>
          <div className='book-grid'>
            {newReleaseBooks.map((book, index) => (
              <Link to={`/books?id=${book._id}`} key={index} className="book-card-link">
                <ProductCard book={book} />
              </Link>
            ))}
          </div>
        </div>
      )}

      <Footer/>
    </>
  )
}

export default Marketplace
