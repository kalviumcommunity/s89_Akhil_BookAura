// Direct Google Translate - Opens in new tab (guaranteed to work)
import React, { useState } from 'react';
import { Globe, ChevronDown, ExternalLink } from 'lucide-react';

const DirectGoogleTranslate = ({ position = 'top-right' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  // Language options with Google Translate codes
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
    { code: 'pl', name: 'Polish', flag: '🇵🇱', native: 'Polski' },
    { code: 'nl', name: 'Dutch', flag: '🇳🇱', native: 'Nederlands' },
    { code: 'sv', name: 'Swedish', flag: '🇸🇪', native: 'Svenska' },
    { code: 'da', name: 'Danish', flag: '🇩🇰', native: 'Dansk' },
    { code: 'no', name: 'Norwegian', flag: '🇳🇴', native: 'Norsk' },
    { code: 'fi', name: 'Finnish', flag: '🇫🇮', native: 'Suomi' }
  ];

  const handleLanguageSelect = (languageCode) => {
    setSelectedLanguage(languageCode);
    setIsVisible(false);
    
    if (languageCode === 'en') {
      console.log('🔄 English selected - staying on original page');
      return;
    }

    // Get current page URL
    const currentUrl = window.location.href;
    
    // Create Google Translate URL
    const translateUrl = `https://translate.google.com/translate?sl=en&tl=${languageCode}&u=${encodeURIComponent(currentUrl)}`;
    
    console.log(`🌍 Opening Google Translate for ${languageCode}:`, translateUrl);
    
    // Open in new tab
    window.open(translateUrl, '_blank', 'noopener,noreferrer');
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

  const selectedLang = languages.find(lang => lang.code === selectedLanguage);

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
          minWidth: '140px',
          justifyContent: 'center'
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
        <span>Translate Page</span>
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
            overflowY: 'auto',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
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
            borderRadius: '12px 12px 0 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={18} />
              <span>Select Language</span>
            </div>
            <ExternalLink size={16} />
          </div>
          
          {/* Info */}
          <div style={{
            padding: '12px 20px',
            backgroundColor: '#f8f9fa',
            fontSize: '12px',
            color: '#666',
            borderBottom: '1px solid #eee'
          }}>
            📖 Opens translated page in new tab
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
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default DirectGoogleTranslate;
