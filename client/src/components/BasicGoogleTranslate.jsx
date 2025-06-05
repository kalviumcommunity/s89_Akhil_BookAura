// Basic Google Translate - Simple and reliable
import React, { useEffect, useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';

const BasicGoogleTranslate = ({ position = 'middle-right' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  // Fallback language options
  const fallbackLanguages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳', native: 'हिन्दी' },
    { code: 'te', name: 'Telugu', flag: '🇮🇳', native: 'తెలుగు' },
    { code: 'ta', name: 'Tamil', flag: '🇮🇳', native: 'தமிழ்' },
    { code: 'ml', name: 'Malayalam', flag: '🇮🇳', native: 'മലയാളം' },
    { code: 'bn', name: 'Bengali', flag: '🇮🇳', native: 'বাংলা' },
    { code: 'gu', name: 'Gujarati', flag: '🇮🇳', native: 'ગુજરાતી' },
    { code: 'kn', name: 'Kannada', flag: '🇮🇳', native: 'ಕನ್ನಡ' },
    { code: 'mr', name: 'Marathi', flag: '🇮🇳', native: 'मराठी' },
    { code: 'pa', name: 'Punjabi', flag: '🇮🇳', native: 'ਪੰਜਾਬੀ' },
    { code: 'ur', name: 'Urdu', flag: '🇵🇰', native: 'اردو' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸', native: 'Español' },
    { code: 'fr', name: 'French', flag: '🇫🇷', native: 'Français' },
    { code: 'de', name: 'German', flag: '🇩🇪', native: 'Deutsch' },
    { code: 'it', name: 'Italian', flag: '🇮🇹', native: 'Italiano' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹', native: 'Português' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺', native: 'Русский' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵', native: '日本語' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷', native: '한국어' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳', native: '中文' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦', native: 'العربية' },
    { code: 'th', name: 'Thai', flag: '🇹🇭', native: 'ไทย' },
    { code: 'vi', name: 'Vietnamese', flag: '🇻🇳', native: 'Tiếng Việt' },
    { code: 'tr', name: 'Turkish', flag: '🇹🇷', native: 'Türkçe' }
  ];

  useEffect(() => {
    let initAttempts = 0;
    const maxAttempts = 5; // Reduced attempts for faster fallback

    // Set timeout to show fallback if Google Translate doesn't load
    const fallbackTimeout = setTimeout(() => {
      if (!isLoaded) {
        console.log('Google Translate loading timeout, showing fallback');
        setShowFallback(true);
      }
    }, 10000); // 10 seconds timeout

    // Initialize Google Translate
    const initGoogleTranslate = () => {
      console.log('Attempting to initialize Google Translate...');

      if (window.google && window.google.translate && window.google.translate.TranslateElement) {
        try {
          // Clear any existing widget
          const element = document.getElementById('google_translate_element');
          if (element) {
            element.innerHTML = '';
          }

          new window.google.translate.TranslateElement({
            pageLanguage: 'en',
            includedLanguages: 'en,te,ta,ml,hi,bn,gu,kn,mr,pa,ur,es,fr,de,it,pt,ru,ja,ko,zh,ar,th,vi,tr,pl,nl,sv,da,no,fi,he,fa,id,ms,tl',
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
            multilanguagePage: true
          }, 'google_translate_element');

          // Wait for the widget to render and then style it
          setTimeout(() => {
            const element = document.getElementById('google_translate_element');
            const widget = document.querySelector('#google_translate_element .goog-te-combo');
            const gadget = document.querySelector('#google_translate_element .goog-te-gadget');

            console.log('Checking for Google Translate elements:');
            console.log('Element:', element);
            console.log('Widget:', widget);
            console.log('Gadget:', gadget);
            console.log('Element HTML:', element?.innerHTML);

            if (widget) {
              // Force widget to be visible
              widget.style.display = 'block';
              widget.style.visibility = 'visible';
              widget.style.opacity = '1';
              widget.style.width = '100%';
              widget.style.padding = '10px';
              widget.style.border = '2px solid #e1e5e9';
              widget.style.borderRadius = '8px';
              widget.style.fontSize = '14px';
              widget.style.backgroundColor = 'white';
              widget.style.color = '#333';
              widget.style.height = 'auto';
              widget.style.minHeight = '40px';

              // Force parent elements to be visible too
              if (gadget) {
                gadget.style.display = 'block';
                gadget.style.visibility = 'visible';
                gadget.style.opacity = '1';
              }

              if (element) {
                element.style.display = 'block';
                element.style.visibility = 'visible';
                element.style.opacity = '1';
              }

              setIsLoaded(true);
              setShowFallback(false);
              clearTimeout(fallbackTimeout);
              console.log('Google Translate widget styled and ready');
            } else if (element && element.innerHTML.trim()) {
              // Widget exists but selector didn't find it, still mark as loaded
              console.log('Widget content exists, marking as loaded');
              setIsLoaded(true);
              setShowFallback(false);
              clearTimeout(fallbackTimeout);
            } else {
              console.log('Widget not found, showing fallback');
              setShowFallback(true);
              setIsLoaded(false);
            }
          }, 1500); // Increased timeout for better loading

          // Second attempt with different timing
          setTimeout(() => {
            const widget = document.querySelector('#google_translate_element select') ||
                          document.querySelector('#google_translate_element .goog-te-combo') ||
                          document.querySelector('.goog-te-combo');

            if (widget && !isLoaded) {
              console.log('Found widget on second attempt:', widget);
              widget.style.display = 'block';
              widget.style.visibility = 'visible';
              widget.style.opacity = '1';
              setIsLoaded(true);
              setShowFallback(false);
              clearTimeout(fallbackTimeout);
            }
          }, 3000);

          console.log('Google Translate initialized successfully');
        } catch (error) {
          console.error('Google Translate init error:', error);

          // Retry initialization
          if (initAttempts < maxAttempts) {
            initAttempts++;
            setTimeout(initGoogleTranslate, 1000);
          } else {
            // Show fallback after max attempts
            setShowFallback(true);
            setIsLoaded(false);
          }
        }
      } else {
        console.log('Google Translate not ready, retrying...');

        // Retry if Google Translate isn't ready yet
        if (initAttempts < maxAttempts) {
          initAttempts++;
          setTimeout(initGoogleTranslate, 1000);
        } else {
          // Show fallback after max attempts
          setShowFallback(true);
          setIsLoaded(false);
        }
      }
    };

    // Manual translation fallback
    const handleManualTranslate = (langCode) => {
      if (langCode === 'en') {
        // Reset to original
        window.location.reload();
        return;
      }

      // Use Google Translate URL redirect as fallback
      const currentUrl = encodeURIComponent(window.location.href);
      const translateUrl = `https://translate.google.com/translate?sl=en&tl=${langCode}&u=${currentUrl}`;

      // Open in same window
      window.location.href = translateUrl;
    };

    // Load Google Translate script
    if (!window.google || !window.google.translate) {
      console.log('Loading Google Translate script...');

      // Set up global callback
      window.googleTranslateElementInit = initGoogleTranslate;

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;

      script.onload = () => {
        console.log('Google Translate script loaded');
        setTimeout(initGoogleTranslate, 500);
      };

      script.onerror = () => {
        console.error('Failed to load Google Translate script');
      };

      document.head.appendChild(script);
    } else {
      console.log('Google Translate already available');
      initGoogleTranslate();
    }

    // Cleanup function
    return () => {
      // Clean up timeout
      clearTimeout(fallbackTimeout);

      // Clean up global callback
      if (window.googleTranslateElementInit) {
        delete window.googleTranslateElementInit;
      }
    };
  }, [isVisible]);

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
          {!showFallback && (
            <div>
              <div id="google_translate_element" style={{
                textAlign: 'center',
                minHeight: '50px',
                border: '1px dashed #ccc',
                padding: '10px',
                margin: '10px 0'
              }}></div>

              {/* Debug button */}
              <button
                onClick={() => {
                  const element = document.getElementById('google_translate_element');
                  const widget = document.querySelector('#google_translate_element .goog-te-combo');
                  const allSelects = document.querySelectorAll('select');
                  console.log('Debug - Element:', element);
                  console.log('Debug - Widget:', widget);
                  console.log('Debug - All selects:', allSelects);
                  console.log('Debug - Element HTML:', element?.innerHTML);

                  // Try to force show any hidden selects
                  allSelects.forEach((select, index) => {
                    console.log(`Select ${index}:`, select);
                    select.style.display = 'block';
                    select.style.visibility = 'visible';
                    select.style.opacity = '1';
                  });
                }}
                style={{
                  padding: '5px 10px',
                  fontSize: '12px',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Debug Widget
              </button>
            </div>
          )}

          {/* Fallback Language Selector */}
          {showFallback && (
            <div style={{
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {fallbackLanguages.map((lang) => (
                <div
                  key={lang.code}
                  onClick={() => handleManualTranslate(lang.code)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f8f9fa';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{lang.flag}</span>
                  <div>
                    <div style={{ fontWeight: '500', color: '#333' }}>
                      {lang.name}
                    </div>
                    {lang.native && (
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {lang.native}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Loading State */}
          {!isLoaded && !showFallback && (
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
            {showFallback ? 'Manual Translation (redirects to Google Translate)' : 'Powered by Google Translate'}
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

        /* Force Google Translate widget to be visible */
        #google_translate_element {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        }

        #google_translate_element * {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
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
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          height: auto !important;
          min-height: 40px !important;
        }

        #google_translate_element .goog-te-combo:focus {
          border-color: #4285f4 !important;
          box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1) !important;
        }

        #google_translate_element .goog-te-combo:hover {
          border-color: #4285f4 !important;
        }

        /* Force gadget to be visible */
        .goog-te-gadget {
          font-family: inherit !important;
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        }

        .goog-te-gadget .goog-te-combo {
          margin: 0 !important;
          display: block !important;
          visibility: visible !important;
        }

        /* Style the menu value */
        .goog-te-gadget-simple {
          display: block !important;
          visibility: visible !important;
        }

        .goog-te-gadget-simple .goog-te-menu-value {
          display: block !important;
          visibility: visible !important;
        }

        .goog-te-gadget-simple .goog-te-menu-value span:first-child {
          display: none !important;
        }

        .goog-te-gadget-simple .goog-te-menu-value:before {
          content: 'Select Language' !important;
          color: #666 !important;
        }

        /* Force dropdown options to be visible */
        .goog-te-combo option {
          display: block !important;
          visibility: visible !important;
          color: #333 !important;
          background: white !important;
        }
      `}</style>
    </div>
  );
};

export default BasicGoogleTranslate;
