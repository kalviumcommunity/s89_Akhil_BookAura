import React, { useEffect, useRef } from 'react';
import ePub from 'epubjs';
import './EpubViewer.css';

/**
 * A simplified EPUB viewer component that focuses on basic functionality
 * This is used as a fallback when the main viewer has issues
 */
const SimpleEpubViewer = ({ epubUrl }) => {
  const viewerRef = useRef(null);
  const bookRef = useRef(null);
  const renditionRef = useRef(null);

  useEffect(() => {
    const loadBook = async () => {
      try {
        console.log("SimpleEpubViewer: Loading book from URL:", epubUrl);
        
        // Try to load the book directly
        try {
          bookRef.current = ePub(epubUrl);
        } catch (error) {
          console.error("SimpleEpubViewer: Direct loading failed, trying fetch:", error);
          
          // Try fetching the book
          const response = await fetch(epubUrl);
          const blob = await response.blob();
          bookRef.current = ePub(blob);
        }
        
        // Render the book
        renditionRef.current = bookRef.current.renderTo(viewerRef.current, {
          width: '100%',
          height: '100%',
          flow: 'paginated',
        });
        
        // Display the book
        await renditionRef.current.display();
        console.log("SimpleEpubViewer: Book displayed successfully");
        
        // Add keyboard navigation
        document.addEventListener('keydown', handleKeyPress);
      } catch (error) {
        console.error("SimpleEpubViewer: Error loading book:", error);
        if (viewerRef.current) {
          viewerRef.current.innerHTML = `
            <div style="padding: 20px; color: red;">
              <h3>Error Loading EPUB</h3>
              <p>${error.message}</p>
              <p>Please try again or contact support.</p>
            </div>
          `;
        }
      }
    };
    
    loadBook();
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      if (bookRef.current) {
        try {
          bookRef.current.destroy();
        } catch (e) {
          console.warn("SimpleEpubViewer: Error destroying book:", e);
        }
      }
    };
  }, [epubUrl]);
  
  const handleKeyPress = (e) => {
    if (!renditionRef.current) return;
    
    if (e.key === 'ArrowRight') {
      renditionRef.current.next();
    } else if (e.key === 'ArrowLeft') {
      renditionRef.current.prev();
    }
  };
  
  const nextPage = () => {
    if (renditionRef.current) {
      renditionRef.current.next();
    }
  };
  
  const prevPage = () => {
    if (renditionRef.current) {
      renditionRef.current.prev();
    }
  };

  return (
    <div className="simple-epub-container">
      <div 
        ref={viewerRef} 
        className="simple-epub-viewer"
        style={{ 
          width: '100%', 
          height: 'calc(100% - 50px)',
          backgroundColor: '#fff',
          overflow: 'hidden'
        }}
      />
      
      <div className="simple-epub-controls" style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '10px',
        borderTop: '1px solid #eee',
        backgroundColor: '#f8f9fa'
      }}>
        <button 
          onClick={prevPage}
          style={{
            padding: '5px 15px',
            backgroundColor: '#A67C52',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Previous Page
        </button>
        
        <button 
          onClick={nextPage}
          style={{
            padding: '5px 15px',
            backgroundColor: '#A67C52',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Next Page
        </button>
      </div>
    </div>
  );
};

export default SimpleEpubViewer;
