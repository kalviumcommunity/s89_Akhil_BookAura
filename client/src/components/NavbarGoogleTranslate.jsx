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
      setTimeout(() => translateWholePage(savedLang), 1000);
    }
  }, []);

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
          gap: '8px',
          padding: '8px 12px',
          color: 'white',
          border: 'none',
          borderRadius: '25px',
          cursor: 'pointer',
        }}
        title={currentLang === 'en' ? 'Translate Page' : `Translated to ${languages.find(l => l.code === currentLang)?.name}`}
      >
        <Languages size={14} />
        <span style={{ display: 'none' }}>
          {currentLang === 'en' ? 'EN' : currentLang.toUpperCase()}
        </span>
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

      {/* CSS for hiding Google Translate banner */}
      <style jsx global>{`
        .goog-te-banner-frame {
          display: none !important;
        }
        body {
          top: 0 !important;
        }
        .goog-te-combo {
          display: none !important;
        }
      `}</style>
    </div>
  );
};

export default NavbarGoogleTranslate;
