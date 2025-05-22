import React, { useEffect, useRef } from 'react';
import ePub from 'epubjs';

const EpubViewer = ({ epubUrl }) => {
  const viewerRef = useRef(null);

  useEffect(() => {
  const fetchAndRender = async () => {
    try {
      const response = await fetch(epubUrl);
      const blob = await response.blob();

      const book = ePub(blob);
      console.log("Book loaded:", book);

      const rendition = book.renderTo(viewerRef.current, {
        width: '100%',
        height: '100%',
      });

      rendition.display().then(() => {
        console.log('Book displayed');
      });

    } catch (error) {
      console.error('EPUB rendering error:', error);
    }
  };

  fetchAndRender();
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

export default EpubViewer;
