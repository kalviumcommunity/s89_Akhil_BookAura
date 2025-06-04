// Simple and reliable Google Translate Widget
import React, { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';

const SimpleGoogleTranslate = ({ position = 'top-right' }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Function to initialize Google Translate
    const initGoogleTranslate = () => {
      console.log('Attempting to initialize Google Translate...');
      console.log('window.google:', window.google);
      console.log('window.google.translate:', window.google?.translate);

      if (window.google && window.google.translate && window.google.translate.TranslateElement) {
        try {
          // Clear existing content
          const element = document.getElementById('google_translate_element');
          if (element) {
            element.innerHTML = '';
          }

          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              includedLanguages: 'en,te,ta,ml,hi,bn,gu,kn,mr,pa,ur,es,fr,de,it,pt,ru,ja,ko,zh,ar,th,vi,tr,pl,nl,sv,da,no,fi,he,fa,id,ms,tl',
              layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
              autoDisplay: false,
              multilanguagePage: true
            },
            'google_translate_element'
          );
          setIsLoaded(true);
          console.log('✅ Google Translate loaded successfully!');
        } catch (error) {
          console.error('❌ Error initializing Google Translate:', error);
        }
      } else {
        console.log('⏳ Google Translate API not ready yet, retrying...');
        setTimeout(initGoogleTranslate, 1000);
      }
    };

    // Set global callback
    window.googleTranslateElementInit = initGoogleTranslate;

    // Load script if not already loaded
    const existingScript = document.querySelector('script[src*="translate.google.com"]');
    if (!existingScript) {
      console.log('📥 Loading Google Translate script...');
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      script.onload = () => console.log('📜 Google Translate script loaded');
      script.onerror = () => console.error('❌ Failed to load Google Translate script');
      document.head.appendChild(script);
    } else {
      console.log('📜 Google Translate script already exists, initializing...');
      // Script already loaded, try to initialize
      setTimeout(initGoogleTranslate, 500);
    }

    return () => {
      // Cleanup
      if (window.googleTranslateElementInit === initGoogleTranslate) {
        delete window.googleTranslateElementInit;
      }
    };
  }, []);

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
    <div style={getPositionStyles()}>
      {/* Toggle Button */}
      <div
        onClick={() => setIsVisible(!isVisible)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          backgroundColor: '#A67C52',
          color: 'white',
          border: 'none',
          borderRadius: '25px',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(166, 124, 82, 0.3)',
          transition: 'all 0.3s ease',
          fontSize: '14px',
          fontWeight: '500',
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
        <span>Translate</span>
      </div>

      {/* Translate Widget */}
      {isVisible && (
        <div
          style={{
            position: 'absolute',
            top: '60px',
            right: '0',
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            minWidth: '250px',
            zIndex: 1001,
          }}
        >
          <div style={{ marginBottom: '12px' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#333', fontSize: '14px' }}>
              Translate This Page
            </h4>
            <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>
              Select a language to translate the content:
            </p>
          </div>
          
          <div id="google_translate_element"></div>
          
          {!isLoaded && (
            <div style={{ 
              textAlign: 'center', 
              padding: '20px', 
              color: '#666',
              fontSize: '12px'
            }}>
              Loading translator...
            </div>
          )}
          
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
              padding: '4px',
            }}
          >
            ×
          </button>
        </div>
      )}

      <style jsx>{`
        #google_translate_element .goog-te-combo {
          width: 100% !important;
          padding: 8px !important;
          border: 1px solid #ddd !important;
          border-radius: 4px !important;
          font-size: 14px !important;
          background: white !important;
          color: #333 !important;
        }
        
        #google_translate_element .goog-te-combo:focus {
          border-color: #A67C52 !important;
          outline: none !important;
        }
        
        .goog-te-banner-frame {
          display: none !important;
        }
        
        body {
          top: 0 !important;
        }
        
        .goog-te-menu-value {
          color: #333 !important;
        }
        
        .goog-te-gadget {
          font-family: inherit !important;
        }
      `}</style>
    </div>
  );
};

export default SimpleGoogleTranslate;
