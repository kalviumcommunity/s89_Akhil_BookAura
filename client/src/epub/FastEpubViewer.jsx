import React, { useEffect, useRef, useState, useCallback } from 'react';
import ePub from 'epubjs';

const FastEpubViewer = ({ epubUrl }) => {
  const viewerRef = useRef(null);
  const bookRef = useRef(null);
  const renditionRef = useRef(null);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(0);
  const [totalLocations, setTotalLocations] = useState(0);
  const [fontSize, setFontSize] = useState(100);
  const [theme, setTheme] = useState('light');
  const [showToc, setShowToc] = useState(false);
  const [toc, setToc] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [viewMode, setViewMode] = useState('scrolled-doc'); // 'scrolled-doc' or 'paginated'
  const [progress, setProgress] = useState(0);
  const [currentEpubUrl, setCurrentEpubUrl] = useState(epubUrl);

  // Fallback EPUB URL for when books don't work
  const FALLBACK_EPUB_URL = 'https://res.cloudinary.com/dg3i8akzq/raw/upload/v1748511974/ebooks/inzg33a5nsxjff2i2kyn';

  // Button styles
  const buttonStyle = {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#2196F3',
    color: 'white',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'background-color 0.2s'
  };

  const linkButtonStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: '14px',
    padding: '4px 0',
    width: '100%',
    textDecoration: 'underline'
  };

  const navButtonStyle = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: 'white',
    fontSize: '20px',
    cursor: 'pointer',
    zIndex: 1000,
    transition: 'background-color 0.2s'
  };

  // Navigation functions
  const nextPage = useCallback(() => {
    if (renditionRef.current) {
      renditionRef.current.next();
    }
  }, []);

  const prevPage = useCallback(() => {
    if (renditionRef.current) {
      renditionRef.current.prev();
    }
  }, []);

  // Font size controls
  const increaseFontSize = useCallback(() => {
    if (fontSize < 200) {
      const newSize = fontSize + 10;
      setFontSize(newSize);
      if (renditionRef.current) {
        renditionRef.current.themes.fontSize(`${newSize}%`);
      }
    }
  }, [fontSize]);

  const decreaseFontSize = useCallback(() => {
    if (fontSize > 50) {
      const newSize = fontSize - 10;
      setFontSize(newSize);
      if (renditionRef.current) {
        renditionRef.current.themes.fontSize(`${newSize}%`);
      }
    }
  }, [fontSize]);

  // Theme toggle
  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);

    if (renditionRef.current) {
      if (newTheme === 'dark') {
        renditionRef.current.themes.default({
          body: {
            background: '#1a1a1a !important',
            color: '#e0e0e0 !important',
            'line-height': '1.6 !important'
          },
          'p': { color: '#e0e0e0 !important' },
          'h1, h2, h3, h4, h5, h6': { color: '#ffffff !important' },
          'a': { color: '#64b5f6 !important' }
        });
      } else {
        renditionRef.current.themes.default({
          body: {
            background: '#ffffff !important',
            color: '#333333 !important',
            'line-height': '1.6 !important'
          },
          'p': { color: '#333333 !important' },
          'h1, h2, h3, h4, h5, h6': { color: '#000000 !important' },
          'a': { color: '#1976d2 !important' }
        });
      }
    }
  }, [theme]);

  // Add bookmark
  const addBookmark = useCallback(() => {
    if (renditionRef.current && currentLocation) {
      const bookmark = {
        id: Date.now(),
        location: currentLocation,
        timestamp: new Date().toLocaleString(),
        progress: Math.round(progress)
      };
      setBookmarks(prev => [...prev, bookmark]);
      alert('Bookmark added!');
    }
  }, [currentLocation, progress]);

  // Go to bookmark
  const goToBookmark = useCallback((location) => {
    if (renditionRef.current) {
      renditionRef.current.display(location);
      setShowBookmarks(false);
    }
  }, []);

  // Search functionality
  const performSearch = useCallback(async () => {
    if (!searchTerm || !bookRef.current) return;

    try {
      const results = await bookRef.current.search(searchTerm);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  }, [searchTerm]);

  // Go to search result
  const goToSearchResult = useCallback((cfi) => {
    if (renditionRef.current) {
      renditionRef.current.display(cfi);
      setShowSearch(false);
    }
  }, []);

  // Go to TOC item
  const goToTocItem = useCallback((href) => {
    if (renditionRef.current) {
      renditionRef.current.display(href);
      setShowToc(false);
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT') return; // Don't interfere with input fields

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          prevPage();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextPage();
          break;
        case 'f':
        case 'F':
          if (e.ctrlKey) {
            e.preventDefault();
            setShowSearch(!showSearch);
          }
          break;
        case 't':
        case 'T':
          if (e.ctrlKey) {
            e.preventDefault();
            setShowToc(!showToc);
          }
          break;
        case 'b':
        case 'B':
          if (e.ctrlKey) {
            e.preventDefault();
            addBookmark();
          }
          break;
        case 'd':
        case 'D':
          if (e.ctrlKey) {
            e.preventDefault();
            toggleTheme();
          }
          break;
        case '+':
        case '=':
          if (e.ctrlKey) {
            e.preventDefault();
            increaseFontSize();
          }
          break;
        case '-':
          if (e.ctrlKey) {
            e.preventDefault();
            decreaseFontSize();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [nextPage, prevPage, showSearch, showToc, addBookmark, toggleTheme, increaseFontSize, decreaseFontSize]);

  useEffect(() => {
    const fetchAndRender = async (urlToTry = currentEpubUrl) => {
      try {
        setLoading(true);
        setError(null);
        console.log("📚 Loading EPUB from:", urlToTry);

        const response = await fetch(urlToTry);

        if (!response.ok) {
          // If the original URL fails and we haven't tried the fallback yet
          if (urlToTry !== FALLBACK_EPUB_URL) {
            console.log("❌ Original URL failed, trying fallback EPUB...");
            setCurrentEpubUrl(FALLBACK_EPUB_URL);
            return fetchAndRender(FALLBACK_EPUB_URL);
          }
          throw new Error(`Failed to fetch EPUB: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        console.log("✅ EPUB blob fetched:", blob.type, blob.size, "bytes");

        const book = ePub(blob);
        bookRef.current = book;
        console.log("📖 Book loaded:", book);

        // Load table of contents
        book.loaded.navigation.then((nav) => {
          setToc(nav.toc);
        });

        const rendition = book.renderTo(viewerRef.current, {
          width: '100%',
          height: '100%',
          flow: viewMode, // 'scrolled-doc' for continuous scroll, 'paginated' for pages
          spread: 'none'
        });

        renditionRef.current = rendition;

        // Apply initial theme
        rendition.themes.default({
          body: {
            background: '#ffffff !important',
            color: '#333333 !important',
            'line-height': '1.6 !important',
            'font-family': 'Georgia, serif !important'
          }
        });

        // Fix sandbox issue
        rendition.hooks.content.register((contents) => {
          const iframe = contents.iframe;
          if (iframe && iframe.sandbox) {
            console.log("🔧 Applying sandbox fix");
            iframe.sandbox = 'allow-same-origin allow-scripts';
          }
        });

        // Track location changes
        rendition.on('locationChanged', (location) => {
          setCurrentLocation(location.start.cfi);

          // Calculate progress
          if (book.locations && book.locations.total) {
            const currentPage = book.locations.locationFromCfi(location.start.cfi);
            const progressPercent = (currentPage / book.locations.total) * 100;
            setProgress(progressPercent);
          }
        });

        // Generate locations for progress tracking
        book.ready.then(() => {
          return book.locations.generate(1024);
        }).then((locations) => {
          setTotalLocations(locations.total);
          console.log('📍 Generated', locations.total, 'locations');
        });

        rendition.display().then(() => {
          console.log('🎉 Book displayed successfully');
          setLoading(false);
        });

      } catch (error) {
        console.error('💥 EPUB rendering error:', error);

        // If the original URL failed and we haven't tried the fallback yet
        if (urlToTry !== FALLBACK_EPUB_URL) {
          console.log("❌ Original URL failed, trying fallback EPUB...");
          setCurrentEpubUrl(FALLBACK_EPUB_URL);
          return fetchAndRender(FALLBACK_EPUB_URL);
        }

        setError(error.message);
        setLoading(false);

        // Show error message in viewer
        if (viewerRef.current) {
          viewerRef.current.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #d32f2f;">
              <h3>📚 Unable to Load Book</h3>
              <p><strong>Error:</strong> ${error.message}</p>
              <div style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border-radius: 8px; color: #856404;">
                <strong>💡 This usually happens because:</strong>
                <ul style="text-align: left; margin: 10px 0;">
                  <li>The book file is no longer available (server restart)</li>
                  <li>Network connectivity issues</li>
                  <li>The fallback book also failed to load</li>
                </ul>
                <strong>🔧 To fix this:</strong>
                <br/>Please try refreshing the page or check your internet connection.
              </div>
            </div>
          `;
        }
      }
    };

    if (epubUrl) {
      setCurrentEpubUrl(epubUrl);
      fetchAndRender(epubUrl);
    }

    // Cleanup
    return () => {
      if (bookRef.current) {
        try {
          bookRef.current.destroy();
        } catch (e) {
          console.warn('Error destroying book:', e);
        }
      }
    };
  }, [epubUrl, viewMode]);

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      backgroundColor: theme === 'dark' ? '#121212' : '#ffffff',
      color: theme === 'dark' ? '#ffffff' : '#000000',
      minHeight: '100vh'
    }}>
      {/* Header with controls */}
      <div style={{
        padding: '10px 20px',
        borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`,
        backgroundColor: theme === 'dark' ? '#1e1e1e' : '#f8f9fa',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <h2 style={{ margin: '0', fontSize: '18px', flex: '1' }}>📚 EPUB Reader</h2>

        {/* Progress bar */}
        {progress > 0 && (
          <div style={{
            flex: '1',
            minWidth: '200px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
              {Math.round(progress)}%
            </span>
            <div style={{
              flex: '1',
              height: '6px',
              backgroundColor: theme === 'dark' ? '#333' : '#e0e0e0',
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: '#4CAF50',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )}

        {/* Control buttons */}
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowToc(!showToc)}
            style={buttonStyle}
            title="Table of Contents (Ctrl+T)"
          >
            📑 TOC
          </button>

          <button
            onClick={() => setShowSearch(!showSearch)}
            style={buttonStyle}
            title="Search (Ctrl+F)"
          >
            🔍 Search
          </button>

          <button
            onClick={() => setShowBookmarks(!showBookmarks)}
            style={buttonStyle}
            title="Bookmarks"
          >
            🔖 Bookmarks ({bookmarks.length})
          </button>

          <button
            onClick={addBookmark}
            style={buttonStyle}
            title="Add Bookmark (Ctrl+B)"
          >
            ➕ Bookmark
          </button>

          <button
            onClick={decreaseFontSize}
            style={buttonStyle}
            title="Decrease Font Size (Ctrl+-)"
          >
            🔤-
          </button>

          <span style={{ fontSize: '12px', padding: '5px' }}>
            {fontSize}%
          </span>

          <button
            onClick={increaseFontSize}
            style={buttonStyle}
            title="Increase Font Size (Ctrl++)"
          >
            🔤+
          </button>

          <button
            onClick={toggleTheme}
            style={buttonStyle}
            title="Toggle Theme (Ctrl+D)"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          <button
            onClick={() => setViewMode(viewMode === 'scrolled-doc' ? 'paginated' : 'scrolled-doc')}
            style={buttonStyle}
            title="Toggle View Mode"
          >
            {viewMode === 'scrolled-doc' ? '📄' : '📜'}
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div style={{ display: 'flex', height: 'calc(100vh - 80px)' }}>
        {/* Sidebar for TOC/Search/Bookmarks */}
        {(showToc || showSearch || showBookmarks) && (
          <div style={{
            width: '300px',
            borderRight: `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`,
            backgroundColor: theme === 'dark' ? '#1e1e1e' : '#f8f9fa',
            overflow: 'auto',
            padding: '15px'
          }}>
            {/* Table of Contents */}
            {showToc && (
              <div>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>📑 Table of Contents</h3>
                {toc.length > 0 ? (
                  <ul style={{ listStyle: 'none', padding: '0', margin: '0' }}>
                    {toc.map((item, index) => (
                      <li key={index} style={{ marginBottom: '8px' }}>
                        <button
                          onClick={() => goToTocItem(item.href)}
                          style={{
                            ...linkButtonStyle,
                            color: theme === 'dark' ? '#64b5f6' : '#1976d2'
                          }}
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: '#666', fontSize: '14px' }}>No table of contents available</p>
                )}
              </div>
            )}

            {/* Search */}
            {showSearch && (
              <div>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>🔍 Search</h3>
                <div style={{ marginBottom: '15px' }}>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && performSearch()}
                    placeholder="Enter search term..."
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                      borderRadius: '4px',
                      backgroundColor: theme === 'dark' ? '#333' : '#fff',
                      color: theme === 'dark' ? '#fff' : '#000',
                      fontSize: '14px'
                    }}
                  />
                  <button
                    onClick={performSearch}
                    style={{
                      ...buttonStyle,
                      width: '100%',
                      marginTop: '8px'
                    }}
                  >
                    Search
                  </button>
                </div>
                {searchResults.length > 0 && (
                  <div>
                    <p style={{ fontSize: '14px', margin: '0 0 10px 0' }}>
                      Found {searchResults.length} results:
                    </p>
                    <ul style={{ listStyle: 'none', padding: '0', margin: '0' }}>
                      {searchResults.slice(0, 10).map((result, index) => (
                        <li key={index} style={{ marginBottom: '8px' }}>
                          <button
                            onClick={() => goToSearchResult(result.cfi)}
                            style={{
                              ...linkButtonStyle,
                              color: theme === 'dark' ? '#64b5f6' : '#1976d2'
                            }}
                          >
                            {result.excerpt.substring(0, 100)}...
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Bookmarks */}
            {showBookmarks && (
              <div>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>🔖 Bookmarks</h3>
                {bookmarks.length > 0 ? (
                  <ul style={{ listStyle: 'none', padding: '0', margin: '0' }}>
                    {bookmarks.map((bookmark) => (
                      <li key={bookmark.id} style={{
                        marginBottom: '12px',
                        padding: '8px',
                        border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                        borderRadius: '4px',
                        backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f9f9f9'
                      }}>
                        <button
                          onClick={() => goToBookmark(bookmark.location)}
                          style={{
                            ...linkButtonStyle,
                            color: theme === 'dark' ? '#64b5f6' : '#1976d2',
                            marginBottom: '4px'
                          }}
                        >
                          Go to bookmark
                        </button>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {bookmark.timestamp} • {bookmark.progress}%
                        </div>
                        <button
                          onClick={() => setBookmarks(prev => prev.filter(b => b.id !== bookmark.id))}
                          style={{
                            ...buttonStyle,
                            fontSize: '10px',
                            padding: '2px 6px',
                            marginTop: '4px',
                            backgroundColor: '#f44336'
                          }}
                        >
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: '#666', fontSize: '14px' }}>No bookmarks yet</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Main reading area */}
        <div style={{ flex: '1', position: 'relative' }}>
          {loading && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: '#666'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #3498db',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 15px'
              }} />
              <p>📚 Loading EPUB book...</p>
              <p style={{ fontSize: '14px' }}>This may take a moment depending on the file size</p>
            </div>
          )}

          <div
            ref={viewerRef}
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
              display: loading ? 'none' : 'block'
            }}
          />

          {/* Navigation arrows for paginated mode */}
          {viewMode === 'paginated' && !loading && (
            <>
              <button
                onClick={prevPage}
                style={{
                  ...navButtonStyle,
                  left: '20px'
                }}
                title="Previous Page (←)"
              >
                ←
              </button>
              <button
                onClick={nextPage}
                style={{
                  ...navButtonStyle,
                  right: '20px'
                }}
                title="Next Page (→)"
              >
                →
              </button>
            </>
          )}
        </div>
      </div>

      {/* Keyboard shortcuts help */}
      <div style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        fontSize: '11px',
        color: '#666',
        backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
        padding: '5px 8px',
        borderRadius: '4px',
        border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
      }}>
        Shortcuts: ← → (navigate) | Ctrl+F (search) | Ctrl+T (TOC) | Ctrl+B (bookmark) | Ctrl+D (theme)
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default FastEpubViewer;
