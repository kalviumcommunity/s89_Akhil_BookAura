import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ePub from 'epubjs';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import LoadingAnimation from '../components/LoadingAnimation';
import './EpubViewerPage.css';

const EpubViewerPage = () => {
  const { encodedUrl } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const viewerRef = useRef(null);
  const bookRef = useRef(null);
  const renditionRef = useRef(null);

  useEffect(() => {
    const loadBook = async () => {
      if (!encodedUrl) {
        setError("No book URL provided");
        setIsLoading(false);
        return;
      }

      try {
        // Decode the URL
        const bookUrl = decodeURIComponent(encodedUrl);
        console.log("Loading EPUB from URL:", bookUrl);

        // Create the book object
        bookRef.current = ePub(bookUrl);
        
        // Wait for the book to be ready
        await bookRef.current.ready;
        
        // Create a rendition
        renditionRef.current = bookRef.current.renderTo(viewerRef.current, {
          width: '100%',
          height: '100%',
          flow: 'paginated',
          spread: 'none'
        });
        
        // Display the book
        await renditionRef.current.display();
        
        // Set up locations for pagination
        try {
          await bookRef.current.locations.generate(1024);
          setTotalPages(bookRef.current.locations.total);
        } catch (err) {
          console.warn("Could not generate locations:", err);
          setTotalPages(0);
        }
        
        // Set up event listeners for location changes
        renditionRef.current.on('relocated', (location) => {
          try {
            const pageNum = bookRef.current.locations.locationFromCfi(location.start.cfi);
            setCurrentPage(pageNum !== -1 ? pageNum + 1 : 1);
          } catch (e) {
            console.warn("Error updating page number:", e);
            setCurrentPage(1);
          }
        });
        
        // Add keyboard navigation
        window.addEventListener('keydown', handleKeyPress);
        
        setIsLoading(false);
      } catch (err) {
        console.error("Error loading EPUB:", err);
        setError(err.message || "Failed to load EPUB book");
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
    };
  }, [encodedUrl]);
  
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
    }
  };
  
  const prevPage = () => {
    if (renditionRef.current) {
      renditionRef.current.prev();
    }
  };
  
  const goBack = () => {
    navigate(-1);
  };

  return (
    <div className="epub-viewer-page">
      <Navbar />
      
      <div className="epub-viewer-container">
        <div className="epub-header">
          <button className="back-button" onClick={goBack}>
            <ArrowLeft size={20} /> Back to My Books
          </button>
          <h1>EPUB Reader</h1>
        </div>
        
        {isLoading ? (
          <div className="loading-container">
            <LoadingAnimation />
            <p>Loading your book...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <h2>Error Loading Book</h2>
            <p>{error}</p>
            <button className="back-button" onClick={goBack}>
              Go Back
            </button>
          </div>
        ) : (
          <div className="epub-content">
            <div 
              ref={viewerRef} 
              className="epub-viewer"
            />
            
            <div className="epub-navigation">
              <button 
                onClick={prevPage} 
                disabled={currentPage <= 1}
                className="nav-button"
              >
                <ChevronLeft size={24} /> Previous
              </button>
              <span className="page-info">
                Page {currentPage} of {totalPages || '?'}
              </span>
              <button 
                onClick={nextPage} 
                disabled={currentPage >= totalPages}
                className="nav-button"
              >
                Next <ChevronRight size={24} />
              </button>
            </div>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default EpubViewerPage;
