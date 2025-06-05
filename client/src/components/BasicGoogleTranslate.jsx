// Basic Google Translate - Simple and reliable
import React, { useEffect, useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';

const BasicGoogleTranslate = ({ position = 'middle-right' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Initialize Google Translate
    const initGoogleTranslate = () => {
      if (window.google && window.google.translate && window.google.translate.TranslateElement) {
        try {
          new window.google.translate.TranslateElement({
            pageLanguage: 'en',
            includedLanguages: 'en,te,ta,ml,hi,bn,gu,kn,mr,pa,ur,es,fr,de,it,pt,ru,ja,ko,zh,ar,th,vi,tr,pl,nl,sv,da,no,fi,he,fa,id,ms,tl',
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false
          }, 'google_translate_element');
          setIsLoaded(true);
        } catch (error) {
          console.log('Google Translate init error:', error);
        }
      }
    };

    // Load Google Translate script
    if (!window.google || !window.google.translate) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      
      window.googleTranslateElementInit = initGoogleTranslate;
      
      script.onload = () => {
        setTimeout(initGoogleTranslate, 500);
      };
      
      document.head.appendChild(script);
    } else {
      initGoogleTranslate();
    }

    // Cleanup function
    return () => {
      // Don't remove scripts or manipulate DOM on cleanup
    };
  }, []);

  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed',
      zIndex: 1000,
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
      case 'middle-right':
        return { ...baseStyles, top: '50%', right: '20px', transform: 'translateY(-50%)' };
      default:
        return { ...baseStyles, top: '50%', right: '20px', transform: 'translateY(-50%)' };
    }
  };

  return (
    <div style={getPositionStyles()}>
      {/* Toggle Button */}
      <div
        onClick={() => setIsVisible(!isVisible)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          backgroundColor: '#4285f4',
          color: 'white',
          border: 'none',
          borderRadius: '25px',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(66, 133, 244, 0.3)',
          transition: 'all 0.3s ease',
          fontSize: '14px',
          fontWeight: '500',
          minWidth: '140px',
          justifyContent: 'space-between'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 6px 20px rgba(66, 133, 244, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 4px 15px rgba(66, 133, 244, 0.3)';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Globe size={18} />
          <span>Translate</span>
        </div>
        <ChevronDown size={16} style={{ 
          transform: isVisible ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease'
        }} />
      </div>

      {/* Google Translate Widget */}
      {isVisible && (
        <div style={{
          position: 'absolute',
          top: '60px',
          right: '0',
          background: 'white',
          border: '2px solid #4285f4',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
          minWidth: '280px',
          zIndex: 1001
        }}>
          {/* Header */}
          <div style={{
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            <h3 style={{
              margin: '0 0 8px 0',
              color: '#333',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              <Globe size={20} style={{ color: '#4285f4' }} />
              Google Translate
            </h3>
            <p style={{
              margin: '0',
              fontSize: '13px',
              color: '#666',
              lineHeight: '1.4'
            }}>
              Select a language to translate this page
            </p>
          </div>

          {/* Google Translate Element */}
          <div id="google_translate_element" style={{
            textAlign: 'center'
          }}></div>

          {/* Loading State */}
          {!isLoaded && (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              color: '#666',
              fontSize: '13px'
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid #f3f3f3',
                borderTop: '2px solid #4285f4',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 8px'
              }}></div>
              Loading translator...
            </div>
          )}

          {/* Info */}
          <div style={{
            marginTop: '12px',
            padding: '8px 12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
            fontSize: '11px',
            color: '#666',
            textAlign: 'center'
          }}>
            Powered by Google Translate
          </div>

          {/* Close Button */}
          <button
            onClick={() => setIsVisible(false)}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#999',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f0f0f0';
              e.target.style.color = '#333';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#999';
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Hide Google Translate banner */
        .goog-te-banner-frame {
          display: none !important;
        }

        /* Prevent body from being pushed down */
        body {
          top: 0 !important;
        }

        /* Style the Google Translate dropdown */
        #google_translate_element .goog-te-combo {
          width: 100% !important;
          padding: 10px 12px !important;
          border: 2px solid #e1e5e9 !important;
          border-radius: 8px !important;
          font-size: 14px !important;
          color: #333 !important;
          background-color: white !important;
          outline: none !important;
          transition: all 0.3s ease !important;
          font-family: inherit !important;
        }

        #google_translate_element .goog-te-combo:focus {
          border-color: #4285f4 !important;
          box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1) !important;
        }

        #google_translate_element .goog-te-combo:hover {
          border-color: #4285f4 !important;
        }

        /* Hide Google Translate branding */
        .goog-te-gadget {
          font-family: inherit !important;
        }

        .goog-te-gadget .goog-te-combo {
          margin: 0 !important;
        }

        /* Style the powered by text */
        .goog-te-gadget-simple .goog-te-menu-value span:first-child {
          display: none !important;
        }

        .goog-te-gadget-simple .goog-te-menu-value:before {
          content: 'Select Language' !important;
          color: #666 !important;
        }
      `}</style>
    </div>
  );
};

export default BasicGoogleTranslate;
