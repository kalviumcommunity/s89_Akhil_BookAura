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

        rendition.display().then(() => {
          console.log('🚀 Book displayed successfully!');
        });

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
