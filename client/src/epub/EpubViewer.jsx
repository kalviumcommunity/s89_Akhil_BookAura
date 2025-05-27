import React, { useEffect, useRef } from 'react';
import ePub from 'epubjs';

const EpubViewer = ({ epubUrl }) => {
  const viewerRef = useRef(null);

  useEffect(() => {
    const fetchAndRender = async () => {
      try {
        console.log("📚 Loading EPUB from:", epubUrl);

        const response = await fetch(epubUrl);
        const blob = await response.blob();
        console.log("✅ EPUB blob fetched:", blob.type, blob.size, "bytes");

        const book = ePub(blob);
        console.log("📖 Book loaded:", book);

        console.log("🎨 Creating rendition...");
        const rendition = book.renderTo(viewerRef.current, {
          width: '100%',
          height: '100%',
        });
        console.log("✅ Rendition created:", rendition);

        // Fix sandbox issue - register the hook first
        console.log("🔧 Registering sandbox fix hook...");
        rendition.hooks.content.register((contents) => {
          console.log("🔧 Hook triggered - applying sandbox fix");
          const iframe = contents.iframe;
          if (iframe && iframe.sandbox) {
            console.log("🔧 Sandbox found, applying fix");
            iframe.sandbox = 'allow-same-origin allow-scripts';
          } else {
            console.log("🔧 No sandbox found on iframe");
          }
        });

        console.log("📄 Starting display...");
        rendition.display().then(() => {
          console.log('🎉 Book displayed successfully');
        }).catch((displayError) => {
          console.error('💥 Display error:', displayError);
        });

      } catch (error) {
        console.error('💥 EPUB rendering error:', error);
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

export default EpubViewer;
