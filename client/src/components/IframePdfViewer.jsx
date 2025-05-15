import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, Minimize, Book, List, Grid, Download, Moon, Sun } from 'lucide-react';
import './PdfViewer.css';

const IframePdfViewer = ({ fileUrl }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processedUrl, setProcessedUrl] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(1.0);
  const iframeRef = useRef(null);
  const containerRef = useRef(null);

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
            // First try the signed URL approach
            const response = await axios.get(`https://s89-akhil-bookaura-3.onrender.com/api/pdf/signed-url`, {
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

            // Try using the proxy endpoint directly
            try {
              console.log('Trying fetch-pdf proxy endpoint');
              const proxyResponse = await axios.get(`https://s89-akhil-bookaura-3.onrender.com/api/pdf/fetch-pdf`, {
                params: { url: fileUrl },
                responseType: 'blob',
                withCredentials: true
              });

              // Create a blob URL from the response
              const blob = new Blob([proxyResponse.data], { type: 'application/pdf' });
              const blobUrl = URL.createObjectURL(blob);
              console.log('Created blob URL from proxy response');
              setProcessedUrl(blobUrl);
            } catch (proxyError) {
              console.error('Error using fetch-pdf proxy:', proxyError);

              // Last resort: try the URL directly
              console.log('Trying to use URL directly as last resort');
              setProcessedUrl(fileUrl);
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

    fetchSignedUrl();
  }, [fileUrl]);

  // Handle iframe load event
  const handleIframeLoad = () => {
    setLoading(false);
  };

  // Handle iframe error event
  const handleIframeError = () => {
    setError('Failed to load the PDF. Please try again later.');
    setLoading(false);
  };

  const toggleFullscreen = () => {
    const viewerElement = containerRef.current;

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
      if (processedUrl && (processedUrl.startsWith('blob:') || processedUrl.startsWith('data:'))) {
        // For blob URLs, we need to fetch the data first
        const response = await fetch(processedUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `document-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return;
      }

      // Use the proxy endpoint to get the PDF data
      console.log('Downloading PDF via proxy for:', fileUrl);
      const response = await axios.get(`https://s89-akhil-bookaura-3.onrender.com/api/pdf/fetch-pdf`, {
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

  // Zoom functionality for iframe
  const zoomIn = () => {
    setScale(Math.min(scale + 0.2, 3.0));
    if (iframeRef.current) {
      iframeRef.current.style.transform = `scale(${Math.min(scale + 0.2, 3.0)})`;
      iframeRef.current.style.transformOrigin = 'center top';
    }
  };

  const zoomOut = () => {
    setScale(Math.max(scale - 0.2, 0.5));
    if (iframeRef.current) {
      iframeRef.current.style.transform = `scale(${Math.max(scale - 0.2, 0.5)})`;
      iframeRef.current.style.transformOrigin = 'center top';
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
        <div className="error-icon">❌</div>
        <h3>PDF Loading Error</h3>
        <p>{error}</p>
        <div className="error-actions">
          <button
            onClick={() => {
              setError(null);
              setLoading(true);

              // Try using the proxy endpoint directly
              axios.get(`https://s89-akhil-bookaura-3.onrender.com/api/pdf/fetch-pdf`, {
                params: { url: fileUrl },
                responseType: 'blob',
                withCredentials: true
              }).then(response => {
                // Create a blob URL from the response
                const blob = new Blob([response.data], { type: 'application/pdf' });
                const blobUrl = URL.createObjectURL(blob);
                console.log('Created blob URL from proxy response');
                setProcessedUrl(blobUrl);
              }).catch(proxyError => {
                console.error('Error using fetch-pdf proxy:', proxyError);
                setError('Failed to load the PDF using proxy. Please try refreshing the page.');
                setLoading(false);
              });
            }}
            className="proxy-button"
          >
            Try Proxy Method
          </button>
          <button
            onClick={() => window.location.reload()}
            className="refresh-button"
          >
            Refresh Page
          </button>
        </div>
        <p className="error-help">If the problem persists, please contact support.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`pdf-viewer-container ${isFullscreen ? 'fullscreen' : ''} ${darkMode ? 'dark-mode' : ''}`}
    >
      <div className="pdf-toolbar">
        <div className="pdf-zoom-controls">
          <button onClick={zoomOut} title="Zoom Out">
            <ZoomOut size={18} />
          </button>
          <span className="zoom-level">{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} title="Zoom In">
            <ZoomIn size={18} />
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

      <div className="iframe-container">
        <iframe
          ref={iframeRef}
          src={`https://docs.google.com/viewer?url=${encodeURIComponent(processedUrl)}&embedded=true`}
          className="pdf-iframe"
          title="PDF Viewer"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          style={{ transform: `scale(${scale})`, transformOrigin: 'center top' }}
          frameBorder="0"
        />
      </div>

      <div className="pdf-info">
        <p>Use the zoom controls to adjust the view</p>
      </div>
    </div>
  );
};

export default IframePdfViewer;
