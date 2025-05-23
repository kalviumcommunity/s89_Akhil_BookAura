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
    const fetchAndRender = async () => {
      setIsLoading(true);
      try {
        console.log("Fetching EPUB from URL:", epubUrl);

        // Fetch the EPUB file as a blob
        const response = await fetch(epubUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch EPUB: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        console.log("EPUB file fetched as blob:", blob.type, blob.size);

        // Create the book object from the blob
        const newBook = ePub(blob);
        setBook(newBook);

        // Wait for the book to be ready
        await newBook.ready;
        console.log("Book ready:", newBook);

        // Create a rendition
        const newRendition = newBook.renderTo(viewerRef.current, {
          width: '100%',
          height: '100%',
          flow: 'paginated',
          spread: 'none'
        });

        setRendition(newRendition);

        // Fix sandbox issue
        newRendition.hooks.content.register((contents) => {
          const iframe = contents.iframe;
          if (iframe && iframe.sandbox) {
            iframe.sandbox = 'allow-same-origin allow-scripts';
          }
        });

        // Display the book
        await newRendition.display();
        console.log("Book displayed");

        // Set up locations for pagination
        try {
          await newBook.locations.generate(1024);
          setTotalPages(newBook.locations.total);
        } catch (err) {
          console.warn("Could not generate locations:", err);
          setTotalPages(0);
        }

        // Set up event listeners for location changes
        newRendition.on('relocated', (location) => {
          try {
            const pageNum = newBook.locations.locationFromCfi(location.start.cfi);
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
  }, [epubUrl]);

  const handleKeyPress = (e) => {
    if (!rendition) return;

    if (e.key === 'ArrowRight') {
      nextPage();
    } else if (e.key === 'ArrowLeft') {
      prevPage();
    }
  };

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

  return (
    <div className="epub-viewer-container">
      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your book...</p>
          <p className="loading-tip">This may take a moment depending on the file size</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <h2>Error Loading Book</h2>
          <p>{error}</p>
        </div>
      ) : (
        <div className="epub-main-content">
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
  );
};

export default EpubViewer;
