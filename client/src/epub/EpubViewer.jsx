import React, { useEffect, useRef, useState } from 'react';
import ePub from 'epubjs';

const EpubViewer = ({ epubUrl }) => {
  const viewerRef = useRef(null);
  const [book, setBook] = useState(null);
  const [rendition, setRendition] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!epubUrl) return;

    const loadBook = async () => {
      try {
        setLoading(true);
        console.log("📚 Loading EPUB from:", epubUrl);
        
        // Create book
        const newBook = ePub(epubUrl);
        setBook(newBook);

        // Create rendition
        const newRendition = newBook.renderTo(viewerRef.current, {
          width: '100%',
          height: '600px',
          flow: 'scrolled-doc'
        });
        setRendition(newRendition);

        // Display book
        await newRendition.display();
        setLoading(false);
        console.log('🎉 Book displayed successfully');

      } catch (error) {
        console.error('💥 EPUB rendering error:', error);
        setLoading(false);
      }
    };

    loadBook();
  }, [epubUrl]);

  // Navigation functions
  const goNext = () => {
    if (rendition) {
      rendition.next();
    }
  };

  const goPrev = () => {
    if (rendition) {
      rendition.prev();
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <p>Loading book...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* Navigation */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <button
          onClick={goPrev}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          ← Previous
        </button>
        <button
          onClick={goNext}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Next →
        </button>
      </div>

      {/* Book Content */}
      <div
        ref={viewerRef}
        style={{
          width: '100%',
          height: '600px',
          border: '1px solid #ccc',
          backgroundColor: 'white'
        }}
      />

      {/* Bottom Navigation */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button
          onClick={goPrev}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          ← Previous Page
        </button>
        <button
          onClick={goNext}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Next Page →
        </button>
      </div>
    </div>
  );
};

export default EpubViewer;
