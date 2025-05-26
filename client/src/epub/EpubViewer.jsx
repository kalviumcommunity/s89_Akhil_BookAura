// src/components/EpubViewer.js
import React, { useEffect, useRef, useState } from 'react';
import ePub from 'epubjs';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './EpubViewer.css';

const EpubViewer = ({ epubUrl }) => {
  const viewerRef = useRef(null);
  const [book, setBook] = useState(null);
  const [rendition, setRendition] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadEpub = async () => {
      if (!epubUrl) return;

      setIsLoading(true);
      setError(null);

      try {
        console.log("🔄 Starting EPUB load:", epubUrl);

        let book;
        let success = false;

        // Method 1: Try direct URL loading (works for some EPUBs)
        try {
          console.log("📖 Method 1: Direct URL loading...");
          book = ePub(epubUrl);
          await book.ready;
          console.log("✅ Method 1: Success!");
          success = true;
        } catch (error) {
          console.log("❌ Method 1 failed:", error.message);
        }

        // Method 2: Fetch as blob and load (most reliable)
        if (!success) {
          try {
            console.log("📖 Method 2: Fetch as blob...");

            const response = await fetch(epubUrl, {
              method: 'GET',
              mode: 'no-cors' // This bypasses CORS issues
            });

            if (response.type === 'opaque') {
              // no-cors response, try using our proxy
              console.log("📖 Method 2b: Using EPUB proxy...");
              const baseUrl = import.meta.env.VITE_API_URL || 'https://s89-akhil-bookaura-3.onrender.com';
              const proxyUrl = `${baseUrl}/api/pdf/fetch-epub?url=${encodeURIComponent(epubUrl)}`;
              const proxyResponse = await fetch(proxyUrl);
              const blob = await proxyResponse.blob();
              book = ePub(blob);
            } else {
              const blob = await response.blob();
              book = ePub(blob);
            }

            await book.ready;
            console.log("✅ Method 2: Success!");
            success = true;
          } catch (error) {
            console.log("❌ Method 2 failed:", error.message);
          }
        }

        // Method 3: Use a working test EPUB if all else fails
        if (!success) {
          console.log("📖 Method 3: Loading test EPUB...");
          try {
            book = ePub("https://s3.amazonaws.com/moby-dick/moby-dick.epub");
            await book.ready;
            console.log("✅ Method 3: Test EPUB loaded!");
            setError("Could not load your book, showing test book instead. The original file may be corrupted.");
            success = true;
          } catch (error) {
            console.log("❌ Method 3 failed:", error.message);
          }
        }

        if (!success || !book) {
          throw new Error("All loading methods failed");
        }

        setBook(book);

        // Create rendition
        console.log("🎨 Creating rendition...");
        const rendition = book.renderTo(viewerRef.current, {
          width: '100%',
          height: '100%',
          flow: 'paginated',
          spread: 'none'
        });

        setRendition(rendition);

        // Display the book
        console.log("📄 Displaying book...");
        await rendition.display();

        // Generate locations for pagination
        console.log("📊 Generating locations...");
        try {
          await book.locations.generate(1024);
          setTotalPages(book.locations.total);
        } catch (locError) {
          console.warn("⚠️ Could not generate locations:", locError.message);
          setTotalPages(0);
        }

        // Set up navigation
        rendition.on('relocated', (location) => {
          try {
            const pageNum = book.locations.locationFromCfi(location.start.cfi);
            setCurrentPage(pageNum !== -1 ? pageNum + 1 : 1);
          } catch (navError) {
            console.warn("⚠️ Navigation error:", navError.message);
            setCurrentPage(1);
          }
        });

        // Add keyboard navigation
        window.addEventListener('keydown', handleKeyPress);

        console.log("🎉 EPUB loaded successfully!");

      } catch (error) {
        console.error("💥 Final error:", error);
        setError(`Failed to load EPUB: ${error.message}. Please try refreshing the page.`);
      } finally {
        setIsLoading(false);
      }
    };

    loadEpub();

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      if (book) {
        try {
          book.destroy();
        } catch (e) {
          console.warn("⚠️ Cleanup error:", e);
        }
      }
    };
  }, [epubUrl]);

  const handleKeyPress = (e) => {
    if (rendition) {
      if (e.key === 'ArrowRight') {
        rendition.next();
      } else if (e.key === 'ArrowLeft') {
        rendition.prev();
      }
    }
  };

  return (
    <div className="epub-viewer-container">
      {isLoading ? (
        <div className="loading-container" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '400px',
          padding: '20px'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '20px'
          }}></div>
          <p style={{ fontSize: '18px', marginBottom: '10px' }}>Loading your book...</p>
          <p style={{ fontSize: '14px', color: '#666' }}>This may take a moment</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : error ? (
        <div className="error-container" style={{
          padding: '40px',
          textAlign: 'center',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          margin: '20px'
        }}>
          <h2 style={{ color: '#856404', marginBottom: '15px' }}>📚 Book Loading Issue</h2>
          <p style={{ color: '#856404', marginBottom: '20px' }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🔄 Try Again
          </button>
        </div>
      ) : (
        <div className="epub-main-content">
          <div ref={viewerRef} className="epub-viewer" style={{ minHeight: '500px' }} />
          <div className="epub-navigation" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderTop: '1px solid #dee2e6'
          }}>
            <button
              onClick={() => rendition?.prev()}
              disabled={currentPage <= 1}
              style={{
                padding: '8px 16px',
                backgroundColor: currentPage <= 1 ? '#e9ecef' : '#007bff',
                color: currentPage <= 1 ? '#6c757d' : 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <ChevronLeft size={20} /> Previous
            </button>
            <span style={{ fontWeight: 'bold' }}>
              Page {currentPage} of {totalPages || '?'}
            </span>
            <button
              onClick={() => rendition?.next()}
              disabled={currentPage >= totalPages}
              style={{
                padding: '8px 16px',
                backgroundColor: currentPage >= totalPages ? '#e9ecef' : '#007bff',
                color: currentPage >= totalPages ? '#6c757d' : 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              Next <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EpubViewer;
