// Simple Navbar Google Translate - Whole page translation with memory
import React, { useState, useEffect } from 'react';
import { Globe, ChevronDown, Languages } from 'lucide-react';

const NavbarGoogleTranslate = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');

  // Simple language options
  const languages = [
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

  // Load saved language on page load
  useEffect(() => {
    const savedLang = localStorage.getItem('translate-lang') || 'en';
    setCurrentLang(savedLang);
    if (savedLang !== 'en') {
      setTimeout(() => {
        translateWholePage(savedLang);
        // Remove banner after auto-translation
        setTimeout(() => {
          removeBanner();
        }, 2000);
      }, 1000);
    }
  }, []);

  // Aggressive function to remove all Google Translate UI
  const removeBanner = () => {
    const removeElements = () => {
      // Remove all Google Translate elements
      const selectors = [
        '.goog-te-banner-frame',
        'iframe.goog-te-banner-frame',
        '.goog-te-banner-frame.skiptranslate',
        '[id^="goog-gt-"]',
        '[class^="goog-te-"]',
        '[class*="goog-te-"]',
        'div[jsaction*="translate"]'
      ];

      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (element && element.parentNode) {
            element.parentNode.removeChild(element);
          }
        });
      });

      // Remove any fixed/sticky positioned elements that might be Google Translate
      const fixedElements = document.querySelectorAll('body > div[style*="position: fixed"], body > div[style*="position: sticky"], body > iframe[style*="position: fixed"]');
      fixedElements.forEach(element => {
        if (element.textContent && (
          element.textContent.includes('Google Translate') ||
          element.textContent.includes('Translated into') ||
          element.textContent.includes('Show original')
        )) {
          if (element.parentNode) {
            element.parentNode.removeChild(element);
          }
        }
      });

      // Force reset body styles
      document.body.style.top = '0';
      document.body.style.position = 'static';
      document.body.style.marginTop = '0';
      document.body.style.paddingTop = '0';

      // Ensure navbar stays on top
      const navbar = document.querySelector('.navbar');
      if (navbar) {
        navbar.style.zIndex = '9999';
        navbar.style.position = 'relative';
      }
    };

    // Immediate removal
    removeElements();

    // Multiple timed removals
    setTimeout(removeElements, 50);
    setTimeout(removeElements, 100);
    setTimeout(removeElements, 200);
    setTimeout(removeElements, 500);
    setTimeout(removeElements, 1000);
    setTimeout(removeElements, 2000);

    // Set up aggressive observer
    const observer = new MutationObserver((mutations) => {
      let shouldRemove = false;
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            if (node.className && (
              node.className.includes('goog-te-') ||
              node.id && node.id.includes('goog-gt-')
            )) {
              shouldRemove = true;
            }
          }
        });
      });

      if (shouldRemove) {
        setTimeout(removeElements, 10);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'id']
    });

    // Stop observing after 10 seconds
    setTimeout(() => observer.disconnect(), 10000);
  };

  // Simple whole page translation
  const handleTranslate = (langCode) => {
    setCurrentLang(langCode);
    localStorage.setItem('translate-lang', langCode);
    setIsVisible(false);

    if (langCode === 'en') {
      // Reset to English
      window.location.reload();
    } else {
      // Translate whole page
      translateWholePage(langCode);
    }
  };

  // Translate entire page using Google Translate
  const translateWholePage = (langCode) => {
    // Add Google Translate script if not exists
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      document.head.appendChild(script);
    }

    // Initialize Google Translate
    window.googleTranslateElementInit = function() {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement({
          pageLanguage: 'en',
          includedLanguages: 'en,hi,te,ta,ml,bn,gu,kn,mr,pa,ur,es,fr,de,it,pt,ru,ja,ko,zh,ar,th,vi,tr',
          autoDisplay: false
        }, 'navbar_google_translate_element');

        // Auto-select the language
        setTimeout(() => {
          const select = document.querySelector('.goog-te-combo');
          if (select) {
            select.value = langCode;
            select.dispatchEvent(new Event('change'));
          }

          // Remove Google Translate banner after translation
          removeBanner();
        }, 500);
      }
    };

    // Trigger initialization if script already loaded
    if (window.google && window.google.translate) {
      window.googleTranslateElementInit();
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Compact Navbar Button */}
      <div
        onClick={() => setIsVisible(!isVisible)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '8px 12px',
          backgroundColor: 'transparent',
          color: '#333',
          borderRadius: '20px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: '500',
          minWidth: '40px',
          justifyContent: 'center',
          border: currentLang !== 'en' ? '2px solid #34a853' : 'none',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#f5f5f5';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'transparent';
        }}
        title={currentLang === 'en' ? 'Translate Page' : `Translated to ${languages.find(l => l.code === currentLang)?.name}`}
      >
        <Languages size={20} color={currentLang === 'en' ? '#333' : '#333'} />
        {currentLang !== 'en' && (
          <span style={{
            fontSize: '10px',
            color: '#34a853',
            fontWeight: 'bold',
            textTransform: 'uppercase'
          }}>
            {currentLang}
          </span>
        )}
      </div>

      {/* Compact Dropdown */}
      {isVisible && (
        <div style={{
          position: 'absolute',
          top: '40px',
          right: '0',
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          minWidth: '200px',
          maxHeight: '250px',
          overflowY: 'auto',
          zIndex: 1001
        }}>
          <div style={{
            padding: '8px 12px',
            borderBottom: '1px solid #eee',
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#333',
            backgroundColor: '#f8f9fa'
          }}>
            Translate Page
          </div>

          {languages.slice(0, 12).map((lang) => (
            <div
              key={lang.code}
              onClick={() => handleTranslate(lang.code)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                backgroundColor: currentLang === lang.code ? '#e8f5e8' : 'white'
              }}
              onMouseEnter={(e) => {
                if (currentLang !== lang.code) {
                  e.target.style.backgroundColor = '#f5f5f5';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = currentLang === lang.code ? '#e8f5e8' : 'white';
              }}
            >
              <span style={{ fontSize: '14px' }}>{lang.flag}</span>
              <span style={{ fontWeight: currentLang === lang.code ? 'bold' : 'normal' }}>
                {lang.name}
              </span>
              {currentLang === lang.code && (
                <span style={{ marginLeft: 'auto', color: '#34a853', fontSize: '12px' }}>✓</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Hidden Google Translate Element */}
      <div id="navbar_google_translate_element" style={{ display: 'none' }}></div>

      {/* CSS for completely hiding Google Translate banner */}
      <style jsx global>{`
        /* AGGRESSIVE HIDING - Remove all Google Translate UI */
        .goog-te-banner-frame,
        .goog-te-banner-frame.skiptranslate,
        iframe.goog-te-banner-frame,
        .goog-te-banner-frame * {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          height: 0 !important;
          width: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          border: none !important;
          position: absolute !important;
          top: -9999px !important;
          left: -9999px !important;
          z-index: -1 !important;
          overflow: hidden !important;
        }

        /* Force body to stay in normal position */
        body {
          top: 0 !important;
          position: static !important;
          margin-top: 0 !important;
          padding-top: 0 !important;
        }

        /* Hide all Google Translate elements */
        .goog-te-combo,
        .goog-te-gadget,
        .goog-te-gadget-simple,
        .goog-te-menu-value,
        .goog-te-spinner-pos,
        #google_translate_element,
        #navbar_google_translate_element,
        [id^="goog-gt-"],
        [class^="goog-te-"],
        [class*="goog-te-"],
        div[jsaction*="translate"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
        }

        /* Remove any fixed/sticky positioning from Google elements */
        body > div[style*="position: fixed"],
        body > div[style*="position: sticky"],
        body > iframe[style*="position: fixed"],
        body > iframe[style*="position: sticky"] {
          display: none !important;
        }

        /* Specifically target the notification bar */
        body > div[style*="background-color: rgb(245, 245, 245)"],
        body > div[style*="border-bottom"],
        body > div[style*="font-size: 13px"] {
          display: none !important;
        }

        /* Hide any element that contains Google Translate text */
        div:contains("Google Translate"),
        div:contains("Translated into"),
        div:contains("Show original"),
        div:contains("Options") {
          display: none !important;
        }

        /* Ensure navbar stays on top */
        .navbar {
          z-index: 9999 !important;
          position: relative !important;
        }
      `}</style>
    </div>
  );
};

export default NavbarGoogleTranslate;
