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
      setError(null);

      try {
        console.log("EpubViewer: Loading EPUB from URL:", epubUrl);

        // Simple approach: fetch as blob and load with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch(epubUrl, {
          method: 'GET',
          mode: 'cors',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Failed to fetch EPUB: ${response.status} ${response.statusText}`);
        }

        console.log("EpubViewer: EPUB fetched successfully, creating blob...");
        const blob = await response.blob();
        console.log("EpubViewer: Blob created, size:", blob.size);

        const newBook = ePub(blob);
        setBook(newBook);

        console.log("EpubViewer: Waiting for book to be ready...");
        await newBook.ready;
        console.log("EpubViewer: Book is ready, creating rendition...");

        const newRendition = newBook.renderTo(viewerRef.current, {
          width: '100%',
          height: '100%',
          flow: 'paginated',
          spread: 'none'
        });

        setRendition(newRendition);
        console.log("EpubViewer: Displaying book...");
        await newRendition.display();

        console.log("EpubViewer: Generating locations...");
        await newBook.locations.generate(1024);
        setTotalPages(newBook.locations.total);
        console.log("EpubViewer: Book loaded successfully!");

        newRendition.on('relocated', (location) => {
          const pageNum = newBook.locations.locationFromCfi(location.start.cfi);
          setCurrentPage(pageNum !== -1 ? pageNum + 1 : 1);
        });

        window.addEventListener('keydown', handleKeyPress);
      } catch (err) {
        console.error("EpubViewer: Error loading EPUB:", err);
        setError(`Failed to load EPUB: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (epubUrl) {
      fetchAndRender();
    }

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      if (book) {
        try {
          book.destroy();
        } catch (e) {
          console.warn("EpubViewer: Error destroying book:", e);
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
