import React, { useEffect, useState, useMemo } from 'react';
import { Document, Page } from 'react-pdf';
import axios from 'axios';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, Minimize, Book, List, Grid, Download, Moon, Sun, FileText, ExternalLink } from 'lucide-react';
import './PdfViewer.css';
import '../pdfWorker'; // Import the centralized worker configuration

// Set default view mode to iframe for better compatibility
const DEFAULT_VIEW_MODE = 'iframe';


const SimplePdfViewer = ({ fileUrl }) => {
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [viewMode, setViewMode] = useState(DEFAULT_VIEW_MODE); // 'iframe', 'single', 'double', 'thumbnail'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processedUrl, setProcessedUrl] = useState(null);
  const [darkMode, setDarkMode] = useState(false); // State for dark mode toggle

  // Memoize options to prevent unnecessary re-renders
  const pdfOptions = useMemo(() => ({
    cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.2.133/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.2.133/standard_fonts/'
  }), []);

  // Process the URL to handle Cloudinary authentication
  useEffect(() => {
    const processUrl = async () => {
      try {
        setLoading(true);
        setError(null);

        // Ensure fileUrl is defined before using it
        if (!fileUrl) {
          console.error('File URL is undefined');
          throw new Error('File URL is undefined');
        }

        // If the URL is already a data URL or blob URL, use it directly
        if (fileUrl.startsWith('data:') || fileUrl.startsWith('blob:')) {
          setProcessedUrl(fileUrl);
          return;
        }

        // Check if the URL is a Cloudinary URL
        if (fileUrl.includes('cloudinary')) {
          console.log('Processing Cloudinary URL:', fileUrl);

          // For Cloudinary URLs, we'll fetch the PDF as a blob and create a blob URL
          try {
            console.log('Fetching PDF as blob from:', fileUrl);

            // First try to fetch directly
            const response = await fetch(fileUrl);

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const pdfBlob = await response.blob();

            // Create a blob URL with the correct MIME type
            const blobUrl = URL.createObjectURL(
              new Blob([pdfBlob], { type: 'application/pdf' })
            );

            console.log('Created blob URL for PDF:', blobUrl);
            setProcessedUrl(blobUrl);

            // Clean up the blob URL when the component unmounts
            return () => {
              URL.revokeObjectURL(blobUrl);
            };
          } catch (fetchError) {
            console.error('Error fetching PDF as blob:', fetchError);

            // Fallback: Try with .pdf extension
            const pdfUrl = fileUrl.toLowerCase().endsWith('.pdf') ? fileUrl : `${fileUrl}.pdf`;
            console.log('Falling back to URL with .pdf extension:', pdfUrl);

            try {
              // Try to fetch with .pdf extension
              const pdfResponse = await fetch(pdfUrl);

              if (!pdfResponse.ok) {
                throw new Error(`HTTP error! status: ${pdfResponse.status}`);
              }

              const pdfBlob = await pdfResponse.blob();
              const blobUrl = URL.createObjectURL(
                new Blob([pdfBlob], { type: 'application/pdf' })
              );

              console.log('Created blob URL from .pdf URL:', blobUrl);
              setProcessedUrl(blobUrl);
            } catch (pdfError) {
              console.error('Error fetching PDF with .pdf extension:', pdfError);

              // Last resort: Try to get a signed URL from the server
              try {
                const response = await axios.get(`https://s89-akhil-bookaura-2.onrender.com/api/pdf/signed-url`, {
                  params: { url: fileUrl },
                  withCredentials: true
                });

                if (response.data.success) {
                  console.log('Received signed URL:', response.data.signedUrl);
                  setProcessedUrl(response.data.signedUrl);
                } else {
                  // If all else fails, just use the original URL
                  console.log('Using original URL as last resort');
                  setProcessedUrl(fileUrl);
                }
              } catch (signedUrlError) {
                console.error('Error fetching signed URL:', signedUrlError);
                setProcessedUrl(fileUrl);
              }
            }
          }
        } else {
          // For other URLs, use them directly
          setProcessedUrl(fileUrl);
        }
      } catch (err) {
        console.error('Error processing PDF URL:', err);
        setError('Failed to load the PDF. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    const cleanup = processUrl();

    // Return the cleanup function if one was returned
    return cleanup;
  }, [fileUrl]);

  const onLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const onLoadError = (error) => {
    console.error('Error loading PDF:', error);

    // Show a temporary message about switching to basic viewer
    setError('PDF viewer encountered an issue. Switching to basic viewer...');

    // Try one more time with a different approach if URL doesn't end with .pdf
    if (processedUrl && !processedUrl.toLowerCase().endsWith('.pdf')) {
      const newUrl = `${processedUrl}.pdf`;
      console.log('Retrying with .pdf extension:', newUrl);
      setProcessedUrl(newUrl);
    }

    // Switch to iframe view automatically after a short delay
    setTimeout(() => {
      console.log('Switching to iframe view as fallback');
      setViewMode('iframe');
      setLoading(false);
      setError(null);
    }, 1500);
  };

  const nextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const zoomIn = () => {
    setScale(Math.min(scale + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale(Math.max(scale - 0.2, 0.5));
  };

  const toggleFullscreen = () => {
    const viewerElement = document.querySelector('.pdf-viewer-container');

    if (!isFullscreen) {
      if (viewerElement.requestFullscreen) {
        viewerElement.requestFullscreen();
      } else if (viewerElement.webkitRequestFullscreen) {
        viewerElement.webkitRequestFullscreen();
      } else if (viewerElement.msRequestFullscreen) {
        viewerElement.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }

    setIsFullscreen(!isFullscreen);
  };

  // Toggle between light and dark mode
  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
    // Save preference to localStorage for persistence
    localStorage.setItem('pdfViewerDarkMode', !darkMode);
  };

  const handleDownload = async () => {
    try {
      setError('Preparing download...');

      // If we already have a processed URL and it's a blob URL, use it directly
      if (processedUrl && processedUrl.startsWith('blob:')) {
        // Create an anchor and trigger download
        const a = document.createElement('a');
        a.href = processedUrl;
        a.download = `document-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setError(null);
        return;
      }

      // Use the proxy endpoint to get the PDF data
      console.log('Downloading PDF via proxy for:', fileUrl);

      // Show loading state
      setLoading(true);

      const response = await axios.get(`https://s89-akhil-bookaura-2.onrender.com/api/pdf/fetch-pdf`, {
        params: { url: fileUrl },
        responseType: 'blob',
        withCredentials: true
      });

      // Create a blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      // Also set this as the current URL for viewing
      setProcessedUrl(url);
      setError(null);

      // Trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `document-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Don't revoke the URL as we're using it for viewing
      // window.URL.revokeObjectURL(url);

      setLoading(false);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError('Failed to download the PDF. Please try again later.');
      setLoading(false);
    }
  };

  // Add a direct proxy fetch function that can be called from the error UI
  const handleProxyFetch = async () => {
    try {
      setLoading(true);
      setError('Fetching PDF through proxy server...');

      const response = await axios.get(`https://s89-akhil-bookaura-2.onrender.com/api/pdf/fetch-pdf`, {
        params: { url: fileUrl },
        responseType: 'blob',
        withCredentials: true
      });

      // Create a blob URL
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      // Set as current URL
      setProcessedUrl(url);
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching PDF via proxy:', err);
      setError('Failed to fetch PDF through proxy. Please try again later.');
      setLoading(false);
    }
  };

  // Function to switch to iframe view as a last resort
  const handleIframeView = () => {
    setViewMode('iframe');
    setError(null);
  };

  // Function to use Google Docs viewer as a fallback
  const handleGoogleDocsView = () => {
    if (processedUrl) {
      // Create a Google Docs viewer URL
      const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(processedUrl)}&embedded=true`;

      // Open in a new tab
      window.open(googleDocsUrl, '_blank');
    } else {
      setError('No PDF URL available to view');
    }
  };

  // Function to use PDF.js viewer directly
  const handlePdfJsView = () => {
    if (processedUrl) {
      // Create a PDF.js viewer URL
      const pdfJsUrl = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(processedUrl)}`;

      // Open in a new tab
      window.open(pdfJsUrl, '_blank');
    } else {
      setError('No PDF URL available to view');
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        nextPage();
      } else if (e.key === 'ArrowLeft') {
        prevPage();
      } else if (e.key === '+') {
        zoomIn();
      } else if (e.key === '-') {
        zoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentPage, numPages, scale]);

  // Fullscreen change detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      );
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Load dark mode preference from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('pdfViewerDarkMode');
    if (savedDarkMode !== null) {
      setDarkMode(savedDarkMode === 'true');
    }
  }, []);

  // No need to preload worker when using fake worker

  // Render pages based on view mode
  const renderPages = () => {
    if (viewMode === 'iframe') {
      // Use object/embed tags as a fallback for compatibility
      return (
        <div className={`iframe-container ${darkMode ? 'dark-mode' : ''}`}
          style={{
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            backgroundColor: darkMode ? '#333' : '#fff',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          {/* Primary: object tag with embed fallback */}
          <object
            data={processedUrl}
            type="application/pdf"
            width="100%"
            height="100%"
            style={{
              border: 'none',
              backgroundColor: darkMode ? '#333' : '#fff'
            }}
          >
            <embed
              src={processedUrl}
              type="application/pdf"
              width="100%"
              height="100%"
              style={{
                border: 'none',
                backgroundColor: darkMode ? '#333' : '#fff'
              }}
            />
            <p style={{ textAlign: 'center', padding: '20px' }}>
              Your browser doesn't support embedded PDFs.
              <a href={processedUrl} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'block',
                  marginTop: '10px',
                  padding: '8px 16px',
                  backgroundColor: '#A67C52',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '4px',
                  textAlign: 'center'
                }}
              >
                Click here to download the PDF
              </a>
            </p>
          </object>
        </div>
      );
    } else if (viewMode === 'single') {
      return (
        <div className="page-container">
          <Page
            pageNumber={currentPage}
            scale={scale}
            className="pdf-page"
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </div>
      );
    } else if (viewMode === 'double') {
      // For double page view, show current page and next page side by side
      return (
        <div className="double-page-container">
          <div className="page-container left-page">
            <Page
              pageNumber={currentPage}
              scale={scale}
              className="pdf-page"
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </div>
          {currentPage < numPages && (
            <div className="page-container right-page">
              <Page
                pageNumber={currentPage + 1}
                scale={scale}
                className="pdf-page"
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </div>
          )}
        </div>
      );
    } else if (viewMode === 'thumbnail') {
      // For thumbnail view, show multiple pages in a grid
      const pagesToShow = [];
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(numPages, startPage + 8);

      for (let i = startPage; i <= endPage; i++) {
        pagesToShow.push(
          <div
            key={i}
            className={`thumbnail-container ${i === currentPage ? 'active' : ''}`}
            onClick={() => setCurrentPage(i)}
          >
            <Page
              pageNumber={i}
              scale={0.3}
              className="thumbnail-page"
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
            <div className="thumbnail-number">{i}</div>
          </div>
        );
      }

      return <div className="thumbnails-grid">{pagesToShow}</div>;
    }
  };

  if (loading) {
    return (
      <div className="pdf-loading">
        <div className="loading-spinner"></div>
        <p>Loading PDF...</p>
      </div>
    );
  }

  if (error) {
    const isLoadingMessage = error.includes('Preparing') || error.includes('Fetching') || error.includes('Attempting');

    return (
      <div className="pdf-error">
        <p>{error}</p>

        {isLoadingMessage ? (
          <div className="loading-spinner" style={{ margin: '20px auto' }}></div>
        ) : (
          <>
            <div className="worker-error">
              <p>This could be due to one of the following reasons:</p>
              <ul style={{ textAlign: 'left', marginLeft: '20px' }}>
                <li>The PDF file might be corrupted</li>
                <li>The URL to the PDF might be incorrect</li>
                <li>Your browser might have restrictions on viewing this type of content</li>
                <li>The PDF might be password protected</li>
              </ul>
            </div>
            <p>Try one of these options:</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={handleProxyFetch}
                style={{
                  padding: '8px 16px',
                  background: '#A67C52',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                Try Proxy Server
              </button>
              <button
                onClick={handleIframeView}
                style={{
                  padding: '8px 16px',
                  background: '#A67C52',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                Use Basic Viewer
              </button>
              <button
                onClick={handleGoogleDocsView}
                style={{
                  padding: '8px 16px',
                  background: '#A67C52',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                Open in Google Docs
              </button>
              <button
                onClick={handlePdfJsView}
                style={{
                  padding: '8px 16px',
                  background: '#A67C52',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                Open in PDF.js Viewer
              </button>
              <button
                onClick={handleDownload}
                style={{
                  padding: '8px 16px',
                  background: '#A67C52',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                Download PDF
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '8px 16px',
                  background: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                Refresh Page
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`pdf-viewer-container ${isFullscreen ? 'fullscreen' : ''} ${darkMode ? 'dark-mode' : ''}`}>
      <div className="pdf-toolbar">
        <div className="pdf-navigation">
          <button onClick={prevPage} disabled={currentPage <= 1} title="Previous Page">
            <ChevronLeft size={18} />
          </button>
          <span className="page-indicator">
            {currentPage} / {numPages}
          </span>
          <button onClick={nextPage} disabled={currentPage >= numPages} title="Next Page">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="pdf-zoom-controls">
          <button onClick={zoomOut} title="Zoom Out">
            <ZoomOut size={18} />
          </button>
          <span className="zoom-level">{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} title="Zoom In">
            <ZoomIn size={18} />
          </button>
        </div>

        <div className="pdf-view-controls">
          <button
            onClick={() => setViewMode('iframe')}
            className={viewMode === 'iframe' ? 'active' : ''}
            title="Basic Viewer (Most Compatible)"
          >
            <ExternalLink size={18} />
          </button>
          <button
            onClick={() => setViewMode('single')}
            className={viewMode === 'single' ? 'active' : ''}
            title="Single Page View"
          >
            <Book size={18} />
          </button>
          <button
            onClick={() => setViewMode('double')}
            className={viewMode === 'double' ? 'active' : ''}
            title="Double Page View"
          >
            <List size={18} />
          </button>
          <button
            onClick={() => setViewMode('thumbnail')}
            className={viewMode === 'thumbnail' ? 'active' : ''}
            title="Thumbnail View"
          >
            <Grid size={18} />
          </button>
        </div>

        <div className="pdf-actions">
          <button onClick={toggleDarkMode} title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={handleProxyFetch} title="Reload via Proxy Server">
            <FileText size={18} />
          </button>
          <button onClick={handleGoogleDocsView} title="Open in Google Docs Viewer">
            <Book size={18} />
          </button>
          <button onClick={handlePdfJsView} title="Open in PDF.js Viewer">
            <ExternalLink size={18} />
          </button>
          <button onClick={handleDownload} title="Download PDF">
            <Download size={18} />
          </button>
          <button onClick={toggleFullscreen} title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>
      </div>

      {processedUrl && viewMode !== 'iframe' ? (
        <Document
          file={processedUrl}
          className="pdf-document"
          onLoadSuccess={onLoadSuccess}
          onLoadError={onLoadError}
          loading={<div className="loading-spinner"></div>}
          options={pdfOptions}
        >
          {renderPages()}
        </Document>
      ) : processedUrl && viewMode === 'iframe' ? (
        renderPages()
      ) : null}

      <div className="pdf-info">
        <p>Use arrow keys to navigate pages, + and - keys to zoom</p>
      </div>
    </div>
  );
};

export default SimplePdfViewer;