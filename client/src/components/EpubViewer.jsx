import React, { useEffect, useRef, useState, useCallback } from 'react';
import ePub from 'epubjs';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, Minimize, Moon, Sun, Search, Bookmark, List } from 'lucide-react';
import './EpubViewer.css';

const EpubViewer = ({ epubUrl, onError }) => {
  const viewerRef = useRef(null);
  const [book, setBook] = useState(null);
  const [rendition, setRendition] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [toc, setToc] = useState([]);
  const [showToc, setShowToc] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [scale, setScale] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef(null);

  // Function to toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Function to handle keyboard navigation
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'ArrowRight') {
      nextPage();
    } else if (e.key === 'ArrowLeft') {
      prevPage();
    }
  }, [rendition]);

  // Load and render the EPUB
  useEffect(() => {
    const fetchAndRender = async () => {
      setIsLoading(true);
      try {
        console.log("Fetching EPUB from URL:", epubUrl);

        // Try different approaches to load the EPUB
        let newBook;

        try {
          // First approach: Try loading directly from URL
          newBook = ePub(epubUrl);
          console.log("Loading EPUB directly from URL");
        } catch (directLoadError) {
          console.error("Direct loading failed, trying fetch approach:", directLoadError);

          try {
            // Second approach: Try fetching with CORS mode
            const response = await fetch(epubUrl, {
              mode: 'cors',
              credentials: 'same-origin',
              headers: {
                'Accept': 'application/epub+zip'
              }
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();
            newBook = ePub(blob);
            console.log("EPUB loaded via fetch blob");
          } catch (fetchError) {
            console.error("Fetch approach failed:", fetchError);

            // Third approach: Try with no-cors mode
            const noCorsResponse = await fetch(epubUrl, {
              mode: 'no-cors'
            });
            const noCorsBlob = await noCorsResponse.blob();
            newBook = ePub(noCorsBlob);
            console.log("EPUB loaded via no-cors fetch");
          }
        }

        if (!newBook) {
          throw new Error("Failed to load EPUB book");
        }

        setBook(newBook);
        console.log("Book loaded:", newBook);

        // Create a rendition
        const newRendition = newBook.renderTo(viewerRef.current, {
          width: '100%',
          height: '100%',
          spread: 'auto',
          flow: 'paginated',
        });

        setRendition(newRendition);

        // Apply theme based on dark mode
        if (darkMode) {
          newRendition.themes.default({
            body: {
              background: '#222',
              color: '#eee'
            },
            'a': { color: '#6699ff' }
          });
        } else {
          newRendition.themes.default({
            body: {
              background: '#fff',
              color: '#000'
            },
            'a': { color: '#0066cc' }
          });
        }

        // Display the book
        await newRendition.display();
        console.log('Book displayed');

        // Get the table of contents
        try {
          const tocData = await newBook.loaded.navigation;
          if (tocData && tocData.toc) {
            setToc(tocData.toc);
          }
        } catch (tocError) {
          console.warn("Could not load table of contents:", tocError);
          setToc([]);
        }

        // Set up locations for pagination
        try {
          await newBook.locations.generate(1024);
          setTotalPages(newBook.locations.total);
        } catch (locError) {
          console.warn("Could not generate locations:", locError);
          setTotalPages(0);
        }

        // Set up event listeners for location changes
        newRendition.on('relocated', (location) => {
          setCurrentLocation(location.start.cfi);
          try {
            const pageNum = newBook.locations.locationFromCfi(location.start.cfi);
            setCurrentPage(pageNum !== -1 ? pageNum + 1 : 1);
          } catch (pageError) {
            console.warn("Could not determine page number:", pageError);
            setCurrentPage(1);
          }
        });

        // Add keyboard event listeners
        window.addEventListener('keydown', handleKeyPress);

        setIsLoading(false);
      } catch (error) {
        console.error('EPUB rendering error:', error);
        setIsLoading(false);

        // Call onError callback if provided
        if (typeof onError === 'function') {
          onError(error);
        } else {
          alert(`Error loading EPUB: ${error.message}. Please try again or contact support.`);
        }
      }
    };

    fetchAndRender();

    // Cleanup function
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      if (book) {
        try {
          book.destroy();
        } catch (e) {
          console.warn("Error destroying book:", e);
        }
      }
    };
  }, [epubUrl, darkMode, handleKeyPress]);

  // Navigation functions
  const nextPage = () => {
    if (rendition) {
      rendition.next();
    }
  };

  const prevPage = () => {
    if (rendition) {
      rendition.prev();
    }
  };

  // Go to specific location
  const goToLocation = (href) => {
    if (rendition) {
      rendition.display(href);
      setShowToc(false);
    }
  };

  // Zoom functions
  const zoomIn = () => {
    if (scale < 200) {
      const newScale = scale + 10;
      setScale(newScale);
      if (rendition) {
        rendition.themes.fontSize(`${newScale}%`);
      }
    }
  };

  const zoomOut = () => {
    if (scale > 50) {
      const newScale = scale - 10;
      setScale(newScale);
      if (rendition) {
        rendition.themes.fontSize(`${newScale}%`);
      }
    }
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Bookmark functions
  const addBookmark = () => {
    if (currentLocation && !bookmarks.includes(currentLocation)) {
      const newBookmarks = [...bookmarks, currentLocation];
      setBookmarks(newBookmarks);
      localStorage.setItem('epub-bookmarks', JSON.stringify(newBookmarks));
    }
  };

  const removeBookmark = (cfi) => {
    const newBookmarks = bookmarks.filter(bookmark => bookmark !== cfi);
    setBookmarks(newBookmarks);
    localStorage.setItem('epub-bookmarks', JSON.stringify(newBookmarks));
  };

  // Load bookmarks from localStorage
  useEffect(() => {
    const savedBookmarks = localStorage.getItem('epub-bookmarks');
    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks));
    }
  }, []);

  // Search function
  const handleSearch = async () => {
    if (!book || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await book.search(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  };

  return (
    <div className={`epub-viewer-container ${darkMode ? 'dark-mode' : 'light-mode'} ${isFullscreen ? 'fullscreen' : ''}`} ref={containerRef}>
      <div className="epub-viewer-header">
        <h2>EPUB Viewer</h2>
        <div className="epub-viewer-controls">
          <button onClick={() => setShowToc(!showToc)} title="Table of Contents">
            <List size={20} />
          </button>
          <button onClick={() => setShowSearch(!showSearch)} title="Search">
            <Search size={20} />
          </button>
          <button onClick={addBookmark} title="Add Bookmark">
            <Bookmark size={20} />
          </button>
          <button onClick={() => setShowBookmarks(!showBookmarks)} title="Show Bookmarks">
            <Bookmark size={20} fill={showBookmarks ? "#6699ff" : "none"} />
          </button>
          <button onClick={zoomOut} title="Zoom Out">
            <ZoomOut size={20} />
          </button>
          <span className="zoom-level">{scale}%</span>
          <button onClick={zoomIn} title="Zoom In">
            <ZoomIn size={20} />
          </button>
          <button onClick={toggleDarkMode} title={darkMode ? "Light Mode" : "Dark Mode"}>
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={toggleFullscreen} title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>
      </div>

      <div className="epub-viewer-content">
        {showToc && (
          <div className="epub-toc">
            <h3>Table of Contents</h3>
            <ul>
              {toc.map((chapter, index) => (
                <li key={index}>
                  <button onClick={() => goToLocation(chapter.href)}>
                    {chapter.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {showBookmarks && (
          <div className="epub-bookmarks">
            <h3>Bookmarks</h3>
            {bookmarks.length > 0 ? (
              <ul>
                {bookmarks.map((bookmark, index) => (
                  <li key={index}>
                    <button onClick={() => goToLocation(bookmark)}>
                      Bookmark {index + 1}
                    </button>
                    <button onClick={() => removeBookmark(bookmark)} className="remove-bookmark">
                      &times;
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No bookmarks yet</p>
            )}
          </div>
        )}

        {showSearch && (
          <div className="epub-search">
            <h3>Search</h3>
            <div className="search-input">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search in book..."
              />
              <button onClick={handleSearch}>Search</button>
            </div>
            {searchResults.length > 0 ? (
              <ul className="search-results">
                {searchResults.map((result, index) => (
                  <li key={index}>
                    <button onClick={() => goToLocation(result.cfi)}>
                      Match {index + 1}
                    </button>
                  </li>
                ))}
              </ul>
            ) : searchQuery ? (
              <p>No results found</p>
            ) : null}
          </div>
        )}

        <div className="epub-main-content">
          {isLoading ? (
            <div className="epub-loading">
              <div className="loading-spinner"></div>
              <p>Loading EPUB book...</p>
              <small>This may take a moment depending on the file size</small>
            </div>
          ) : (
            <>
              <div
                ref={viewerRef}
                className="epub-viewer"
              />

              <div className="epub-navigation">
                <button onClick={prevPage} disabled={currentPage <= 1}>
                  <ChevronLeft size={24} />
                </button>
                <span className="page-info">
                  Page {currentPage} of {totalPages || '?'}
                </span>
                <button onClick={nextPage} disabled={currentPage >= totalPages}>
                  <ChevronRight size={24} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EpubViewer;
