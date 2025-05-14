import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, Minimize, Book, List, Grid, Download, Moon, Sun } from 'lucide-react';
import './PdfViewer.css';

const PdfJsViewer = ({ fileUrl }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processedUrl, setProcessedUrl] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState('');
  const containerRef = React.useRef(null);

  // Process the URL to handle Cloudinary authentication
  useEffect(() => {
    console.log('PdfJsViewer received fileUrl:', fileUrl);

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

            // Try using the proxy endpoint directly
            try {
              console.log('Trying fetch-pdf proxy endpoint');
              const proxyResponse = await axios.get(`http://localhost:5000/api/pdf/fetch-pdf`, {
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

  // Set up the PDF.js viewer URL when processedUrl changes
  useEffect(() => {
    if (processedUrl) {
      // Use the official PDF.js viewer with our URL
      const pdfJsViewerUrl = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(processedUrl)}`;
      console.log('Setting PDF.js viewer URL:', pdfJsViewerUrl);
      console.log('For original fileUrl:', fileUrl);
      setViewerUrl(pdfJsViewerUrl);
      setLoading(false);
    }
  }, [processedUrl, fileUrl]);

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      // Cleanup function to revoke any blob URLs we created
      if (processedUrl && processedUrl.startsWith('blob:')) {
        console.log('Cleaning up blob URL:', processedUrl);
        URL.revokeObjectURL(processedUrl);
      }
    };
  }, [processedUrl]);

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
              axios.get(`http://localhost:5000/api/pdf/fetch-pdf`, {
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
          src={viewerUrl}
          className="pdf-iframe"
          title="PDF Viewer"
          frameBorder="0"
          allowFullScreen
        />
      </div>

      <div className="pdf-info">
        <p>PDF.js viewer provides navigation and zoom controls</p>
      </div>
    </div>
  );
};

export default PdfJsViewer;
