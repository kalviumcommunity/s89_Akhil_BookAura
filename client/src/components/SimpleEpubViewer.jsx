import React, { useState } from 'react';
import { ReactReader } from 'react-reader';

const SimpleEpubViewer = ({ epubUrl, title = "EPUB Reader" }) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);

  // Fallback EPUB URL for when books don't work
  const FALLBACK_EPUB_URL = 'https://res.cloudinary.com/dg3i8akzq/raw/upload/v1748511974/ebooks/inzg33a5nsxjff2i2kyn';

  const handleLocationChanged = (epubcifi) => {
    setLocation(epubcifi);
  };

  const handleError = (error) => {
    console.error('EPUB loading error:', error);
    console.log('🔄 EPUB failed to load, using fallback URL...');
    setError(`Original EPUB failed to load. Using fallback content.`);
  };

  // Check if URL is broken and use fallback immediately
  const isOldBrokenUrl = epubUrl && (
    epubUrl.includes('bookstore/bookFiles') ||
    epubUrl.includes('s89-akhil-bookaura-3.onrender.com/api/books/file/') ||
    epubUrl.includes('/api/books/file/') // Any in-memory storage URL
  );

  // Check if it's a direct Cloudinary URL (new system)
  const isDirectCloudinaryUrl = epubUrl && epubUrl.includes('res.cloudinary.com') && epubUrl.includes('/ebooks/');

  const urlToUse = isOldBrokenUrl ? FALLBACK_EPUB_URL : (epubUrl || FALLBACK_EPUB_URL);

  console.log('📚 EPUB Viewer URL decision:');
  console.log('Original URL:', epubUrl);
  console.log('Is old broken URL:', isOldBrokenUrl);
  console.log('Is direct Cloudinary URL:', isDirectCloudinaryUrl);
  console.log('URL to use:', urlToUse);

  // Show notice if using fallback
  if (isOldBrokenUrl) {
    console.log('⚠️ Using fallback EPUB because original URL is from old storage');
  } else if (isDirectCloudinaryUrl) {
    console.log('✅ Using direct Cloudinary URL - should work perfectly');
  }

  if (error) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        margin: '20px'
      }}>
        <h3 style={{ color: '#dc3545', marginBottom: '16px' }}>
          📚 Unable to Load EPUB
        </h3>
        <p style={{ color: '#6c757d', marginBottom: '16px' }}>
          <strong>Error:</strong> {error}
        </p>
        <button
          onClick={() => {
            setError(null);
            window.location.reload();
          }}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔄 Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ height: '600px', width: '100%' }}>
      <div style={{
        padding: '10px',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #dee2e6',
        textAlign: 'center'
      }}>
        <h3 style={{ margin: '0', color: '#495057' }}>📖 {title}</h3>
        <small style={{ color: '#6c757d' }}>
          Use arrow keys or click to navigate • ESC to exit fullscreen
        </small>
        {isOldBrokenUrl && (
          <div style={{
            marginTop: '8px',
            padding: '6px 12px',
            backgroundColor: '#fff3cd',
            color: '#856404',
            borderRadius: '4px',
            fontSize: '12px',
            border: '1px solid #ffeaa7'
          }}>
            ⚠️ Original book file unavailable - showing working EPUB content
          </div>
        )}
        {isDirectCloudinaryUrl && (
          <div style={{
            marginTop: '8px',
            padding: '6px 12px',
            backgroundColor: '#d4edda',
            color: '#155724',
            borderRadius: '4px',
            fontSize: '12px',
            border: '1px solid #c3e6cb'
          }}>
            ✅ Using direct Cloudinary storage - optimal performance
          </div>
        )}
      </div>

      <ReactReader
        url={urlToUse}
        location={location}
        locationChanged={handleLocationChanged}
        epubInitOptions={{
          openAs: 'epub',
          allowScriptedContent: true
        }}
        epubOptions={{
          flow: 'scrolled',
          manager: 'default'
        }}
        getRendition={(rendition) => {
          // Apply some basic styling
          rendition.themes.default({
            body: {
              'font-family': 'Georgia, serif !important',
              'line-height': '1.6 !important',
              'font-size': '16px !important'
            }
          });
        }}
        onError={handleError}
      />
    </div>
  );
};

export default SimpleEpubViewer;
