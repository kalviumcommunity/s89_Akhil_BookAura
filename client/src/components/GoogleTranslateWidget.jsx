// src/components/GoogleTranslate.js
import React, { useEffect, useState } from 'react';

const GoogleTranslate = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const initializeGoogleTranslate = () => {
      try {
        if (!mounted) return;

        if (window.google && window.google.translate && window.google.translate.TranslateElement) {
          new window.google.translate.TranslateElement({
            pageLanguage: 'en',
            includedLanguages: 'en,te,ta,ml,hi,bn,gu,kn,mr,pa,ur',
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          }, 'google_translate_element');

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

    // Set up the global callback
    window.googleTranslateElementInit = initializeGoogleTranslate;

    // Check if script is already loaded
    const existingScript = document.querySelector('script[src*="translate.google.com"]');

    if (!existingScript) {
      const script = document.createElement('script');
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      script.defer = true;

      script.onload = () => {
        if (mounted) {
          console.log('Google Translate script loaded successfully');
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
      if (window.googleTranslateElementInit === initializeGoogleTranslate) {
        delete window.googleTranslateElementInit;
      }
    };
  }, []);

  if (error) {
    return (
      <div style={{
        padding: '5px 10px',
        textAlign: 'right',
        color: '#666',
        fontSize: '12px'
      }}>
        Translation unavailable
      </div>
    );
  }

  return (
    <div style={{ padding: '10px', textAlign: 'right' }}>
      <div id="google_translate_element"></div>
      {!isLoaded && (
        <div style={{
          fontSize: '12px',
          color: '#666',
          fontStyle: 'italic'
        }}>
          Loading translator...
        </div>
      )}
    </div>
  );
};

export default GoogleTranslate;
