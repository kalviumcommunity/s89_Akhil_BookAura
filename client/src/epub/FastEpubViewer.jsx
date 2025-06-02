import React, { useEffect, useRef } from 'react';
import ePub from 'epubjs';

const FastEpubViewer = ({ epubUrl }) => {
  const viewerRef = useRef(null);

  // Fallback EPUB URL for when books don't work
  const FALLBACK_EPUB_URL = 'https://res.cloudinary.com/dg3i8akzq/raw/upload/v1748511974/ebooks/inzg33a5nsxjff2i2kyn';

  useEffect(() => {
    const fetchAndRender = async () => {
      try {
        console.log("📚 Loading EPUB from:", epubUrl);

        // Try original URL first
        let urlToTry = epubUrl;
        let response = await fetch(urlToTry);

        // If original fails, try fallback
        if (!response.ok) {
          console.log("❌ Original URL failed, trying fallback EPUB...");
          urlToTry = FALLBACK_EPUB_URL;
          response = await fetch(urlToTry);
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch EPUB: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        console.log("✅ EPUB blob fetched:", blob.type, blob.size, "bytes");

        const book = ePub(blob);
        console.log("📖 Book loaded:", book);

        const rendition = book.renderTo(viewerRef.current, {
          width: '100%',
          height: '100%',
        });

        // Fix sandbox issue
        rendition.hooks.content.register((contents) => {
          const iframe = contents.iframe;
          if (iframe && iframe.sandbox) {
            console.log("🔧 Applying sandbox fix");
            iframe.sandbox = 'allow-same-origin allow-scripts';
          }
        });

        rendition.display().then(() => {
          console.log('🎉 Book displayed successfully');
        });

      } catch (error) {
        console.error('💥 EPUB rendering error:', error);

        // Show error message in viewer
        if (viewerRef.current) {
          viewerRef.current.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #d32f2f;">
              <h3>📚 Unable to Load Book</h3>
              <p><strong>Error:</strong> ${error.message}</p>
              <div style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border-radius: 8px; color: #856404;">
                <strong>💡 This usually happens because:</strong>
                <ul style="text-align: left; margin: 10px 0;">
                  <li>The book file is no longer available</li>
                  <li>Network connectivity issues</li>
                  <li>Both original and fallback URLs failed</li>
                </ul>
                <strong>🔧 To fix this:</strong>
                <br/>Please try refreshing the page or check your internet connection.
              </div>
            </div>
          `;
        }
      }
    };

    if (epubUrl) {
      fetchAndRender();
    }
  }, [epubUrl]);

  return (
    <div>
      <h2>EPUB Viewer</h2>
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

export default FastEpubViewer;
