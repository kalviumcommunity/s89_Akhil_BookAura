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

        // Wait for book to be ready
        console.log("⏳ Waiting for book to be ready...");
        await book.ready;
        console.log("✅ Book is ready!");

        // Ensure the container has dimensions
        if (viewerRef.current) {
          console.log("📐 Container dimensions:", {
            width: viewerRef.current.offsetWidth,
            height: viewerRef.current.offsetHeight
          });
        }

        console.log("🎨 Creating rendition...");
        const rendition = book.renderTo(viewerRef.current, {
          width: viewerRef.current?.offsetWidth || 800,
          height: viewerRef.current?.offsetHeight || 600,
          flow: 'paginated',
          spread: 'none'
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

        // Use the promise-based approach but with proper error handling
        rendition.display().then(() => {
          console.log('🎉 Book displayed successfully!');

          // Check for iframes after successful display
          setTimeout(() => {
            const iframes = viewerRef.current?.querySelectorAll('iframe');
            console.log('📊 Found iframes after display:', iframes?.length || 0);
          }, 1000);

        }).catch((displayError) => {
          console.error('💥 Display promise rejected:', displayError);

          // Try alternative display method
          console.log("🔄 Trying alternative display method...");
          try {
            rendition.display(0); // Display first chapter
            console.log("✅ Alternative display method executed");
          } catch (altError) {
            console.error("💥 Alternative display also failed:", altError);
          }
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
