import React, { useState, useEffect } from 'react';
import { Globe, ChevronDown } from 'lucide-react';

const BasicGoogleTranslate = ({ position = 'middle-right' }) => {
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
      setTimeout(() => translateWholePage(savedLang), 1000);
    }
  }, []);

  const handleTranslate = (langCode) => {
    setCurrentLang(langCode);
    localStorage.setItem('translate-lang', langCode);
    setIsVisible(false);

    if (langCode === 'en') {
      const frame = document.querySelector('iframe.goog-te-banner-frame');
      if (frame) frame.remove();
      const elem = document.getElementById('google_translate_element');
      if (elem) elem.innerHTML = '';
      const script = document.getElementById('google-translate-script');
      if (script) script.remove();
      localStorage.removeItem('translate-lang');
      return;
    }

    translateWholePage(langCode);
  };

  const translateWholePage = (langCode) => {
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      document.head.appendChild(script);
    }

    window.googleTranslateElementInit = function () {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement({
          pageLanguage: 'en',
          includedLanguages: languages.map(l => l.code).join(','),
          autoDisplay: false
        }, 'google_translate_element');

        setTimeout(() => {
          const select = document.querySelector('.goog-te-combo');
          if (select) {
            select.value = langCode;
            select.dispatchEvent(new Event('change'));
          }
        }, 500);
      }
    };

    if (window.google && window.google.translate) {
      window.googleTranslateElementInit();
    }
  };

  const getPositionStyles = () => {
    const base = { position: 'fixed', zIndex: 1000 };
    switch (position) {
      case 'top-left': return { ...base, top: '80px', left: '20px' };
      case 'top-right': return { ...base, top: '80px', right: '20px' };
      case 'bottom-left': return { ...base, bottom: '20px', left: '20px' };
      case 'bottom-right': return { ...base, bottom: '20px', right: '20px' };
      case 'middle-right': default: return { ...base, top: '50%', right: '20px', transform: 'translateY(-50%)' };
    }
  };

  return (
    <div style={getPositionStyles()}>
      {/* Button */}
      <div
        onClick={() => setIsVisible(!isVisible)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          backgroundColor: currentLang === 'en' ? '#4285f4' : '#34a853',
          color: 'white',
          borderRadius: '25px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500'
        }}
      >
        <Globe size={18} />
        <span>{currentLang === 'en' ? 'Translate' : languages.find(l => l.code === currentLang)?.name}</span>
        <ChevronDown size={16} />
      </div>

      {/* Dropdown */}
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
          <div style={{ marginBottom: '16px', textAlign: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#333' }}>
              <Globe size={20} style={{ color: '#4285f4', marginRight: 6 }} />
              Translate Page
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
              Select a language to translate this page
            </p>
          </div>

          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {languages.map((lang) => (
              <div
                key={lang.code}
                onClick={() => handleTranslate(lang.code)}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: currentLang === lang.code ? '#e8f5e8' : 'transparent',
                  transition: 'background-color 0.2s ease'
                }}
              >
                <span style={{ fontSize: '18px' }}>{lang.flag}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: currentLang === lang.code ? 'bold' : '500', color: '#333' }}>
                    {lang.name}
                  </div>
                  {lang.native && (
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {lang.native}
                    </div>
                  )}
                </div>
                {currentLang === lang.code && (
                  <span style={{ color: '#34a853', fontSize: '16px', fontWeight: 'bold' }}>✓</span>
                )}
              </div>
            ))}
          </div>

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
              color: '#999'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Hidden Google Element */}
      <div id="google_translate_element" style={{ display: 'none' }} />

      {/* Google Translate cleanup styles */}
      <style jsx global>{`
        iframe.goog-te-banner-frame {
          display: none !important;
        }
        body {
          top: 0px !important;
        }
        .goog-te-combo {
          display: none !important;
        }
        .goog-logo-link, .goog-te-gadget span {
          display: none !important;
        }
      `}</style>
    </div>
  );
};

export default BasicGoogleTranslate;
