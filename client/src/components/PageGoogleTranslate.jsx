// Page-level Google Translate Widget (for non-book pages)
import React, { useEffect, useState, useRef } from 'react';
import { Globe, X } from 'lucide-react';

const PageGoogleTranslate = ({ position = 'bottom-right', showLabel = true }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const dropdownRef = useRef(null);
  const uniqueId = `page_translate_${Math.random().toString(36).substr(2, 9)}`;

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
          console.log('Google Translate script loaded successfully for page');
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
  };

  if (error) {
    return null; // Hide completely if there's an error
  }

  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed',
      zIndex: 999,
    };

    switch (position) {
      case 'top-left':
        return { ...baseStyles, top: '80px', left: '20px' };
      case 'top-right':
        return { ...baseStyles, top: '80px', right: '20px' };
      case 'bottom-left':
        return { ...baseStyles, bottom: '20px', left: '20px' };
      case 'bottom-right':
        return { ...baseStyles, bottom: '20px', right: '20px' };
      default:
        return { ...baseStyles, bottom: '20px', right: '20px' };
    }
  };

  return (
    <div 
      className="page-translate-widget" 
      ref={dropdownRef}
      style={getPositionStyles()}
    >
      {/* Compact toggle button */}
      <div 
        className="page-translate-btn"
        onClick={toggleExpanded}
        title="Translate Page"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: showLabel ? '10px 16px' : '12px',
          backgroundColor: '#A67C52',
          color: 'white',
          border: 'none',
          borderRadius: showLabel ? '25px' : '50%',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(166, 124, 82, 0.3)',
          transition: 'all 0.3s ease',
          fontSize: '14px',
          fontWeight: '500',
          minWidth: showLabel ? 'auto' : '48px',
          height: '48px',
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 6px 20px rgba(166, 124, 82, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 4px 15px rgba(166, 124, 82, 0.3)';
        }}
      >
        <Globe size={18} />
        {showLabel && <span>Translate</span>}
      </div>

      {/* Expanded translate widget */}
      {isExpanded && (
        <div 
          className="page-translate-dropdown"
          style={{
            position: 'absolute',
            bottom: '60px',
            right: '0',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(166, 124, 82, 0.3)',
            borderRadius: '12px',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
            minWidth: '250px',
            padding: '0',
            overflow: 'hidden',
            animation: 'slideUp 0.3s ease-out'
          }}
        >
          <div 
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #A67C52, #8B6A3F)',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            <span>Translate This Page</span>
            <button 
              onClick={() => setIsExpanded(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              <X size={16} />
            </button>
          </div>
          
          <div style={{ padding: '16px' }}>
            <div style={{ marginBottom: '12px' }}>
              <p style={{ 
                margin: '0', 
                fontSize: '13px', 
                color: '#666', 
                lineHeight: '1.4' 
              }}>
                Select a language to translate this page:
              </p>
            </div>
            <div id={uniqueId}></div>
            {!isLoaded && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 0',
                color: '#666',
                fontSize: '13px'
              }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #f3f3f3',
                  borderTop: '2px solid #A67C52',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <span>Loading translator...</span>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .page-translate-widget .goog-te-combo {
          width: 100% !important;
          padding: 8px 12px !important;
          border: 2px solid #e1e5e9 !important;
          border-radius: 6px !important;
          font-size: 14px !important;
          color: #333 !important;
          background-color: white !important;
          outline: none !important;
          transition: all 0.3s ease !important;
          font-family: inherit !important;
        }

        .page-translate-widget .goog-te-combo:focus {
          border-color: #A67C52 !important;
          box-shadow: 0 0 0 3px rgba(166, 124, 82, 0.1) !important;
        }

        .page-translate-widget .goog-te-combo:hover {
          border-color: #A67C52 !important;
        }

        .page-translate-widget .goog-te-gadget {
          font-family: inherit !important;
          font-size: inherit !important;
        }

        .page-translate-widget .goog-te-gadget .goog-te-combo {
          margin: 0 !important;
        }

        @media screen and (max-width: 768px) {
          .page-translate-dropdown {
            min-width: 220px !important;
            right: -10px !important;
          }
        }

        @media screen and (max-width: 480px) {
          .page-translate-dropdown {
            min-width: 200px !important;
            right: -20px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PageGoogleTranslate;
