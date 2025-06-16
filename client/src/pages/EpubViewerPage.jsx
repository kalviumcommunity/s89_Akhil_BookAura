import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ePub from 'epubjs';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import LoadingAnimation from '../components/LoadingAnimation';
import './EpubViewerPage.css';

const EpubViewerPage = () => {
  const { encodedUrl } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const viewerRef = useRef(null);
  const bookRef = useRef(null);
  const renditionRef = useRef(null);

  useEffect(() => {
    const loadBook = async () => {
      if (!encodedUrl) {
        setError("No book URL provided");
        setIsLoading(false);
        return;
      }

      try {
        // Decode the URL
        const bookUrl = decodeURIComponent(encodedUrl);
        console.log("Loading EPUB from URL:", bookUrl);

        // Fetch the EPUB file as a blob - THIS IS THE KEY DIFFERENCE
        try {
          // First approach: Try fetching with standard fetch
          const response = await fetch(bookUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch EPUB: ${response.status} ${response.statusText}`);
          }

          const blob = await response.blob();
          console.log("EPUB file fetched as blob:", blob.type, blob.size);

          // Create the book object from the blob
          bookRef.current = ePub(blob);
        } catch (fetchError) {
          console.error("Error fetching as blob, trying direct loading:", fetchError);

          try {
            // Second approach: Try loading directly from URL
            bookRef.current = ePub(bookUrl);
            console.log("Fallback: Loading EPUB directly from URL");
          } catch (directError) {
            console.error("Direct loading failed, trying with iframe approach:", directError);

            // Third approach: Create an iframe to load the EPUB
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            document.body.appendChild(iframe);

            // Set up a message handler to receive the blob
            window.addEventListener('message', async (event) => {
              if (event.data && event.data.type === 'epub-blob') {
                try {
                  bookRef.current = ePub(event.data.blob);
                  document.body.removeChild(iframe);
                  console.log("EPUB loaded via iframe proxy");
                } catch (iframeError) {
                  console.error("Iframe loading failed:", iframeError);
                  throw iframeError;
                }
              }
            }, { once: true });

            // Navigate the iframe to a simple HTML page that will fetch the EPUB
            iframe.src = `data:text/html,
              <html>
                <body>
                  <script>
                    (async function() {
                      try {
                        const response = await fetch("${bookUrl}");
                        const blob = await response.blob();
                        window.parent.postMessage({ type: 'epub-blob', blob }, '*');
                      } catch (e) {
                        console.error("Error in iframe:", e);
                      }
                    })();
                  </script>
                </body>
              </html>
            `;
          }
        }

        // Wait for the book to be ready
        await bookRef.current.ready;
        console.log("Book ready:", bookRef.current);

        // Create a rendition
        renditionRef.current = bookRef.current.renderTo(viewerRef.current, {
          width: '100%',
          height: '100%',
          flow: 'paginated',
          spread: 'none'
        });

        // Display the book
        await renditionRef.current.display();
        console.log("Book displayed");

        // Set up locations for pagination
        try {
          await bookRef.current.locations.generate(1024);
          setTotalPages(bookRef.current.locations.total);
        } catch (err) {
          console.warn("Could not generate locations:", err);
          setTotalPages(0);
        }

        // Set up event listeners for location changes
        renditionRef.current.on('relocated', (location) => {
          try {
            const pageNum = bookRef.current.locations.locationFromCfi(location.start.cfi);
            setCurrentPage(pageNum !== -1 ? pageNum + 1 : 1);
          } catch (e) {
            console.warn("Error updating page number:", e);
            setCurrentPage(1);
          }
        });

        // Add keyboard navigation
        window.addEventListener('keydown', handleKeyPress);

        setIsLoading(false);
      } catch (err) {
        console.error("Error loading EPUB:", err);
        setError(err.message || "Failed to load EPUB book");
        setIsLoading(false);
      }
    };

    loadBook();

    // Cleanup function
    return () => {
      window.removeEventListener('keydown', handleKeyPress);

      // Remove any message event listeners
      window.removeEventListener('message', () => {});

      // Remove any iframes we might have created
      const iframes = document.querySelectorAll('iframe[style="display: none;"]');
      iframes.forEach(iframe => {
        try {
          document.body.removeChild(iframe);
        } catch (e) {
          console.warn("Error removing iframe:", e);
        }
      });

      if (bookRef.current) {
        try {
          bookRef.current.destroy();
        } catch (e) {
          console.warn("Error destroying book:", e);
        }
      }
    };
  }, [encodedUrl]);

  const handleKeyPress = (e) => {
    if (!renditionRef.current) return;

    if (e.key === 'ArrowRight') {
      nextPage();
    } else if (e.key === 'ArrowLeft') {
      prevPage();
    }
  };

  const nextPage = () => {
    if (renditionRef.current) {
      renditionRef.current.next();
    }
  };

  const prevPage = () => {
    if (renditionRef.current) {
      renditionRef.current.prev();
    }
  };

  const goBack = () => {
    navigate(-1);
  };

  return (
    <div className="epub-viewer-page">
      <Navbar />

      <div className="epub-viewer-container">
        <div className="epub-header">
          <button className="back-button" onClick={goBack}>
            <ArrowLeft size={20} /> Back to My Books
          </button>
          <h1>EPUB Reader</h1>
        </div>

        {isLoading ? (
          <div className="loading-container">
            <LoadingAnimation />
            <p>Loading your book...</p>
            <p className="loading-tip">This may take a moment depending on the file size</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <h2>Error Loading Book</h2>
            <p>{error}</p>
            <button className="back-button" onClick={goBack}>
              Go Back
            </button>
          </div>
        ) : (
          <div className="epub-content">
            <div
              ref={viewerRef}
              className="epub-viewer"
            />

            <div className="epub-navigation">
              <button
                onClick={prevPage}
                disabled={currentPage <= 1}
                className="nav-button"
              >
                <ChevronLeft size={24} /> Previous
              </button>
              <span className="page-info">
                Page {currentPage} of {totalPages || '?'}
              </span>
              <button
                onClick={nextPage}
                disabled={currentPage >= totalPages}
                className="nav-button"
              >
                Next <ChevronRight size={24} />
              </button>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default EpubViewerPage;
