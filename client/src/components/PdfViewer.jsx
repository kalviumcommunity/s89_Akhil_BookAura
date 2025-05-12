import React, { useEffect, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import axios from 'axios';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, Minimize, Book, List, Grid, Download, Moon, Sun } from 'lucide-react';
import './PdfViewer.css';

// Ensure the worker is correctly set up for your version
const pdfjsVersion = '4.8.69';
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.mjs`;

const PdfViewer = ({ fileUrl }) => {
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [viewMode, setViewMode] = useState('single'); // 'single', 'double', 'thumbnail'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processedUrl, setProcessedUrl] = useState(null);
  const [darkMode, setDarkMode] = useState(false); // State for dark mode toggle

  // Process the URL to handle Cloudinary authentication
  useEffect(() => {
    const fetchSignedUrl = async () => {
      try {
        setLoading(true);
        setError(null);

        // If the URL is already a data URL or blob URL, use it directly
        if (fileUrl.startsWith('data:') || fileUrl.startsWith('blob:')) {
          setProcessedUrl(fileUrl);
          return;
        }

        // If the URL contains 'cloudinary' and 'raw', it needs authentication
        if (fileUrl.includes('cloudinary') && fileUrl.includes('raw')) {
          console.log('Fetching signed URL for:', fileUrl);

          try {
            const response = await axios.get(`http://localhost:5000/api/pdf/signed-url`, {
              params: { url: fileUrl },
              withCredentials: true
            });

            if (response.data.success) {
              console.log('Received signed URL:', response.data.signedUrl);
              setProcessedUrl(response.data.signedUrl);
            } else {
              throw new Error('Failed to get signed URL');
            }
          } catch (fetchError) {
            console.error('Error fetching signed URL:', fetchError);

            // Fallback: Try to use the URL directly
            console.log('Trying to use URL directly as fallback');
            setProcessedUrl(fileUrl);
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

    fetchSignedUrl();
  }, [fileUrl]);

  const onLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const onLoadError = (error) => {
    console.error('Error loading PDF:', error);
    setError('Failed to load the PDF. Please try again later.');
    setLoading(false);
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
      // If we already have a processed URL, use it directly
      if (processedUrl && !processedUrl.includes('cloudinary')) {
        // Create an anchor and trigger download
        const a = document.createElement('a');
        a.href = processedUrl;
        a.download = `document-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }

      // Use the proxy endpoint to get the PDF data
      console.log('Downloading PDF via proxy for:', fileUrl);
      const response = await axios.get(`http://localhost:5000/api/pdf/fetch-pdf`, {
        params: { url: fileUrl },
        responseType: 'blob',
        withCredentials: true
      });

      // Create a blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `document-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Failed to download the PDF. Please try again later.');
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

  // Render pages based on view mode
  const renderPages = () => {
    if (viewMode === 'single') {
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
    return (
      <div className="pdf-error">
        <p>{error}</p>
        <p>Try refreshing the page or contact support if the problem persists.</p>
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
          <button onClick={handleDownload} title="Download PDF">
            <Download size={18} />
          </button>
          <button onClick={toggleFullscreen} title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>
      </div>

      <Document
        file={processedUrl}
        className="pdf-document"
        onLoadSuccess={onLoadSuccess}
        onLoadError={onLoadError}
        loading={<div className="loading-spinner"></div>}
      >
        {renderPages()}
      </Document>

      <div className="pdf-info">
        <p>Use arrow keys to navigate pages, + and - keys to zoom</p>
      </div>
    </div>
  );
};

export default PdfViewer;