// Simple Google Translate - Just language selector
import React, { useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';

const BasicGoogleTranslate = ({ position = 'middle-right' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedCount, setTranslatedCount] = useState(0);

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

  // Simple translation
  const handleTranslate = async (langCode) => {
    if (langCode === 'en') {
      restoreOriginalText();
      return;
    }

    setIsTranslating(true);
    setIsVisible(false);

    // Get all text elements - much simpler approach
    const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, li, td, th');
    let count = 0;

    for (let element of elements) {
      const text = element.textContent?.trim();

      // Simple check: has text, not already translated, no child elements
      if (text &&
          text.length > 3 &&
          !element.dataset.originalText &&
          element.children.length === 0) {

        try {
          const translated = await translateText(text, langCode);
          if (translated && translated !== text) {
            element.dataset.originalText = text;
            element.textContent = translated;
            element.style.backgroundColor = '#e3f2fd';
            count++;
            setTranslatedCount(count);
          }
        } catch (error) {
          console.log('Skip element:', error);
        }

        // Small delay
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    setIsTranslating(false);
  };

  // Simple translation API call
  const translateText = async (text, targetLang) => {
    try {
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
      );
      const data = await response.json();
      return data?.[0]?.[0]?.[0] || text;
    } catch (error) {
      console.error('API translation error:', error);
      return text;
    }
  };

  // Restore original text
  const restoreOriginalText = () => {
    const elements = document.querySelectorAll('[data-original-text]');
    elements.forEach(element => {
      element.textContent = element.dataset.originalText;
      element.style.backgroundColor = '';
      delete element.dataset.originalText;
    });
    setTranslatedCount(0);
  };

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
      {/* Simple Button */}
      <div
        onClick={() => setIsVisible(!isVisible)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          backgroundColor: '#4285f4',
          color: 'white',
          borderRadius: '25px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500'
        }}
      >
        <Globe size={18} />
        <span>Translate</span>
        {translatedCount > 0 && (
          <span style={{
            fontSize: '12px',
            backgroundColor: 'rgba(255,255,255,0.3)',
            padding: '2px 6px',
            borderRadius: '10px'
          }}>
            {translatedCount}
          </span>
        )}
        <ChevronDown size={16} />
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
              Translate Page
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

          {/* Language Selector */}
          <div style={{
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
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
            Powered by Google Translate
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
      `}</style>
    </div>
  );
};

export default BasicGoogleTranslate;
