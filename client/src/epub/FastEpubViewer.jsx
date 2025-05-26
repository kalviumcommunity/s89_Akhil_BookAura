import React, { useEffect, useRef } from 'react';
import ePub from 'epubjs';

const FastEpubViewer = ({ epubUrl }) => {
  const viewerRef = useRef(null);

  useEffect(() => {
    const fetchAndRender = async () => {
      try {
        console.log("🚀 FastEpubViewer received URL:", epubUrl);

        const response = await fetch(epubUrl);
        console.log("🚀 Fetch response:", response.status, response.statusText);

        const blob = await response.blob();
        console.log("🚀 Blob size:", blob.size);

        const book = ePub(blob);
        console.log("🚀 Book loaded:", book);

        const rendition = book.renderTo(viewerRef.current, {
          width: '100%',
          height: '100%',
        });

        // Fix sandbox issue
        rendition.hooks.content.register((contents) => {
          const iframe = contents.iframe;
          if (iframe && iframe.sandbox) {
            iframe.sandbox = 'allow-same-origin allow-scripts';
          }
        });

        // Wait for book to be ready first, then display
        await book.ready;
        console.log('🚀 Book is ready, now displaying...');

        // Try to display the first chapter/section
        await rendition.display();
        console.log('🚀 Book displayed successfully!');

        // Force a resize to ensure proper rendering
        setTimeout(() => {
          rendition.resize();
          console.log('🚀 Book resized for proper display');
        }, 100);

      } catch (error) {
        console.error('EPUB rendering error:', error);
      }
    };

    if (epubUrl) {
      fetchAndRender();
    }
  }, [epubUrl]);

  return (
    <div>
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
