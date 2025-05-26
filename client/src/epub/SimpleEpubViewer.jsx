import React, { useEffect, useRef, useState } from 'react';
import ePub from 'epubjs';

const SimpleEpubViewer = ({ epubUrl }) => {
  const viewerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAndRender = async () => {
      if (!epubUrl) return;
      
      setIsLoading(true);
      setError(null);

      try {
        console.log("📚 Loading EPUB from:", epubUrl);

        // Use your exact working method
        const response = await fetch(epubUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch EPUB: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        console.log("📦 Blob created, size:", blob.size);

        const book = ePub(blob);
        console.log("📖 Book loaded:", book);

        const rendition = book.renderTo(viewerRef.current, {
          width: '100%',
          height: '100%',
        });

        // Fix sandbox issue (from your working code)
        rendition.hooks.content.register((contents) => {
          const iframe = contents.iframe;
          if (iframe && iframe.sandbox) {
            iframe.sandbox = 'allow-same-origin allow-scripts';
          }
        });

        await rendition.display();
        console.log('✅ Book displayed successfully');

        setIsLoading(false);

      } catch (error) {
        console.error('❌ EPUB rendering error:', error);
        setError(`Failed to load EPUB: ${error.message}`);
        setIsLoading(false);
      }
    };

    fetchAndRender();
  }, [epubUrl]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        padding: '20px'
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
        <p style={{ fontSize: '18px', marginBottom: '10px' }}>Loading your book...</p>
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
        margin: '20px'
      }}>
        <h2 style={{ color: '#856404', marginBottom: '15px' }}>📚 Book Loading Issue</h2>
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
    <div>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>EPUB Viewer</h2>
      <div
        ref={viewerRef}
        style={{
          width: '100%',
          height: '600px',
          border: '1px solid #ccc',
          padding: '10px',
          overflow: 'auto',
          backgroundColor: '#f0f0f0',
        }}
      />
    </div>
  );
};

export default SimpleEpubViewer;
