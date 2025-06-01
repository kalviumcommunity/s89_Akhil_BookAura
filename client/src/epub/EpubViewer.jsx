import React, { useEffect, useRef } from 'react';
import ePub from 'epubjs';

const EpubViewer = ({ epubUrl }) => {
  const viewerRef = useRef(null);

  useEffect(() => {
    const fetchAndRender = async () => {
      let book, rendition;

      try {
        console.log("📚 Loading EPUB from:", epubUrl);
        console.log("🔍 URL analysis:");
        console.log("- Is new in-memory storage URL:", epubUrl?.includes('/api/books/file/'));
        console.log("- Is old Cloudinary URL:", epubUrl?.includes('cloudinary.com'));

        // Try the original URL first
        try {
          const response = await fetch(epubUrl);
          const blob = await response.blob();
          console.log("✅ EPUB blob fetched:", blob.type, blob.size, "bytes");

          book = ePub(blob);
          console.log("📖 Book loaded:", book);

          // Test if the book can be rendered (timeout after 3 seconds)
          console.log("🧪 Testing if book can be rendered...");

          const testRendition = book.renderTo(viewerRef.current, {
            width: 800,
            height: 600,
            flow: 'paginated',
            spread: 'none'
          });

          // Try to display with a timeout
          const displayPromise = testRendition.display();
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Display timeout')), 3000)
          );

          await Promise.race([displayPromise, timeoutPromise]);

          console.log("✅ Original EPUB works! Using it.");
          console.log("🎯 USING ORIGINAL URL:", epubUrl);
          rendition = testRendition;

        } catch (originalError) {
          console.log("❌ Original EPUB failed:", originalError.message);
          console.error("💥 EPUB rendering error:", originalError);
          return; // Don't use fallback, just fail gracefully
        }

        // Skip waiting for book.ready and proceed directly
        console.log("🚀 Proceeding with final setup...");

        // Ensure the container has dimensions
        if (viewerRef.current) {
          console.log("📐 Container dimensions:", {
            width: viewerRef.current.offsetWidth,
            height: viewerRef.current.offsetHeight
          });
        }

        console.log("✅ Rendition ready:", rendition);

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
