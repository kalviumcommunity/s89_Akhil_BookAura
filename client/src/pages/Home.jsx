import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import '../pagescss/Home.css'
import bestseller from '../images/bestseller.png'
import Footer from '../components/Footer'
import { useCart } from './MarketPlace/cart'
import { SafeImage, getProxiedImageUrl, handleImageError } from '../utils/imageUtils'
import {useNavigate,useLocation} from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import BasicGoogleTranslate from '../components/BasicGoogleTranslate'
import ErrorBoundary from '../components/ErrorBoundary'
import axios from 'axios';


const Home = () => {
  const { syncCartWithServer } = useCart();
  const navigate = useNavigate();
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const location = useLocation();
  const [zoomLevel, setZoomLevel] = useState(1);

  // Check if we need to sync cart after Google login and handle token from URL
  useEffect(() => {
    // Handle URL parameters for Google OAuth callback
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const success = params.get('success');
    const encodedUserData = params.get('userData');

    // If we have a token from Google OAuth callback, store it
    if (token && success === 'true') {
      console.log('Google authentication successful, storing token');

      try {
        // Store token in localStorage for the API interceptor to use
        localStorage.setItem('authToken', token);

        // Set flag to sync cart
        localStorage.setItem('syncCartAfterLogin', 'true');

        // Set isLoggedIn cookie for client-side detection
        document.cookie = `isLoggedIn=true; path=/; max-age=${7 * 24 * 60 * 60}`;

        // If we have user data, store it
        if (encodedUserData) {
          try {
            const userData = JSON.parse(decodeURIComponent(encodedUserData));
            console.log('Received user data from Google auth:', userData);

            // Store user data in localStorage for persistence
            localStorage.setItem('userData', JSON.stringify(userData));

            // Log success
            console.log('Successfully stored user data in localStorage');

            // Clean up URL parameters
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);

            // Sync cart with server
            syncCartWithServer();

            // Log success message instead of showing alert
            console.log('Google login successful!');

            // Reload page to apply authentication
            window.location.reload();
          } catch (error) {
            console.error('Error parsing user data:', error);
            // Removed alert box - just log the error
          }
        } else {
          console.error('No user data received from Google auth');
          // Removed alert box - just log the error
        }
      } catch (error) {
        console.error('Error during Google authentication:', error);
        // Removed alert box - just log the error
      }
    }

    // Handle regular page reload
    if (location.state?.reload) {
      window.history.replaceState({}, document.title); // prevent infinite reload
      window.location.reload(); // full reload
    }

    // Fetch featured books
    const fetchBooks = async () => {
      try {
        const allBooksResponse = await axios.get('https://s89-akhil-bookaura-3.onrender.com/api/books');
        const allBooks = allBooksResponse.data;
        setFeaturedBooks(allBooks.filter(book => book.isFeatured).slice(0, 4)); // Limit to 4 books
      } catch (error) {
        console.log('Failed to fetch featured books:', error);
        console.log(error)
      }
    }
    fetchBooks();

    // Sync cart if needed
    const shouldSyncCart = localStorage.getItem('syncCartAfterLogin');
    if (shouldSyncCart === 'true') {
      // Sync cart with server
      syncCartWithServer();
      // Remove the flag
      localStorage.removeItem('syncCartAfterLogin');
    }
  }, [location.state, syncCartWithServer]);

  const [fadeKey, setFadeKey] = useState(0);

  // Simple and effective zoom detection for main-books
  useEffect(() => {
    const handleZoom = () => {
      const zoom = window.devicePixelRatio || 1;
      setZoomLevel(zoom);

      // Apply dynamic CSS variables based on zoom level
      const root = document.documentElement;

      // Get current screen size to determine base values
      const isLargeScreen = window.innerWidth >= 1200;
      const isMediumScreen = window.innerWidth >= 992 && window.innerWidth < 1200;
      const isTabletScreen = window.innerWidth >= 768 && window.innerWidth < 992;
      const isSmallScreen = window.innerWidth >= 480 && window.innerWidth < 768;
      // Set base values based on screen size - increased sizes
      let baseWidth, baseSpacingX, baseSpacingY, baseMarginTop;

      if (isLargeScreen) {
        baseWidth = 240; // Increased from 180
        baseSpacingX = 300; // Increased from 250
        baseSpacingY = 200; // Increased from 170
        baseMarginTop = 120;
      } else if (isMediumScreen) {
        baseWidth = 180; // Increased from 150
        baseSpacingX = 220; // Increased from 180
        baseSpacingY = 170; // Increased from 150
        baseMarginTop = 120;
      } else if (isTabletScreen) {
        baseWidth = 140; // Increased from 120
        baseSpacingX = 25; // Increased from 20
        baseSpacingY = 0;
        baseMarginTop = 0;
      } else if (isSmallScreen) {
        baseWidth = 120; // Increased from 100
        baseSpacingX = 25; // Increased from 20
        baseSpacingY = 0;
        baseMarginTop = 0;
      } else { // Very small screens
        baseWidth = 110; // Increased from 90
        baseSpacingX = 15; // Increased from 10
        baseSpacingY = 0;
        baseMarginTop = 0;
      }

      // Simple zoom-responsive scaling for individual books and quote
      const isZoomed = zoom > 1.0;

      // Quote container scaling
      const quoteScale = isZoomed ? Math.max(0.5, 0.8 / zoom) : 1;
      const quoteMaxWidth = isZoomed ? Math.max(250, 500 / zoom) : 500;

      // Change photo width directly based on zoom level
      const photoWidth = isZoomed ? Math.max(120, baseWidth / zoom) : baseWidth;
      const bookSpacingReduction = isZoomed ? Math.max(0.7, 0.9 / zoom) : 1;

      // Keep main-books container stable - no scaling
      const mainBooksScale = 1;

      // Set CSS variables
      root.style.setProperty('--zoom-factor', zoom);
      root.style.setProperty('--book-width', `${photoWidth}px`); // Dynamic photo width based on zoom
      root.style.setProperty('--book-spacing-x', `${baseSpacingX}px`);
      root.style.setProperty('--book-spacing-y', `${baseSpacingY}px`);
      root.style.setProperty('--book-margin-top', `${baseMarginTop}px`);
      root.style.setProperty('--quote-scale', quoteScale);
      root.style.setProperty('--quote-max-width', `${quoteMaxWidth}px`);
      root.style.setProperty('--book-spacing-reduction', bookSpacingReduction);
      root.style.setProperty('--main-books-scale', mainBooksScale);

      // Positioning for desktop only - no container scaling
      const mainBooksLeft = isTabletScreen || isSmallScreen ? 'auto' : '50%';
      const mainBooksTransform = isTabletScreen || isSmallScreen ?
        'none' :
        'translateX(-1%)'; // No scaling, just positioning

      root.style.setProperty('--main-books-left', mainBooksLeft);
      root.style.setProperty('--main-books-transform', mainBooksTransform);

      console.log(`Zoom: ${zoom.toFixed(2)}, Photo width: ${photoWidth.toFixed(0)}px, Spacing reduction: ${bookSpacingReduction.toFixed(3)}`);
    };

    handleZoom(); // Run once on mount
    window.addEventListener('resize', handleZoom);

    return () => window.removeEventListener('resize', handleZoom);
  }, []);

  const genres = [
  {
    name: "Motivation",
    quote: "TO SUCCEED\nYOU MUST\nREAD",
    subtext: "Fuel your drive with life-changing wisdom and powerful ideas.",
    books: {
      book1: {
        id: "65009709000001",
        title: "Hard Things",
        // Found ISBN for "The Hard Thing About Hard Things" by Ben Horowitz
        src: "https://m.media-amazon.com/images/I/810u9MkT3SL.jpg"
      },
      book2: {
        id: "65009709000002",
        title: "Think & Grow Rich",
        // Found ISBN for "Think and Grow Rich" by Napoleon Hill
        src: "https://m.media-amazon.com/images/I/61IxJuRI39L.jpg"
      },
      book3: {
        id: "65009709000003",
        title: "Zero to One",
        // Found ISBN for "Zero to One" by Peter Thiel
        src: "https://m.media-amazon.com/images/I/61PDzIhVLnL._AC_UF1000,1000_QL80_.jpg"
      }
    }
  },
  {
    name: "Fiction",
    quote: "LOSE YOURSELF\nIN A DIFFERENT\nWORLD",
    subtext: "Adventure, mystery, and imagination await in every page.",
    books: {
      book1: {
        id: "65009709000004",
        title: "Pride and Prejudice",
        // Found ISBN for "Pride and Prejudice" by Jane Austen
        src: "https://s3-ap-southeast-2.amazonaws.com/assets.allenandunwin.com/images/original/9780571337019.jpg"
      },
      book2: {
        id: "65009709000005",
        title: "Moby Dick",
        // Found ISBN for "Moby-Dick" by Herman Melville
        src: "https://m.media-amazon.com/images/I/91xNmlf86yL._AC_UF1000,1000_QL80_.jpg"
      },
      book3: {
        id: "65009709000014",
        title: "The Great Gatsby",
        // Found ISBN for "The Great Gatsby" by F. Scott Fitzgerald
        src: "https://m.media-amazon.com/images/I/81ZBJ2Q0pYL._UF1000,1000_QL80_.jpg"
      }
    }
  },
  {
    name: "Science",
    quote: "EXPLORE THE\nWONDERS OF\nTHE UNIVERSE",
    subtext: "Dive deep into discoveries, theories, and scientific marvels.",
    books: {
      book1: {
        id: "65009709000006",
        title: "A Brief History of Time",
        // Found ISBN for "A Brief History of Time" by Stephen Hawking
        src: "https://m.media-amazon.com/images/I/91ebghaV-eL.jpg"
      },
      book2: {
        id: "65009709000007",
        title: "The Selfish Gene",
        // Found ISBN for "The Selfish Gene" by Richard Dawkins
        src: "https://m.media-amazon.com/images/I/61CXvkfdXlL.jpg"
      },
      book3: {
        id: "65009709000015",
        title: "Cosmos",
        // Found ISBN for "Cosmos" by Carl Sagan
        src: "https://rukminim2.flixcart.com/image/850/1000/l5jxt3k0/book/i/a/p/cosmos-original-imagg6u2kze264xu.jpeg?q=90&crop=false"
      }
    }
  },
  {
    name: "History",
    quote: "UNDERSTAND THE\nPAST TO\nSHAPE THE FUTURE",
    subtext: "Stories and lessons from history’s most defining moments.",
    books: {
      book1: {
        id: "65009709000008",
        title: "Sapiens",
        // Found ISBN for "Sapiens: A Brief History of Humankind" by Yuval Noah Harari
        src: "https://m.media-amazon.com/images/I/713jIoMO3UL.jpg"
      },
      book2: {
        id: "65009709000009",
        title: "Guns, Germs, and Steel",
        // Found ISBN for "Guns, Germs, and Steel" by Jared Diamond
        src: "https://m.media-amazon.com/images/I/61V8g4GgqdL._AC_UF1000,1000_QL80_.jpg"
      },
      book3: {
        id: "65009709000016",
        title: "The Wright Brothers",
        // Found ISBN for "The Wright Brothers" by David McCullough
        src: "https://m.media-amazon.com/images/I/71TYHByzngL._AC_UF1000,1000_QL80_.jpg"
      }
    }
  },
  {
    name: "Philosophy",
    quote: "QUESTION EVERYTHING\nAND\nTHINK DEEPLY",
    subtext: "Challenge your mind and explore ideas about existence and ethics.",
    books: {
      book1: {
        id: "65009709000010",
        title: "Meditations",
        // Found ISBN for "Meditations" by Marcus Aurelius
        src: "https://m.media-amazon.com/images/I/71FCbiv0tTL._AC_UF1000,1000_QL80_.jpg"
      },
      book2: {
        id: "65009709000011",
        title: "The Republic",
        // Found ISBN for "The Republic" by Plato
        src: "https://m.media-amazon.com/images/I/7160zSqr-2L._AC_UF1000,1000_QL80_.jpg"
      },
      book3: {
        id: "65009709000017",
        title: "Beyond Good and Evil",
        // Found ISBN for "Beyond Good and Evil" by Friedrich Nietzsche
        src: "https://m.media-amazon.com/images/I/71qQesJERdL.jpg"
      }
    }
  },
  {
    name: "Business",
    quote: "LEARN TO LEAD\nAND\nINNOVATE",
    subtext: "Strategies and insights to help you succeed in business and entrepreneurship.",
    books: {
      book1: {
        id: "65009709000012",
        title: "The Lean Startup",
        // Found ISBN for "The Lean Startup" by Eric Ries
        src: "https://m.media-amazon.com/images/I/71sxTeZIi6L.jpg"
      },
      book2: {
        id: "65009709000013",
        title: "Good to Great",
        // Found ISBN for "Good to Great" by Jim Collins
        src: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1546097703l/76865.jpg"
      },
      book3: {
        id: "65009709000018",
        title: "Start with Why",
        // Found ISBN for "Start with Why" by Simon Sinek
        src: "https://m.media-amazon.com/images/I/71M1P287BjL.jpg"
      }
    }
  }
];


  const [currentGenreIndex,setCurrentGenreIndex] = useState(0);
  useEffect(()=>{
    const interval = setInterval(()=>{
      setCurrentGenreIndex(prevIndex=>(prevIndex+1)%genres.length);
      setFadeKey((prevKey)=>prevKey+1);
    },8000)
    return()=> clearInterval(interval);
  },[]);
  

  return (
    <div>
      <Navbar />

      <ErrorBoundary>
        <BasicGoogleTranslate position="bottom-right" />
      </ErrorBoundary>

      <div className="main-box fade" key={fadeKey}>
        <div className="quote-container">
          
            <div key={genres.name}>
              <h1 className="quote-line">
                {genres[currentGenreIndex].quote.split("\n").map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
              </h1>
              <h3 className="line">{genres[currentGenreIndex].subtext}</h3>
              <button
                className="explore"
                onClick={() => navigate("/marketplace")}
              >
                EXPLORE MORE | <span>&#8599;</span>
              </button>
            </div>
          
        </div>

        <div className="main-books">
  {Object.entries(genres[currentGenreIndex].books).map(([key, book]) => (
    <img
      key={book.id}
      className={`photo ${key}`} // will be "photo book1", "photo book2", etc.
      onClick={() => navigate(`/books?id=${book.id}`)}
      src={book.src}
      alt={book.title}
    />
  ))}
</div>

      </div>
      <div className="middle-box">
        <div className="bestseller-showcase">
          <div className="bestseller-book">
            <div className="bestseller-badge-container">
              <img
                className="bestseller-badge"
                src={bestseller}
                alt="bestseller badge"
              />
            </div>
            <img
              className="bestseller-cover"
              src="https://m.media-amazon.com/images/I/71vtwPxOZRL._AC_UF1000,1000_QL80_.jpg"
              alt="Dot Com Secrets"
            />
          </div>

          <div className="bestseller-details">
            <h2 className="bestseller-title">Dot Com Secrets</h2>
            <p className="bestseller-author">By Russell Brunson</p>
            <div className="bestseller-rating"></div>
            <p className="bestseller-description">
              The Underground Playbook For Growing Your Company Online With
              Sales Funnels. This book walks you through the exact strategies
              that helped companies grow from zero to generating millions in
              revenue.
            </p>
            <div className="bestseller-meta">
              <div className="meta-item">
                <span className="meta-label">Pages:</span>
                <span className="meta-value">384</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Published:</span>
                <span className="meta-value">2015</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Category:</span>
                <span className="meta-value">Marketing</span>
              </div>
            </div>
            <button
              className="bestseller-button"
              onClick={() => navigate("/books?id=65009709000001")}
            >
              Read More
            </button>
          </div>
        </div>

        <div className="featured-section">
          <h2 className="section-title">Featured Books</h2>
          <p className="section-subtitle">
            Discover our most popular titles this month
          </p>

          <div className="featured-books-container">
            {featuredBooks.map((book, index) => (
              <div key={index} className="featured-book">
                <ProductCard book={book} />
              </div>
            ))}
          </div>

          <button className="view-all-btn" onClick={() => navigate("/books")}>
            View All Books
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Home
