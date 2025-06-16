import React, { useEffect, useRef, useState } from 'react';
import ePub from 'epubjs';
import './EpubViewer.css';

const BasicEpubViewer = ({ epubUrl }) => {
  const viewerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  
  // Book and rendition references
  const bookRef = useRef(null);
  const renditionRef = useRef(null);

  useEffect(() => {
    const loadBook = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log("BasicEpubViewer: Loading EPUB from URL:", epubUrl);
        
        // Create a link element to download the EPUB file
        const link = document.createElement('a');
        link.href = epubUrl;
        link.style.display = 'none';
        
        // Prevent the default behavior (downloading)
        link.setAttribute('download', '');
        link.setAttribute('target', '_blank');
        
        // Add a click event listener to intercept the click
        link.addEventListener('click', (e) => {
          e.preventDefault();
          console.log("Download intercepted");
        });
        
        // Append to the document and trigger a click to start the fetch
        document.body.appendChild(link);
        
        // Instead of clicking the link, we'll fetch the file directly
        const response = await fetch(epubUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/epub+zip, application/octet-stream'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch EPUB: ${response.status} ${response.statusText}`);
        }
        
        // Get the blob from the response
        const blob = await response.blob();
        console.log("EPUB file fetched as blob:", blob.type, blob.size);
        
        // Create a URL for the blob
        const blobUrl = URL.createObjectURL(blob);
        console.log("Created blob URL:", blobUrl);
        
        // Load the book from the blob URL
        bookRef.current = ePub(blobUrl);
        
        // Wait for the book to be ready
        await bookRef.current.ready;
        console.log("EPUB book ready");
        
        // Create a rendition
        renditionRef.current = bookRef.current.renderTo(viewerRef.current, {
          width: '100%',
          height: '100%',
          flow: 'paginated',
          spread: 'none'
        });
        
        // Display the book
        await renditionRef.current.display();
        console.log("EPUB book displayed");
        
        // Set up locations for pagination
        try {
          await bookRef.current.locations.generate(1024);
          setTotalPages(bookRef.current.locations.total);
        } catch (err) {
          console.warn("Could not generate locations:", err);
          setTotalPages(0);
        }
        
        // Set up keyboard navigation
        window.addEventListener('keydown', handleKeyPress);
        
        // Clean up the link element
        document.body.removeChild(link);
        
        setIsLoading(false);
      } catch (err) {
        console.error("Error loading EPUB:", err);
        setError(err.message);
        setIsLoading(false);
      }
    };
    
    loadBook();
    
    // Cleanup function
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      
      if (bookRef.current) {
        try {
          bookRef.current.destroy();
        } catch (e) {
          console.warn("Error destroying book:", e);
        }
      }
      
      // Revoke any blob URLs we created
      if (bookRef.current && bookRef.current.url && bookRef.current.url.startsWith('blob:')) {
        URL.revokeObjectURL(bookRef.current.url);
      }
    };
  }, [epubUrl]);
  
  const handleKeyPress = (e) => {
    if (!renditionRef.current) return;
    
    if (e.key === 'ArrowRight') {
      nextPage();
    } else if (e.key === 'ArrowLeft') {
      prevPage();
    }
  };
  
  const nextPage = () => {
    if (renditionRef.current) {
      renditionRef.current.next();
      if (bookRef.current && bookRef.current.locations) {
        try {
          const loc = renditionRef.current.currentLocation();
          const pageNum = bookRef.current.locations.locationFromCfi(loc.start.cfi);
          setCurrentPage(pageNum + 1);
        } catch (e) {
          console.warn("Error updating page number:", e);
        }
      }
    }
  };
  
  const prevPage = () => {
    if (renditionRef.current) {
      renditionRef.current.prev();
      if (bookRef.current && bookRef.current.locations) {
        try {
          const loc = renditionRef.current.currentLocation();
          const pageNum = bookRef.current.locations.locationFromCfi(loc.start.cfi);
          setCurrentPage(pageNum + 1);
        } catch (e) {
          console.warn("Error updating page number:", e);
        }
      }
    }
  };

  return (
    <div className="basic-epub-viewer">
      {isLoading && (
        <div className="epub-loading">
          <div className="loading-spinner"></div>
          <p>Loading EPUB book...</p>
          <small>This may take a moment depending on the file size</small>
        </div>
      )}
      
      {error && (
        <div className="epub-error">
          <h3>Error Loading EPUB</h3>
          <p>{error}</p>
          <p>Please try again or contact support.</p>
        </div>
      )}
      
      <div 
        ref={viewerRef} 
        className="epub-content"
        style={{ 
          width: '100%', 
          height: 'calc(100% - 50px)',
          display: isLoading || error ? 'none' : 'block'
        }}
      />
      
      {!isLoading && !error && (
        <div className="epub-navigation">
          <button onClick={prevPage}>
            Previous Page
          </button>
          <span className="page-info">
            Page {currentPage} of {totalPages || '?'}
          </span>
          <button onClick={nextPage}>
            Next Page
          </button>
        </div>
      )}
    </div>
  );
};

export default BasicEpubViewer;
