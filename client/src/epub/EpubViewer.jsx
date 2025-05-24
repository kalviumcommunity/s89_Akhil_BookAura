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
    const fetchAndRender = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(epubUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch EPUB: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        const newBook = ePub(blob);
        setBook(newBook);

        await newBook.ready;
        const newRendition = newBook.renderTo(viewerRef.current, {
          width: '100%',
          height: '100%',
          flow: 'paginated',
          spread: 'none'
        });

        setRendition(newRendition);
        await newRendition.display();

        await newBook.locations.generate(1024);
        setTotalPages(newBook.locations.total);

        newRendition.on('relocated', (location) => {
          const pageNum = newBook.locations.locationFromCfi(location.start.cfi);
          setCurrentPage(pageNum !== -1 ? pageNum + 1 : 1);
        });

        window.addEventListener('keydown', handleKeyPress);
      } catch (err) {
        console.error("Error loading EPUB:", err);
        setError(err.message || "Failed to load EPUB book");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndRender();

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      if (book) {
        book.destroy();
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
        <div className="loading-container">
          <p>Loading your book...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <h2>Error Loading Book</h2>
          <p>{error}</p>
        </div>
      ) : (
        <div className="epub-main-content">
          <div ref={viewerRef} className="epub-viewer" />
          <div className="epub-navigation">
            <button onClick={() => rendition.prev()} disabled={currentPage <= 1}>
              <ChevronLeft size={24} /> Previous
            </button>
            <span>Page {currentPage} of {totalPages || '?'}</span>
            <button onClick={() => rendition.next()} disabled={currentPage >= totalPages}>
              Next <ChevronRight size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EpubViewer;
