// Navbar-specific Google Translate Widget
import React, { useEffect, useState, useRef } from 'react';
import { Globe } from 'lucide-react';

const NavbarGoogleTranslate = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const initializeGoogleTranslate = () => {
      try {
        if (!mounted) return;

        console.log('Initializing Google Translate for navbar');

        if (window.google && window.google.translate && window.google.translate.TranslateElement) {
          // Clear any existing content first
          const element = document.getElementById('navbar_google_translate_element');
          if (element) {
            element.innerHTML = '';
          }

          new window.google.translate.TranslateElement({
            pageLanguage: 'en',
            includedLanguages: 'en,te,ta,ml,hi,bn,gu,kn,mr,pa,ur,es,fr,de,it,pt,ru,ja,ko,zh',
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
            multilanguagePage: true
          }, 'navbar_google_translate_element');

          if (mounted) {
            setIsLoaded(true);
            setError(null);
            console.log('Navbar Google Translate initialized successfully');
          }
        } else {
          console.log('Google Translate API not ready yet for navbar');
          // Retry after a short delay
          setTimeout(() => {
            if (mounted && window.google && window.google.translate) {
              initializeGoogleTranslate();
            }
          }, 500);
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
      console.log('Script already exists for navbar, initializing...');
      if (window.google && window.google.translate) {
        initializeGoogleTranslate();
      } else {
        // Wait for the API to be ready
        setTimeout(initializeGoogleTranslate, 1000);
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

  return (
    <div className="navbar-translate-widget" ref={dropdownRef}>
      {/* Compact toggle button */}
      <div
        className="translate-toggle-btn"
        onClick={toggleExpanded}
        title="Translate Page"
      >
        <Globe size={18} />
      </div>

      {/* Expanded translate widget */}
      {isExpanded && (
        <div className="translate-dropdown">
          <div className="translate-dropdown-header">
            <span>Translate Page</span>
            <button 
              className="translate-close-btn"
              onClick={() => setIsExpanded(false)}
            >
              ×
            </button>
          </div>
          <div id="navbar_google_translate_element"></div>
          {!isLoaded && (
            <div className="translate-loading">
              Loading translator...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NavbarGoogleTranslate;
