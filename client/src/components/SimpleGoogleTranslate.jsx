import React, { useState, useEffect, useRef } from 'react';
import { Languages } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import './SimpleGoogleTranslate.css';

const SimpleGoogleTranslate = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const dropdownRef = useRef(null);

  const location = useLocation();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsVisible(false);
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible]);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
    { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
    { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'ml', name: 'മലയാളം', flag: '🇮🇳' },
    { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
    { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
    { code: 'bn', name: 'বাংলা', flag: '🇮🇳' },
    { code: 'ur', name: 'اردو', flag: '🇵🇰' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'th', name: 'ไทย', flag: '🇹🇭' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  ];

  // Simple: just move navbar down when banner appears
  useEffect(() => {
    const adjustNavbar = () => {
      const navbar = document.querySelector('.navbar');

      if (navbar) {
        // Always keep navbar top at 0
        navbar.style.top = '0px';
      }
    };

    const interval = setInterval(adjustNavbar, 100);
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Reload language on path change
  useEffect(() => {
    const savedLang = localStorage.getItem('translate-lang') || 'en';
    setCurrentLang(savedLang);
    if (savedLang !== 'en') {
      setTimeout(() => translatePage(savedLang), 1000);
    }
  }, [location.pathname]);



  const translatePage = (langCode) => {
    // Remove old scripts
    document.querySelectorAll('#google-translate-script, #google_translate_element').forEach(el => el.remove());

    // Create container
    const div = document.createElement('div');
    div.id = 'google_translate_element';
    div.style.display = 'none';
    document.body.appendChild(div);

    // Inject script - allow banner to show naturally
    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    window.googleTranslateElementInit = function () {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement({
          pageLanguage: 'en',
          includedLanguages: languages.map(l => l.code).join(','),
          autoDisplay: false
        }, 'google_translate_element');

        // Trigger translation
        setTimeout(() => {
          const select = document.querySelector('.goog-te-combo');
          if (select) {
            select.value = langCode;
            select.dispatchEvent(new Event('change'));
          }
        }, 1000);
      }
    };
  };

  const handleTranslate = (langCode) => {
    setCurrentLang(langCode);
    localStorage.setItem('translate-lang', langCode);
    setIsVisible(false);

    if (langCode === 'en') {
      // Clear translation state and reload
      localStorage.removeItem('translate-active');
      document.cookie = "googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = `googtrans=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      window.location.reload();
    } else {
      // Start translation and mark as active
      localStorage.setItem('translate-active', 'true');
      translatePage(langCode);
    }
  };

  const currentLanguage = languages.find(l => l.code === currentLang) || languages[0];

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={dropdownRef}>
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          backgroundColor: 'transparent',
          border: '1px solid #ddd',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          color: '#333',
        }}
      >
        <Languages size={16} />
        <span>{currentLanguage.flag}</span>
        <span>{currentLanguage.name}</span>
      </button>

      {isVisible && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 1000,
          minWidth: '200px',
          maxHeight: '300px',
          overflowY: 'auto',
        }}>
          <p className="error-help">If translation is not working, then goto <a href="https://translate.google.com">translate.google.com</a> and send request to the organization because they have not enabled translation for this website.</p>
          {languages.map(language => (
            <button
              key={language.code}
              onClick={() => handleTranslate(language.code)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '10px 15px',
                border: 'none',
                backgroundColor: currentLang === language.code ? '#f0f0f0' : 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                textAlign: 'left',
              }}
            >
              <span>{language.flag}</span>
              <span>{language.name}</span>
            </button>
          ))}
        </div>
      )}

      <style jsx="true" global>{`
        /* Let banner appear at top but under navbar */
        .goog-te-banner-frame {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          width: 100% !important;
          z-index: 1 !important;
        }

        /* Hide translate gadget */
        .goog-te-gadget {
          display: none !important;
        }
      `}</style>
    </div>
  );
};

export default SimpleGoogleTranslate;


