import React, { useState, useEffect, useRef } from 'react';
import { ReactReader } from 'react-reader';
import { Sun, Moon, Volume2, VolumeX, Plus, Minus, RotateCcw } from 'lucide-react';
import GoogleTranslate from './GoogleTranslateWidget';
import ErrorBoundary from './ErrorBoundary';

const SimpleEpubViewer = ({ epubUrl, title = "EPUB Reader" }) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);

  // Theme and display settings
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('epubViewerDarkMode') === 'true';
  });

  // Text-to-speech settings
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechSynthesisRef = useRef(window.speechSynthesis);
  const currentUtteranceRef = useRef(null);

  // Font settings
  const [fontSize, setFontSize] = useState(() => {
    return parseInt(localStorage.getItem('epubViewerFontSize')) || 16;
  });

  const [fontFamily, setFontFamily] = useState(() => {
    return localStorage.getItem('epubViewerFontFamily') || 'Georgia, serif';
  });

  // Rendition reference for applying styles
  const renditionRef = useRef(null);

  // Fallback EPUB URL for when books don't work
  const FALLBACK_EPUB_URL = 'https://res.cloudinary.com/dg3i8akzq/raw/upload/v1748874237/ebooks/file_ifmsnc.epub';

  // Font family options
  const fontOptions = [
    { value: 'Georgia, serif', label: 'Georgia (Serif)' },
    { value: 'Arial, sans-serif', label: 'Arial (Sans-serif)' },
    { value: 'Times New Roman, serif', label: 'Times New Roman' },
    { value: 'Helvetica, sans-serif', label: 'Helvetica' },
    { value: 'Courier New, monospace', label: 'Courier New (Mono)' },
    { value: 'Verdana, sans-serif', label: 'Verdana' },
    { value: 'Palatino, serif', label: 'Palatino' }
  ];

  const handleLocationChanged = (epubcifi) => {
    setLocation(epubcifi);
  };

  const handleError = (error) => {
    console.error('EPUB loading error:', error);
    console.log('🔄 EPUB failed to load, using fallback URL...');
    setError(`Original EPUB failed to load. Using fallback content.`);
  };

  // Dark mode toggle
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('epubViewerDarkMode', newDarkMode.toString());

    // Apply theme to rendition if available
    if (renditionRef.current) {
      applyStyles();
    }
  };

  // Font size controls
  const increaseFontSize = () => {
    const newSize = Math.min(fontSize + 2, 24);
    setFontSize(newSize);
    localStorage.setItem('epubViewerFontSize', newSize.toString());
    if (renditionRef.current) {
      applyStyles();
    }
  };

  const decreaseFontSize = () => {
    const newSize = Math.max(fontSize - 2, 12);
    setFontSize(newSize);
    localStorage.setItem('epubViewerFontSize', newSize.toString());
    if (renditionRef.current) {
      applyStyles();
    }
  };

  const resetFontSize = () => {
    setFontSize(16);
    localStorage.setItem('epubViewerFontSize', '16');
    if (renditionRef.current) {
      applyStyles();
    }
  };

  // Font family change
  const handleFontFamilyChange = (event) => {
    const newFont = event.target.value;
    setFontFamily(newFont);
    localStorage.setItem('epubViewerFontFamily', newFont);
    if (renditionRef.current) {
      applyStyles();
    }
  };

  // Apply styles to rendition
  const applyStyles = () => {
    if (!renditionRef.current) return;

    const backgroundColor = darkMode ? '#1a1a1a' : '#ffffff';
    const textColor = darkMode ? '#e0e0e0' : '#333333';

    renditionRef.current.themes.default({
      body: {
        'font-family': `${fontFamily} !important`,
        'font-size': `${fontSize}px !important`,
        'line-height': '1.6 !important',
        'color': `${textColor} !important`,
        'background-color': `${backgroundColor} !important`,
        'padding': '20px !important'
      },
      p: {
        'margin-bottom': '1em !important'
      },
      h1: {
        'color': `${textColor} !important`
      },
      h2: {
        'color': `${textColor} !important`
      },
      h3: {
        'color': `${textColor} !important`
      }
    });
  };

  // Text-to-speech functionality
  const extractTextFromCurrentPage = () => {
    if (!renditionRef.current) return '';

    try {
      // Get the current iframe content
      const iframe = document.querySelector('iframe');
      if (!iframe || !iframe.contentDocument) return '';

      const iframeDoc = iframe.contentDocument;
      const bodyText = iframeDoc.body ? iframeDoc.body.innerText : '';

      // Clean up the text
      return bodyText.replace(/\s+/g, ' ').trim();
    } catch (error) {
      console.error('Error extracting text:', error);
      return 'Unable to extract text from current page.';
    }
  };

  const toggleTextToSpeech = () => {
    const synth = speechSynthesisRef.current;

    if (isSpeaking) {
      // Stop speaking
      synth.cancel();
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
      return;
    }

    // Start speaking
    const textToSpeak = extractTextFromCurrentPage();
    if (!textToSpeak) {
      alert('No text found to read on current page.');
      return;
    }

    // Cancel any ongoing speech
    synth.cancel();

    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    // Set properties
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Set event handlers
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    };
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    };

    // Store reference and start speaking
    currentUtteranceRef.current = utterance;
    synth.speak(utterance);
  };

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      const synth = speechSynthesisRef.current;
      if (synth) {
        synth.cancel();
      }
    };
  }, []);

  // Check if URL is broken and use fallback immediately
  const isOldBrokenUrl = epubUrl && (
    epubUrl.includes('bookstore/bookFiles') ||
    epubUrl.includes('s89-akhil-bookaura-3.onrender.com/api/books/file/') ||
    epubUrl.includes('/api/books/file/')
  );

  // Check if it's a direct Cloudinary URL (new system)
  const isDirectCloudinaryUrl = epubUrl && epubUrl.includes('res.cloudinary.com') && epubUrl.includes('/ebooks/');

  const urlToUse = isOldBrokenUrl ? FALLBACK_EPUB_URL : (epubUrl || FALLBACK_EPUB_URL);

  console.log('📚 EPUB Viewer URL decision:');
  console.log('Original URL:', epubUrl);
  console.log('Is old broken URL:', isOldBrokenUrl);
  console.log('Is direct Cloudinary URL:', isDirectCloudinaryUrl);
  console.log('URL to use:', urlToUse);

  if (isOldBrokenUrl) {
    console.log('⚠️ Using fallback EPUB because original URL is from old storage');
  } else if (isDirectCloudinaryUrl) {
    console.log('✅ Using direct Cloudinary URL - should work perfectly');
  }

  if (error) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        margin: '20px'
      }}>
        <h3 style={{ color: '#dc3545', marginBottom: '16px' }}>
          📚 Unable to Load EPUB
        </h3>
        <p style={{ color: '#6c757d', marginBottom: '16px' }}>
          <strong>Error:</strong> {error}
        </p>
        <button
          onClick={() => {
            setError(null);
            window.location.reload();
          }}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔄 Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{
      height: '600px',
      width: '100%',
      backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
      color: darkMode ? '#e0e0e0' : '#333333',
      transition: 'all 0.3s ease',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Google Translate widget */}
      <ErrorBoundary>
        <GoogleTranslate />
      </ErrorBoundary>

      {/* Header */}
      <div style={{
        padding: '10px',
        backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
        borderBottom: `1px solid ${darkMode ? '#444' : '#dee2e6'}`,
        textAlign: 'center',
        transition: 'all 0.3s ease'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px'
        }}>
          <h3 style={{
            margin: 0,
            color: darkMode ? '#e0e0e0' : '#495057',
            flex: 1
          }}>📖 {title}</h3>

          {/* Control buttons */}
          <div style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            {/* Font family selector */}
            <select
              value={fontFamily}
              onChange={handleFontFamilyChange}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: `1px solid ${darkMode ? '#555' : '#ccc'}`,
                backgroundColor: darkMode ? '#333' : '#fff',
                color: darkMode ? '#e0e0e0' : '#333',
                fontSize: '12px',
                cursor: 'pointer'
              }}
              title="Change Font Family"
            >
              {fontOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Font size controls */}
            <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
              <button
                onClick={decreaseFontSize}
                style={{
                  padding: '6px 8px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: darkMode ? '#444' : '#e9ecef',
                  color: darkMode ? '#e0e0e0' : '#495057',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.2s ease'
                }}
                title="Decrease Font Size"
                onMouseOver={(e) => e.target.style.backgroundColor = darkMode ? '#555' : '#dee2e6'}
                onMouseOut={(e) => e.target.style.backgroundColor = darkMode ? '#444' : '#e9ecef'}
              >
                <Minus size={14} />
              </button>

              <span style={{
                padding: '6px 8px',
                fontSize: '12px',
                color: darkMode ? '#e0e0e0' : '#495057',
                minWidth: '30px',
                textAlign: 'center'
              }}>
                {fontSize}px
              </span>

              <button
                onClick={increaseFontSize}
                style={{
                  padding: '6px 8px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: darkMode ? '#444' : '#e9ecef',
                  color: darkMode ? '#e0e0e0' : '#495057',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.2s ease'
                }}
                title="Increase Font Size"
                onMouseOver={(e) => e.target.style.backgroundColor = darkMode ? '#555' : '#dee2e6'}
                onMouseOut={(e) => e.target.style.backgroundColor = darkMode ? '#444' : '#e9ecef'}
              >
                <Plus size={14} />
              </button>

              <button
                onClick={resetFontSize}
                style={{
                  padding: '6px 8px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: darkMode ? '#444' : '#e9ecef',
                  color: darkMode ? '#e0e0e0' : '#495057',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.2s ease'
                }}
                title="Reset Font Size"
                onMouseOver={(e) => e.target.style.backgroundColor = darkMode ? '#555' : '#dee2e6'}
                onMouseOut={(e) => e.target.style.backgroundColor = darkMode ? '#444' : '#e9ecef'}
              >
                <RotateCcw size={14} />
              </button>
            </div>

            {/* Text-to-speech button */}
            <button
              onClick={toggleTextToSpeech}
              style={{
                padding: '6px 8px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: isSpeaking ? '#A67C52' : (darkMode ? '#444' : '#e9ecef'),
                color: isSpeaking ? '#fff' : (darkMode ? '#e0e0e0' : '#495057'),
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s ease'
              }}
              title={isSpeaking ? "Stop Reading" : "Read Current Page"}
              onMouseOver={(e) => {
                if (!isSpeaking) {
                  e.target.style.backgroundColor = darkMode ? '#555' : '#dee2e6';
                }
              }}
              onMouseOut={(e) => {
                if (!isSpeaking) {
                  e.target.style.backgroundColor = darkMode ? '#444' : '#e9ecef';
                }
              }}
            >
              {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              style={{
                padding: '6px 8px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: darkMode ? '#444' : '#e9ecef',
                color: darkMode ? '#e0e0e0' : '#495057',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s ease'
              }}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              onMouseOver={(e) => e.target.style.backgroundColor = darkMode ? '#555' : '#dee2e6'}
              onMouseOut={(e) => e.target.style.backgroundColor = darkMode ? '#444' : '#e9ecef'}
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>

        <small style={{ color: darkMode ? '#aaa' : '#6c757d' }}>
          Use arrow keys or click to navigate • ESC to exit fullscreen
        </small>

        {isOldBrokenUrl && (
          <div style={{
            marginTop: '8px',
            padding: '6px 12px',
            backgroundColor: darkMode ? '#3d3d00' : '#fff3cd',
            color: darkMode ? '#ffff99' : '#856404',
            borderRadius: '4px',
            fontSize: '12px',
            border: `1px solid ${darkMode ? '#666600' : '#ffeaa7'}`
          }}>
            ⚠️ Original book file unavailable - showing working EPUB content
          </div>
        )}
      </div>

      {/* EPUB Reader */}
      <div style={{
        backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
        transition: 'background-color 0.3s ease',
        height: 'calc(100% - 120px)'
      }}>
        <ReactReader
          url={urlToUse}
          location={location}
          locationChanged={handleLocationChanged}
          epubInitOptions={{
            openAs: 'epub',
            allowScriptedContent: true
          }}
          epubOptions={{
            flow: 'scrolled',
            manager: 'default'
          }}
          getRendition={(rendition) => {
            renditionRef.current = rendition;

            // Apply initial styles
            setTimeout(() => {
              applyStyles();
            }, 100);

            // Listen for location changes to reapply styles
            rendition.on('locationChanged', () => {
              setTimeout(() => {
                applyStyles();
              }, 100);
            });
          }}
          onError={handleError}
        />
      </div>
    </div>
  );
};

export default SimpleEpubViewer;
