// Simple Google Translate Button - Fast and Reliable
import React, { useState } from 'react';
import { ChevronDown, Languages, ArrowRight } from 'lucide-react';

const SimpleTranslateButton = ({ position = 'top-right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedCount, setTranslatedCount] = useState(0);

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
    { code: 'zh', name: 'Chinese', flag: '🇨🇳', native: '中文' }
  ];

  // Fast Google Translate (Unauthorized API)
  const translateText = async (text, targetLang) => {
    try {
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
      );
      const data = await response.json();
      return data?.[0]?.[0]?.[0] || text;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  };

  // Translate all text in the page/book
  const translatePage = async (languageCode) => {
    if (languageCode === 'en') {
      restoreOriginal();
      return;
    }

    setIsTranslating(true);
    setTranslatedCount(0);
    console.log(`🚀 Translating to ${languageCode}...`);

    try {
      // Find all text elements
      const allElements = [];
      
      // Check iframes (EPUB content)
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
          if (iframeDoc) {
            const textElements = iframeDoc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, li, td, th');
            textElements.forEach(el => {
              if (el.children.length === 0 && el.textContent.trim().length > 2) {
                allElements.push(el);
              }
            });
          }
        } catch (e) {
          console.log('Cannot access iframe content');
        }
      });

      // Check main document
      const mainElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span:not([class*="translate"]):not([id*="translate"])');
      mainElements.forEach(el => {
        if (el.children.length === 0 && el.textContent.trim().length > 2) {
          allElements.push(el);
        }
      });

      console.log(`📝 Found ${allElements.length} text elements`);

      // Translate in batches for speed
      const batchSize = 10;
      let translated = 0;

      for (let i = 0; i < allElements.length; i += batchSize) {
        const batch = allElements.slice(i, i + batchSize);
        
        // Process batch in parallel
        const promises = batch.map(async (element) => {
          const originalText = element.textContent.trim();
          
          // Skip short or meaningless text
          if (originalText.length < 3 || /^[\d\s\.,;:!?\-'"()]+$/.test(originalText)) {
            return;
          }

          try {
            const translatedText = await translateText(originalText, languageCode);
            
            if (translatedText && translatedText !== originalText) {
              // Store original
              if (!element.dataset.originalText) {
                element.dataset.originalText = originalText;
              }
              
              // Apply translation
              element.textContent = translatedText;
              
              // Add visual indicator
              element.style.backgroundColor = 'rgba(166, 124, 82, 0.1)';
              element.style.borderLeft = '3px solid #A67C52';
              element.style.paddingLeft = '6px';
              element.style.borderRadius = '2px';
              element.style.transition = 'all 0.3s ease';
              
              translated++;
              setTranslatedCount(translated);
            }
          } catch (error) {
            console.error('Error translating element:', error);
          }
        });

        await Promise.all(promises);
        
        // Small delay between batches
        if (i + batchSize < allElements.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`✅ Translated ${translated} elements`);
      
    } catch (error) {
      console.error('Translation error:', error);
    }

    setIsTranslating(false);
  };

  // Restore original text
  const restoreOriginal = () => {
    const translatedElements = document.querySelectorAll('[data-original-text]');
    translatedElements.forEach(el => {
      if (el.dataset.originalText) {
        el.textContent = el.dataset.originalText;
        el.style.backgroundColor = '';
        el.style.borderLeft = '';
        el.style.paddingLeft = '';
        el.style.borderRadius = '';
        el.style.boxShadow = '';
      }
    });
    setTranslatedCount(0);
  };

  const handleLanguageSelect = (langCode) => {
    setSelectedLang(langCode);
    setIsOpen(false);
    translatePage(langCode);
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

  const currentLang = languages.find(lang => lang.code === selectedLang);

  return (
    <div style={getPositionStyles()}>
      {/* Main Translate Button */}
      <div
        onClick={() => !isTranslating && setIsOpen(!isOpen)}
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
          minWidth: '160px',
          justifyContent: 'space-between'
        }}
        onMouseEnter={(e) => {
          if (!isTranslating) {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(166, 124, 82, 0.4)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isTranslating) {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 15px rgba(166, 124, 82, 0.3)';
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Languages size={18} />
          <span>
            {isTranslating ? 'Translating...' : 'Translate'}
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {translatedCount > 0 && (
            <span style={{ 
              fontSize: '12px', 
              backgroundColor: 'rgba(255,255,255,0.2)', 
              padding: '2px 6px', 
              borderRadius: '10px' 
            }}>
              {translatedCount}
            </span>
          )}
          <ArrowRight size={16} />
        </div>
      </div>

      {/* Language Dropdown */}
      {isOpen && !isTranslating && (
        <div style={{
          position: 'absolute',
          top: '60px',
          right: '0',
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: '12px',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
          minWidth: '280px',
          maxHeight: '400px',
          overflowY: 'auto',
          zIndex: 1001
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #A67C52, #8B6A3F)',
            color: 'white',
            borderRadius: '12px 12px 0 0',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Languages size={16} />
            <span>Select Language</span>
          </div>

          {/* Current Selection */}
          <div style={{
            padding: '12px 20px',
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #eee',
            fontSize: '12px',
            color: '#666'
          }}>
            Current: {currentLang?.flag} {currentLang?.native || currentLang?.name}
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
                backgroundColor: selectedLang === language.code ? '#e3f2fd' : 'white',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              onMouseEnter={(e) => {
                if (selectedLang !== language.code) {
                  e.target.style.backgroundColor = '#f8f9fa';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedLang !== language.code) {
                  e.target.style.backgroundColor = 'white';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '18px' }}>{language.flag}</span>
                <div>
                  <div style={{ fontWeight: '500', color: '#333' }}>
                    {language.name}
                  </div>
                  {language.native && (
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {language.native}
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {selectedLang === language.code && (
                  <span style={{ color: '#A67C52', fontWeight: 'bold' }}>✓</span>
                )}
                <ArrowRight size={14} style={{ color: '#A67C52' }} />
              </div>
            </div>
          ))}

          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
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
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Progress Indicator */}
      {isTranslating && (
        <div style={{
          position: 'absolute',
          top: '60px',
          right: '0',
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '16px 20px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
          minWidth: '200px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid #A67C52',
              borderTop: '2px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>
              Translating...
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Translated {translatedCount} elements
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SimpleTranslateButton;
