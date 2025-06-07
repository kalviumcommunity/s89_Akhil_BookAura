// Enhanced NavbarGoogleTranslate Component
import React, { useState, useEffect } from 'react';
import { Languages } from 'lucide-react';

const NavbarGoogleTranslate = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');

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

  useEffect(() => {
    const savedLang = localStorage.getItem('translate-lang') || 'en';
    setCurrentLang(savedLang);
    if (savedLang !== 'en') {
      setTimeout(() => {
        translateWholePage(savedLang);
      }, 1000);
    }
  }, []);

  const removeBanner = () => {
    const removeElements = () => {
      const banners = document.querySelectorAll('.goog-te-banner-frame, iframe.goog-te-banner-frame');
      banners.forEach(banner => {
        if (banner?.parentNode) banner.parentNode.removeChild(banner);
      });

      document.body.style.top = '0';
      document.body.style.position = 'static';
    };

    // Repeat removal every 500ms for 5 seconds
    const interval = setInterval(removeElements, 500);
    setTimeout(() => clearInterval(interval), 5000);

    // Observer for late-injected banners
    const observer = new MutationObserver(removeElements);
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 5000);
  };

  const handleTranslate = (langCode) => {
    setCurrentLang(langCode);
    localStorage.setItem('translate-lang', langCode);
    setIsVisible(false);
    langCode === 'en' ? window.location.reload() : translateWholePage(langCode);
  };

  const translateWholePage = (langCode) => {
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      document.head.appendChild(script);
    }

    window.googleTranslateElementInit = function () {
      new window.google.translate.TranslateElement({
        pageLanguage: 'en',
        includedLanguages: languages.map(l => l.code).join(','),
        autoDisplay: false
      }, 'navbar_google_translate_element');

      setTimeout(() => {
        const select = document.querySelector('.goog-te-combo');
        if (select) {
          select.value = langCode;
          select.dispatchEvent(new Event('change'));
        }
        removeBanner();
      }, 500);
    };

    if (window.google?.translate) {
      window.googleTranslateElementInit();
    }
  };

  return (
    <div style={{ position: 'relative' }}>
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
          border: currentLang !== 'en' ? '2px solid #34a853' : 'none'
        }}
      >
        <Languages size={20} />
        {currentLang !== 'en' && (
          <span style={{ fontSize: '10px', color: '#34a853', fontWeight: 'bold' }}>{currentLang}</span>
        )}
      </div>

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

          {languages.map((lang) => (
            <div
              key={lang.code}
              onClick={() => handleTranslate(lang.code)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                backgroundColor: currentLang === lang.code ? '#e8f5e8' : 'white',
                borderBottom: '1px solid #f0f0f0'
              }}
            >
              <span style={{ fontSize: '14px' }}>{lang.flag}</span>
              <span style={{ fontWeight: currentLang === lang.code ? 'bold' : 'normal' }}>
                {lang.name}
              </span>
              {currentLang === lang.code && (
                <span style={{ marginLeft: 'auto', color: '#34a853' }}>✓</span>
              )}
            </div>
          ))}
        </div>
      )}

      <div id="navbar_google_translate_element" style={{ display: 'none' }}></div>

      <style jsx global>{`
        html, body {
          margin-top: 0 !important;
          padding-top: 0 !important;
          top: 0 !important;
          position: static !important;
        }

        .goog-te-banner-frame,
        .goog-te-banner-frame.skiptranslate,
        iframe.goog-te-banner-frame,
        .goog-te-gadget,
        .goog-te-combo,
        .goog-te-spinner-pos,
        .goog-te-banner-content,
        .goog-te-banner-frame * {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          overflow: hidden !important;
        }

        [id^="goog-gt-"], [class^="goog-te-"] {
          display: none !important;
        }

        body > .goog-te-banner-frame,
        body > .goog-te-banner-frame * {
          display: none !important;
          visibility: hidden !important;
        }
      `}</style>
    </div>
  );
};

export default NavbarGoogleTranslate;
