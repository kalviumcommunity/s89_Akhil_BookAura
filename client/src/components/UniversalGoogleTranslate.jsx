// Universal Google Translate - Works in both development and production
import React, { useState, useEffect } from 'react';
import { Globe, ChevronDown, Info } from 'lucide-react';

const UniversalGoogleTranslate = ({ position = 'top-right' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isProduction, setIsProduction] = useState(false);

  // Language options
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'te', name: 'Telugu', flag: '🇮🇳', native: 'తెలుగు' },
    { code: 'ta', name: 'Tamil', flag: '🇮🇳', native: 'தமிழ்' },
    { code: 'ml', name: 'Malayalam', flag: '🇮🇳', native: 'മലയാളം' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳', native: 'हिन्दी' },
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
    { code: 'tr', name: 'Turkish', flag: '🇹🇷', native: 'Türkçe' },
    { code: 'pl', name: 'Polish', flag: '🇵🇱', native: 'Polski' }
  ];

  // Check if we're in production
  useEffect(() => {
    const hostname = window.location.hostname;
    const isProductionEnv = hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.startsWith('192.168');
    setIsProduction(isProductionEnv);
    console.log('🌍 Environment check:', { hostname, isProduction: isProductionEnv });
  }, []);

  // Initialize Google Translate for in-page translation (development)
  useEffect(() => {
    if (isProduction) return; // Skip for production

    const initGoogleTranslate = () => {
      if (window.google && window.google.translate) {
        console.log('✅ Google Translate API ready for development');
        return;
      }

      if (!document.querySelector('script[src*="translate.google.com"]')) {
        const script = document.createElement('script');
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        document.head.appendChild(script);
      }
    };

    window.googleTranslateElementInit = () => {
      console.log('🌍 Google Translate initialized for development');
    };

    initGoogleTranslate();
  }, [isProduction]);

  const handleLanguageSelect = (languageCode) => {
    setSelectedLanguage(languageCode);
    setIsVisible(false);
    
    if (languageCode === 'en') {
      if (!isProduction) {
        restoreOriginal();
      }
      return;
    }

    setIsTranslating(true);
    console.log(`🔄 Translating to: ${languageCode} (${isProduction ? 'Production' : 'Development'} mode)`);

    if (isProduction) {
      // Production: Use Google Translate URL (works for deployed sites)
      const currentUrl = window.location.href;
      const translateUrl = `https://translate.google.com/translate?sl=en&tl=${languageCode}&u=${encodeURIComponent(currentUrl)}`;
      console.log('🔗 Opening Google Translate (Production):', translateUrl);
      window.open(translateUrl, '_blank', 'noopener,noreferrer');
      setIsTranslating(false);
    } else {
      // Development: Use in-page translation
      translateInPage(languageCode);
    }
  };

  const translateInPage = (languageCode) => {
    try {
      if (window.google && window.google.translate) {
        // Create hidden translate element
        const translateDiv = document.createElement('div');
        translateDiv.id = 'hidden_google_translate_element';
        translateDiv.style.display = 'none';
        document.body.appendChild(translateDiv);

        new window.google.translate.TranslateElement({
          pageLanguage: 'en',
          includedLanguages: `en,${languageCode}`,
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false
        }, 'hidden_google_translate_element');

        // Trigger translation
        setTimeout(() => {
          const select = translateDiv.querySelector('.goog-te-combo');
          if (select) {
            const targetOption = Array.from(select.options).find(option => 
              option.value.includes(languageCode)
            );
            if (targetOption) {
              select.value = targetOption.value;
              select.dispatchEvent(new Event('change', { bubbles: true }));
              console.log('✅ In-page translation triggered');
            }
          }
          setIsTranslating(false);
        }, 1000);
      } else {
        console.log('❌ Google Translate API not available, showing message');
        alert(`Translation to ${languages.find(l => l.code === languageCode)?.name} is not available in development mode. This will work when the site is deployed.`);
        setIsTranslating(false);
      }
    } catch (error) {
      console.error('❌ Translation error:', error);
      alert('Translation is not available in development mode. This will work when the site is deployed.');
      setIsTranslating(false);
    }
  };

  const restoreOriginal = () => {
    const existingSelect = document.querySelector('.goog-te-combo');
    if (existingSelect) {
      const englishOption = Array.from(existingSelect.options).find(option => 
        option.value === '' || option.value.includes('en')
      );
      if (englishOption) {
        existingSelect.value = englishOption.value;
        existingSelect.dispatchEvent(new Event('change', { bubbles: true }));
        return;
      }
    }
    window.location.reload();
  };

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
          backgroundColor: isTranslating ? '#6c757d' : '#A67C52',
          color: 'white',
          border: 'none',
          borderRadius: '25px',
          cursor: isTranslating ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 15px rgba(166, 124, 82, 0.3)',
          transition: 'all 0.3s ease',
          fontSize: '14px',
          fontWeight: '500',
          minWidth: '140px',
          justifyContent: 'center'
        }}
      >
        <Globe size={18} />
        <span>{isTranslating ? 'Translating...' : 'Translate'}</span>
        <ChevronDown size={16} />
      </div>

      {/* Language Dropdown */}
      {isVisible && (
        <div
          style={{
            position: 'absolute',
            top: '60px',
            right: '0',
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '12px',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
            minWidth: '320px',
            maxWidth: '350px',
            zIndex: 1001,
            maxHeight: '450px',
            overflowY: 'auto'
          }}
        >
          {/* Header */}
          <div style={{ 
            padding: '16px 20px', 
            borderBottom: '1px solid #eee',
            background: 'linear-gradient(135deg, #A67C52, #8B6A3F)',
            color: 'white',
            fontWeight: '600',
            fontSize: '15px',
            borderRadius: '12px 12px 0 0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={18} />
              <span>Select Language</span>
            </div>
          </div>
          
          {/* Environment Info */}
          <div style={{
            padding: '12px 20px',
            backgroundColor: isProduction ? '#e8f5e8' : '#fff3cd',
            fontSize: '12px',
            color: isProduction ? '#155724' : '#856404',
            borderBottom: '1px solid #eee',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Info size={14} />
            <span>
              {isProduction 
                ? '🌐 Opens translated page in new tab' 
                : '⚠️ Limited translation in development mode'
              }
            </span>
          </div>
          
          {/* Language List */}
          {languages.map((language) => (
            <div
              key={language.code}
              onClick={() => handleLanguageSelect(language.code)}
              style={{
                padding: '12px 20px',
                cursor: 'pointer',
                borderBottom: '1px solid #f5f5f5',
                backgroundColor: selectedLanguage === language.code ? '#e3f2fd' : 'white',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
              onMouseEnter={(e) => {
                if (selectedLanguage !== language.code) {
                  e.target.style.backgroundColor = '#f8f9fa';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedLanguage !== language.code) {
                  e.target.style.backgroundColor = 'white';
                }
              }}
            >
              <span style={{ fontSize: '18px' }}>{language.flag}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '500', color: '#333' }}>
                  {language.name}
                </div>
                {language.native && (
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                    {language.native}
                  </div>
                )}
              </div>
              {selectedLanguage === language.code && (
                <span style={{ color: '#A67C52', fontWeight: 'bold', fontSize: '16px' }}>✓</span>
              )}
            </div>
          ))}
          
          {/* Close button */}
          <button
            onClick={() => setIsVisible(false)}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              fontSize: '16px',
              cursor: 'pointer',
              color: 'white'
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default UniversalGoogleTranslate;
