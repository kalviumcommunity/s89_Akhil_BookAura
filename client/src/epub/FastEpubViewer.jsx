import React, { useEffect, useRef, useState } from 'react';
import ePub from 'epubjs';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const FastEpubViewer = ({ epubUrl }) => {
  const viewerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [book, setBook] = useState(null);
  const [rendition, setRendition] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const fetchAndRender = async () => {
      if (!epubUrl) {
        setError("No EPUB URL provided");
        setIsLoading(false);
        return;
      }

      console.log("📚 FastEpubViewer: Starting to load EPUB from:", epubUrl);
      setIsLoading(true);
      setError(null);

      try {
        // Fetch the EPUB file as blob (your working method)
        console.log("📥 Fetching EPUB as blob...");
        const response = await fetch(epubUrl);

        if (!response.ok) {
          throw new Error(`Failed to fetch EPUB: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        console.log("✅ EPUB blob fetched successfully:", blob.type, blob.size, "bytes");

        // Create book from blob
        console.log("📖 Creating ePub book object...");
        const bookInstance = ePub(blob);

        // Wait for book to be ready
        console.log("⏳ Waiting for book to be ready...");
        await bookInstance.ready;
        console.log("✅ Book is ready!");

        setBook(bookInstance);

        // Create rendition
        console.log("🎨 Creating rendition...");
        const renditionInstance = bookInstance.renderTo(viewerRef.current, {
          width: '100%',
          height: '100%',
          flow: 'paginated',
          spread: 'none'
        });

        setRendition(renditionInstance);

        // Fix sandbox issue (critical for EPUB.js)
        console.log("🔧 Setting up iframe sandbox fix...");
        renditionInstance.hooks.content.register((contents) => {
          const iframe = contents.iframe;
          if (iframe && iframe.sandbox) {
            console.log("🔧 Applying sandbox fix to iframe");
            iframe.sandbox = 'allow-same-origin allow-scripts';
          }
        });

        // Display the book
        console.log("📄 Displaying book...");
        await renditionInstance.display();
        console.log("🎉 Book displayed successfully!");

        // Generate locations for pagination
        try {
          console.log("📊 Generating locations for pagination...");
          await bookInstance.locations.generate(1024);
          setTotalPages(bookInstance.locations.total);
          console.log("📊 Pagination ready, total pages:", bookInstance.locations.total);
        } catch (locError) {
          console.warn("⚠️ Could not generate locations:", locError.message);
          setTotalPages(0);
        }

        // Set up navigation tracking
        renditionInstance.on('relocated', (location) => {
          try {
            const pageNum = bookInstance.locations.locationFromCfi(location.start.cfi);
            setCurrentPage(pageNum !== -1 ? pageNum + 1 : 1);
          } catch (navError) {
            console.warn("⚠️ Navigation tracking error:", navError.message);
            setCurrentPage(1);
          }
        });

        setIsLoading(false);

      } catch (error) {
        console.error('💥 EPUB rendering error:', error);
        setError(`Failed to load EPUB: ${error.message}`);
        setIsLoading(false);
      }
    };

    if (epubUrl) {
      fetchAndRender();
    }

    // Cleanup function
    return () => {
      if (book) {
        try {
          book.destroy();
        } catch (e) {
          console.warn("⚠️ Cleanup error:", e);
        }
      }
    };
  }, [epubUrl]);

  const goToPrevious = () => {
    if (rendition) {
      rendition.prev();
    }
  };

  const goToNext = () => {
    if (rendition) {
      rendition.next();
    }
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '600px',
        backgroundColor: '#f9f9f9',
        border: '1px solid #ddd',
        borderRadius: '8px'
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
        <h3>Loading EPUB...</h3>
        <p style={{ color: '#666', fontSize: '14px' }}>Please wait while we load your book</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '8px',
        height: '600px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <h3 style={{ color: '#856404', marginBottom: '15px' }}>📚 Unable to Load Book</h3>
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
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        ref={viewerRef}
        style={{
          width: '100%',
          height: '600px',
          border: '1px solid #ccc',
          backgroundColor: 'white',
          flex: 1,
          minHeight: '500px'
        }}
      />

      {/* Navigation Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderTop: '1px solid #dee2e6'
      }}>
        <button
          onClick={goToPrevious}
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
          onClick={goToNext}
          disabled={currentPage >= totalPages && totalPages > 0}
          style={{
            padding: '8px 16px',
            backgroundColor: (currentPage >= totalPages && totalPages > 0) ? '#e9ecef' : '#007bff',
            color: (currentPage >= totalPages && totalPages > 0) ? '#6c757d' : 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: (currentPage >= totalPages && totalPages > 0) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          Next <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default FastEpubViewer;
