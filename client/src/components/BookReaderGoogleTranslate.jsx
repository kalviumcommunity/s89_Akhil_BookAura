// Book Reader specific Google Translate Widget
import React, { useEffect, useState, useRef } from 'react';
import { Globe, ChevronDown, ChevronUp } from 'lucide-react';
import './BookReaderGoogleTranslate.css';

const BookReaderGoogleTranslate = ({ position = 'top-right' }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const dropdownRef = useRef(null);
  const uniqueId = `book_reader_translate_${Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    let mounted = true;

    const initializeGoogleTranslate = () => {
      try {
        if (!mounted) return;
        
        if (window.google && window.google.translate && window.google.translate.TranslateElement) {
          new window.google.translate.TranslateElement({
            pageLanguage: 'en',
            includedLanguages: 'en,te,ta,ml,hi,bn,gu,kn,mr,pa,ur,es,fr,de,it,pt,ru,ja,ko,zh,ar,th,vi,tr,pl,nl,sv,da,no,fi,he,fa,id,ms,tl',
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          }, uniqueId);
          
          if (mounted) {
            setIsLoaded(true);
            setError(null);
          }
        }
      } catch (err) {
        console.error('Google Translate initialization error:', err);
        if (mounted) {
          setError('Failed to initialize Google Translate');
        }
      }
    };

    // Set up the global callback with unique name
    const callbackName = `googleTranslateElementInit_${uniqueId}`;
    window[callbackName] = initializeGoogleTranslate;

    // Check if script is already loaded
    const existingScript = document.querySelector('script[src*="translate.google.com"]');
    
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = `https://translate.google.com/translate_a/element.js?cb=${callbackName}`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        if (mounted) {
          console.log('Google Translate script loaded successfully for book reader');
        }
      };
      
      script.onerror = () => {
        if (mounted) {
          console.error('Failed to load Google Translate script');
          setError('Failed to load translation service');
        }
      };
      
      document.head.appendChild(script);
    } else {
      // Script already exists, try to initialize
      if (window.google && window.google.translate) {
        initializeGoogleTranslate();
      }
    }

    // Cleanup function
    return () => {
      mounted = false;
      // Clean up the global callback
      if (window[callbackName] === initializeGoogleTranslate) {
        delete window[callbackName];
      }
    };
  }, [uniqueId]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  // Toggle expanded state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    setIsMinimized(false);
  };

  // Toggle minimized state
  const toggleMinimized = () => {
    setIsMinimized(!isMinimized);
    setIsExpanded(false);
  };

  if (error) {
    return null; // Hide completely if there's an error
  }

  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed',
      zIndex: 1000,
    };

    switch (position) {
      case 'top-left':
        return { ...baseStyles, top: '20px', left: '20px' };
      case 'top-right':
        return { ...baseStyles, top: '20px', right: '20px' };
      case 'bottom-left':
        return { ...baseStyles, bottom: '20px', left: '20px' };
      case 'bottom-right':
        return { ...baseStyles, bottom: '20px', right: '20px' };
      default:
        return { ...baseStyles, top: '20px', right: '20px' };
    }
  };

  return (
    <div 
      className="book-reader-translate-widget" 
      ref={dropdownRef}
      style={getPositionStyles()}
    >
      {/* Minimized state */}
      {isMinimized ? (
        <div 
          className="translate-minimized-btn"
          onClick={toggleMinimized}
          title="Expand Translator"
        >
          <Globe size={20} />
        </div>
      ) : (
        <>
          {/* Main translate button */}
          <div className="translate-main-container">
            <div className="translate-header">
              <div 
                className="translate-main-btn"
                onClick={toggleExpanded}
                title="Translate Page"
              >
                <Globe size={18} />
                <span>Translate</span>
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
              <button 
                className="translate-minimize-btn"
                onClick={toggleMinimized}
                title="Minimize"
              >
                −
              </button>
            </div>

            {/* Expanded translate widget */}
            {isExpanded && (
              <div className="translate-content">
                <div className="translate-info">
                  <p>Select a language to translate this page:</p>
                </div>
                <div id={uniqueId}></div>
                {!isLoaded && (
                  <div className="translate-loading">
                    <div className="loading-spinner"></div>
                    <span>Loading translator...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default BookReaderGoogleTranslate;
