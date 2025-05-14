import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Download, Maximize, Minimize, Moon, Sun, ExternalLink, FileText, Volume2 } from 'lucide-react';
import './PdfViewer.css';

const BasicPdfViewer = ({ fileUrl }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [googleViewerUrl, setGoogleViewerUrl] = useState(null);
  const [processedUrl, setProcessedUrl] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [pageSummaries, setPageSummaries] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechSynthesisRef = useRef(window.speechSynthesis);
  const iframeRef = useRef(null);

  // Process the URL to create a Google Docs viewer URL
  useEffect(() => {
    console.log('BasicPdfViewer received fileUrl:', fileUrl);

    const processUrl = async () => {
      try {
        setLoading(true);
        setError(null);

        // For Cloudinary URLs, we need to ensure they have the .pdf extension
        let finalUrl = fileUrl;

        // If the URL contains 'cloudinary' and 'raw', it needs special handling
        if (fileUrl.includes('cloudinary') && fileUrl.includes('raw')) {
          console.log('Processing Cloudinary URL:', fileUrl);

          // Add .pdf extension if it doesn't have one
          if (!fileUrl.toLowerCase().endsWith('.pdf')) {
            finalUrl = `${fileUrl}.pdf`;
            console.log('Added .pdf extension to URL:', finalUrl);
          }

          try {
            // Try to get a signed URL from the server
            const response = await axios.get(`http://localhost:5000/api/pdf/signed-url`, {
              params: { url: finalUrl },
              withCredentials: true
            });

            if (response.data.success) {
              console.log('Received signed URL:', response.data.signedUrl);
              finalUrl = response.data.signedUrl;
            } else {
              console.warn('Failed to get signed URL, using direct URL with .pdf extension');
            }
          } catch (fetchError) {
            console.error('Error fetching signed URL:', fetchError);
            console.log('Using direct URL with .pdf extension as fallback');
          }
        }

        // Set the processed URL for download and external links
        setProcessedUrl(finalUrl);

        // Create Google Docs viewer URL
        const googleUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(finalUrl)}&embedded=true`;
        console.log('Created Google Docs viewer URL:', googleUrl);
        setGoogleViewerUrl(googleUrl);

        setLoading(false);
      } catch (err) {
        console.error('Error processing PDF URL:', err);
        setError('Failed to load the PDF. Please try again later.');
        setLoading(false);
      }
    };

    processUrl();
  }, [fileUrl]);

  // Toggle fullscreen mode
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

  // Handle download button click
  const handleDownload = async () => {
    try {
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

  // Open in new tab
  const openInNewTab = () => {
    window.open(processedUrl, '_blank');
  };

  // Listen for page changes in the Google Docs viewer
  useEffect(() => {
    const handleMessage = (event) => {
      // Google Docs viewer sends messages about the current state
      if (event.data && typeof event.data === 'string') {
        try {
          const data = JSON.parse(event.data);

          // Check if this is a page change event
          if (data.type === 'pagechange' && data.page) {
            setCurrentPage(data.page);
          }

          // Check if this is a document loaded event with total pages
          if (data.type === 'docinfo' && data.totalPages) {
            setTotalPages(data.totalPages);
          }
        } catch (e) {
          // Not a JSON message or not from our viewer
        }
      }
    };

    // Add event listener for messages from the iframe
    window.addEventListener('message', handleMessage);

    // Cleanup
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Generate placeholder summaries for each page
  const generatePlaceholderSummaries = (pageNum) => {
    // Sample summaries for different pages
    const summaries = {
      1: `Page 1: Introduction and Overview

This page introduces the main topic of the document and provides an overview of what will be covered. It likely includes the title, author information, and possibly a table of contents or abstract.

Key points:
• Document title and author information
• Brief overview of the document's purpose
• Introduction to the main topics that will be covered
• Possibly includes publication date and copyright information`,

      2: `Page 2: Background Information

This page provides context and background information on the subject matter. It may include historical information, definitions of key terms, or explanations of basic concepts needed to understand the rest of the document.

Key points:
• Historical context of the subject matter
• Definitions of key terminology
• Explanation of fundamental concepts
• Review of relevant previous work or research`,

      3: `Page 3: Main Content - Part 1

This page begins the main content of the document, diving into the first major topic or section. It likely contains detailed information, possibly with supporting evidence, examples, or data.

Key points:
• Introduction to the first main topic
• Detailed explanation with supporting evidence
• Possibly includes diagrams, charts, or illustrations
• Analysis of key findings or concepts`,

      4: `Page 4: Main Content - Part 2

This page continues the main content, focusing on the second major topic or section. It builds upon the information presented earlier and may introduce new concepts or ideas.

Key points:
• Continuation of main content with new subtopics
• Additional supporting evidence or examples
• Further analysis and interpretation
• Connections between different concepts or ideas`,

      5: `Page 5: Conclusion and References

This page concludes the document, summarizing the main points and possibly suggesting next steps or areas for further exploration. It may also include a list of references or citations.

Key points:
• Summary of key findings or arguments
• Conclusions drawn from the presented information
• Recommendations or next steps
• List of references, bibliography, or citations`
    };

    // For pages beyond our sample set, generate a generic summary
    if (!summaries[pageNum]) {
      return `Page ${pageNum}: Additional Content

This page contains additional content related to the main topic of the document. It may include supplementary information, examples, case studies, or technical details.

Key points:
• Continuation of the document's main themes
• Additional supporting information or examples
• Possibly includes figures, tables, or illustrations
• Further development of ideas presented earlier in the document`;
    }

    return summaries[pageNum];
  };

  // Generate summary for the current page
  const generateSummary = async () => {
    // Toggle summary display if already showing
    if (showSummary) {
      setShowSummary(false);
      return;
    }

    try {
      setSummaryLoading(true);
      setShowSummary(true);

      // Check if we already have a summary for this page
      if (pageSummaries[currentPage]) {
        setSummaryLoading(false);
        return;
      }

      // In a real app, you would call an AI service to generate a summary for the current page
      // For demo purposes, we'll use placeholder summaries
      setTimeout(() => {
        const newSummary = generatePlaceholderSummaries(currentPage);

        // Update the summaries object with the new page summary
        setPageSummaries(prev => ({
          ...prev,
          [currentPage]: newSummary
        }));

        setSummaryLoading(false);
      }, 1500);

      // In a real implementation, you would call an API like:
      /*
      const response = await axios.post('http://localhost:5000/api/summarize-pdf-page', {
        url: processedUrl,
        page: currentPage
      });

      setPageSummaries(prev => ({
        ...prev,
        [currentPage]: response.data.summary
      }));

      setSummaryLoading(false);
      */
    } catch (err) {
      console.error('Error generating page summary:', err);

      setPageSummaries(prev => ({
        ...prev,
        [currentPage]: 'Failed to generate summary for this page. Please try again later.'
      }));

      setSummaryLoading(false);
    }
  };

  // Handle text-to-speech
  const toggleSpeech = () => {
    const synth = speechSynthesisRef.current;

    if (isSpeaking) {
      // Stop speaking
      synth.cancel();
      setIsSpeaking(false);
      return;
    }

    // If we don't have a summary for the current page yet, generate one first
    if (!pageSummaries[currentPage]) {
      setSummaryLoading(true);
      setShowSummary(true);

      // Generate placeholder summary for the current page
      setTimeout(() => {
        const newSummary = generatePlaceholderSummaries(currentPage);

        // Update the summaries object with the new page summary
        setPageSummaries(prev => ({
          ...prev,
          [currentPage]: newSummary
        }));

        setSummaryLoading(false);

        // Start speaking after summary is generated
        speakSummary(newSummary);
      }, 1500);
    } else {
      // We already have a summary for this page, so speak it
      speakSummary(pageSummaries[currentPage]);
    }
  };

  // Function to speak the summary text
  const speakSummary = (text) => {
    const synth = speechSynthesisRef.current;

    // Cancel any ongoing speech
    synth.cancel();

    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(text);

    // Set properties
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Set event handlers
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      console.error('Speech synthesis error');
      setIsSpeaking(false);
    };

    // Start speaking
    synth.speak(utterance);
  };

  // Clean up speech synthesis when component unmounts
  useEffect(() => {
    return () => {
      const synth = speechSynthesisRef.current;
      if (synth) {
        synth.cancel();
      }
    };
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="pdf-loading">
        <div className="loading-spinner"></div>
        <p>Loading PDF...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="pdf-error">
        <div className="error-icon">❌</div>
        <h3>PDF Loading Error</h3>
        <p>{error}</p>
        <div className="error-actions">
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
      className={`pdf-viewer-container ${isFullscreen ? 'fullscreen' : ''} ${darkMode ? 'dark-mode' : ''}`}
    >
      <div className="pdf-toolbar">
        <div className="pdf-title">
          <span>Google PDF Viewer</span>
        </div>
        <div className="pdf-actions">
          <button
            onClick={generateSummary}
            title={showSummary ? "Hide Summary" : "Show Summary"}
            className={showSummary ? 'active' : ''}
          >
            <FileText size={18} />
          </button>
          <button
            onClick={toggleSpeech}
            title={isSpeaking ? "Stop Speaking" : "Read Summary"}
            className={isSpeaking ? 'active' : ''}
            disabled={summaryLoading}
          >
            <Volume2 size={18} />
          </button>
          <button onClick={toggleDarkMode} title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={handleDownload} title="Download PDF">
            <Download size={18} />
          </button>
          <button onClick={openInNewTab} title="Open in New Tab">
            <ExternalLink size={18} />
          </button>
          <button onClick={toggleFullscreen} title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>
      </div>

      {/* Summary Panel */}
      {showSummary && (
        <div className={`summary-panel ${darkMode ? 'dark-mode' : ''}`}>
          <div className="summary-header">
            <h3>Page {currentPage} Summary</h3>
            <div className="summary-page-info">
              Page {currentPage} of {totalPages}
            </div>
            <button
              className="close-summary"
              onClick={() => setShowSummary(false)}
              title="Close Summary"
            >
              ×
            </button>
          </div>
          <div className="summary-content">
            {summaryLoading && !pageSummaries[currentPage] ? (
              <div className="summary-loading">
                <div className="loading-spinner"></div>
                <p>Generating summary for page {currentPage}...</p>
              </div>
            ) : (
              <div className="summary-text">
                {pageSummaries[currentPage] ?
                  pageSummaries[currentPage].split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  )) :
                  <p>No summary available for this page.</p>
                }
              </div>
            )}
          </div>
          <div className="summary-navigation">
            <button
              onClick={() => {
                if (currentPage > 1) {
                  // If we have an iframe reference, try to navigate to the previous page
                  if (iframeRef.current) {
                    try {
                      iframeRef.current.contentWindow.postMessage(
                        JSON.stringify({ action: 'previousPage' }),
                        '*'
                      );
                    } catch (e) {
                      console.error('Error navigating to previous page:', e);
                    }
                  }

                  // Also update our local state
                  setCurrentPage(prev => Math.max(1, prev - 1));

                  // Generate summary for the new page if needed
                  if (!pageSummaries[currentPage - 1]) {
                    setSummaryLoading(true);
                    setTimeout(() => {
                      const newSummary = generatePlaceholderSummaries(currentPage - 1);
                      setPageSummaries(prev => ({
                        ...prev,
                        [currentPage - 1]: newSummary
                      }));
                      setSummaryLoading(false);
                    }, 1000);
                  }
                }
              }}
              disabled={currentPage <= 1}
              className="summary-nav-button"
              title="Previous Page"
            >
              Previous Page
            </button>
            <button
              onClick={() => {
                if (currentPage < totalPages) {
                  // If we have an iframe reference, try to navigate to the next page
                  if (iframeRef.current) {
                    try {
                      iframeRef.current.contentWindow.postMessage(
                        JSON.stringify({ action: 'nextPage' }),
                        '*'
                      );
                    } catch (e) {
                      console.error('Error navigating to next page:', e);
                    }
                  }

                  // Also update our local state
                  setCurrentPage(prev => Math.min(totalPages, prev + 1));

                  // Generate summary for the new page if needed
                  if (!pageSummaries[currentPage + 1]) {
                    setSummaryLoading(true);
                    setTimeout(() => {
                      const newSummary = generatePlaceholderSummaries(currentPage + 1);
                      setPageSummaries(prev => ({
                        ...prev,
                        [currentPage + 1]: newSummary
                      }));
                      setSummaryLoading(false);
                    }, 1000);
                  }
                }
              }}
              disabled={currentPage >= totalPages}
              className="summary-nav-button"
              title="Next Page"
            >
              Next Page
            </button>
          </div>
        </div>
      )}

      <div className="iframe-container">
        <iframe
          ref={iframeRef}
          src={googleViewerUrl}
          width="100%"
          height="100%"
          style={{
            border: 'none',
            backgroundColor: darkMode ? '#333' : '#fff'
          }}
          title="Google PDF Viewer"
          allowFullScreen
        />
      </div>

      <div className="pdf-info">
        <p>
          Using Google Docs PDF viewer | Page {currentPage} of {totalPages}
          {isSpeaking && <span className="speaking-indicator"> • Speaking</span>}
        </p>
      </div>
    </div>
  );
};

export default BasicPdfViewer;
