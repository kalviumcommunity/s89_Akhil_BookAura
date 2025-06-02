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

        // Try original URL first
        try {
          console.log('🔍 URL analysis:');
          console.log('- Is new in-memory storage URL:', epubUrl?.includes('/api/books/file/'));
          console.log('- Is old Cloudinary URL:', epubUrl?.includes('cloudinary.com'));

          const newBook = ePub(epubUrl);
          setBook(newBook);

          const newRendition = newBook.renderTo(viewerRef.current, {
            width: '100%',
            height: '600px',
            flow: 'scrolled-doc'
          });
          setRendition(newRendition);

          await newRendition.display();
          setLoading(false);
          console.log('🎉 Book displayed successfully from:', epubUrl);
          return;
        } catch (originalError) {
          console.log('❌ Original URL failed:', originalError.message);
          console.log('❌ Failed URL was:', epubUrl);

          // Try multiple fallback EPUBs
          console.log('🔄 Trying fallback EPUBs...');

          const fallbackUrls = [
            'https://res.cloudinary.com/dg3i8akzq/raw/upload/v1746792433/bookstore/bookFiles/zspcnbobqoimglk83yz6',
            'https://www.gutenberg.org/ebooks/74.epub.noimages',
            'https://www.gutenberg.org/ebooks/1342.epub.noimages',
            'https://standardebooks.org/ebooks/jane-austen/pride-and-prejudice/downloads/jane-austen_pride-and-prejudice.epub'
          ];

          let fallbackWorked = false;

          for (const fallbackUrl of fallbackUrls) {
            try {
              console.log(`🔄 Trying fallback: ${fallbackUrl}`);
              const fallbackBook = ePub(fallbackUrl);
              setBook(fallbackBook);

              const fallbackRendition = fallbackBook.renderTo(viewerRef.current, {
                width: '100%',
                height: '600px',
                flow: 'scrolled-doc'
              });
              setRendition(fallbackRendition);

              await fallbackRendition.display();
              setLoading(false);
              console.log('✅ Fallback EPUB loaded successfully from:', fallbackUrl);
              alert('📚 Loading a sample book as the original file is not available. This happens when the server restarts. Please upload books again for the best experience.');
              fallbackWorked = true;
              break;
            } catch (fallbackError) {
              console.log(`❌ Fallback failed for ${fallbackUrl}:`, fallbackError.message);
              continue;
            }
          }

          if (!fallbackWorked) {
            console.error('💥 All fallbacks failed');
            setLoading(false);
            alert('❌ Unable to load any book. The server may have restarted and cleared the files. Please upload books again.');
          }
        }

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
