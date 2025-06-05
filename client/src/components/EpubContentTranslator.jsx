// EPUB Content Translator - Translates text within the book
import React, { useState, useEffect } from 'react';
import { Globe, ChevronDown, RefreshCw, Eye, EyeOff } from 'lucide-react';
import translationService from '../services/translationService';

const EpubContentTranslator = ({ position = 'top-right' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedElements, setTranslatedElements] = useState(new Map());
  const [showOriginal, setShowOriginal] = useState(false);

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

  // Function to translate text using translation service
  const translateText = async (text, targetLanguage) => {
    return await translationService.translateText(text, targetLanguage);
  };

  // Function to find and translate text content in EPUB
  const translateEpubContent = async (languageCode) => {
    if (languageCode === 'en') {
      restoreOriginalContent();
      return;
    }

    setIsTranslating(true);
    console.log(`🔄 Translating EPUB content to: ${languageCode}`);

    try {
      // Find all text elements in the EPUB iframe and regular DOM
      const allIframes = document.querySelectorAll('iframe');
      const allTextElements = [];
      let translatedCount = 0;

      // First, collect all text elements from iframes (EPUB content)
      for (const iframe of allIframes) {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
          if (!iframeDoc) continue;

          // Find all text-containing elements
          const textElements = iframeDoc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, td, th, li, blockquote, em, strong, i, b');

          for (const element of textElements) {
            // Only process elements with direct text content (no nested elements)
            if (element.children.length === 0 && element.textContent.trim()) {
              const originalText = element.textContent.trim();

              // Skip if already translated or too short
              if (translatedElements.has(element) || originalText.length < 2) continue;

              // Skip numbers, punctuation, or single characters
              if (/^[\d\s\.,;:!?\-'"()]+$/.test(originalText)) continue;

              allTextElements.push({ element, originalText });
            }
          }
        } catch (error) {
          console.error('Error accessing iframe content:', error);
        }
      }

      // Also check for text in the main document (outside iframes)
      const mainTextElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div:not([class*="translate"]):not([id*="translate"])');
      for (const element of mainTextElements) {
        if (element.children.length === 0 && element.textContent.trim()) {
          const originalText = element.textContent.trim();
          if (originalText.length > 2 && !/^[\d\s\.,;:!?\-'"()]+$/.test(originalText)) {
            allTextElements.push({ element, originalText });
          }
        }
      }

      console.log(`📝 Found ${allTextElements.length} text elements to translate`);

      // Translate elements in batches for better performance
      const batchSize = 10;
      for (let i = 0; i < allTextElements.length; i += batchSize) {
        const batch = allTextElements.slice(i, i + batchSize);
        const texts = batch.map(item => item.originalText);

        try {
          const translations = await translationService.translateBatch(texts, languageCode);

          // Apply translations
          batch.forEach((item, index) => {
            const { element, originalText } = item;
            const translatedText = translations[index];

            if (translatedText && translatedText !== originalText) {
              // Store original text
              if (!element.dataset.originalText) {
                element.dataset.originalText = originalText;
              }

              // Apply translation
              element.textContent = translatedText;
              translatedElements.set(element, {
                original: originalText,
                translated: translatedText,
                language: languageCode
              });

              // Add visual indicator
              element.style.backgroundColor = 'rgba(166, 124, 82, 0.1)';
              element.style.borderLeft = '3px solid #A67C52';
              element.style.paddingLeft = '8px';
              element.style.transition = 'all 0.3s ease';
              element.style.borderRadius = '2px';

              translatedCount++;
            }
          });

          // Update UI with progress
          setTranslatedElements(new Map(translatedElements));

          // Small delay between batches to avoid overwhelming the UI
          if (i + batchSize < allTextElements.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }

        } catch (error) {
          console.error('Error translating batch:', error);
        }
      }

      console.log(`✅ Successfully translated ${translatedCount} text elements`);

    } catch (error) {
      console.error('❌ EPUB translation error:', error);
    }

    setIsTranslating(false);
  };

  // Function to restore original content
  const restoreOriginalContent = () => {
    console.log('🔄 Restoring original EPUB content...');
    
    translatedElements.forEach((data, element) => {
      if (element && element.dataset.originalText) {
        element.textContent = element.dataset.originalText;
        element.style.backgroundColor = '';
        element.style.borderLeft = '';
        element.style.paddingLeft = '';
      }
    });
    
    setTranslatedElements(new Map());
    setShowOriginal(false);
  };

  // Function to toggle between original and translated
  const toggleOriginalTranslated = () => {
    const newShowOriginal = !showOriginal;
    setShowOriginal(newShowOriginal);
    
    translatedElements.forEach((data, element) => {
      if (element) {
        element.textContent = newShowOriginal ? data.original : data.translated;
      }
    });
  };

  const handleLanguageSelect = (languageCode) => {
    setSelectedLanguage(languageCode);
    setIsVisible(false);
    translateEpubContent(languageCode);
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
      {/* Main Control Panel */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(166, 124, 82, 0.3)',
        borderRadius: '12px',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
        overflow: 'hidden',
        minWidth: '200px'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #A67C52, #8B6A3F)',
          color: 'white',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={16} />
            <span style={{ fontSize: '14px', fontWeight: '600' }}>Book Translator</span>
          </div>
          {translatedElements.size > 0 && (
            <button
              onClick={toggleOriginalTranslated}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title={showOriginal ? 'Show Translation' : 'Show Original'}
            >
              {showOriginal ? <Eye size={12} /> : <EyeOff size={12} />}
              {showOriginal ? 'Show Translation' : 'Show Original'}
            </button>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '16px' }}>
          {/* Language Selector */}
          <div
            onClick={() => setIsVisible(!isVisible)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              border: '2px solid #e1e5e9',
              borderRadius: '6px',
              cursor: 'pointer',
              backgroundColor: 'white',
              transition: 'border-color 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#A67C52';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = '#e1e5e9';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{selectedLang?.flag}</span>
              <span style={{ fontSize: '14px' }}>
                {selectedLang?.native || selectedLang?.name}
              </span>
            </div>
            <ChevronDown size={16} />
          </div>

          {/* Status */}
          {isTranslating && (
            <div style={{
              marginTop: '12px',
              padding: '8px 12px',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#856404',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <RefreshCw size={12} className="spinning" />
              <span>Translating book content...</span>
            </div>
          )}

          {translatedElements.size > 0 && (
            <div style={{
              marginTop: '12px',
              padding: '8px 12px',
              backgroundColor: '#d4edda',
              border: '1px solid #c3e6cb',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#155724'
            }}>
              ✅ Translated {translatedElements.size} text elements
            </div>
          )}
        </div>
      </div>

      {/* Language Dropdown */}
      {isVisible && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          marginTop: '8px',
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          maxHeight: '300px',
          overflowY: 'auto',
          minWidth: '250px',
          zIndex: 1001
        }}>
          {languages.map((language) => (
            <div
              key={language.code}
              onClick={() => handleLanguageSelect(language.code)}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                borderBottom: '1px solid #f0f0f0',
                backgroundColor: selectedLanguage === language.code ? '#e3f2fd' : 'white',
                fontSize: '13px',
                transition: 'background-color 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
              onMouseEnter={(e) => {
                if (selectedLanguage !== language.code) {
                  e.target.style.backgroundColor = '#f5f5f5';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedLanguage !== language.code) {
                  e.target.style.backgroundColor = 'white';
                }
              }}
            >
              <span style={{ fontSize: '16px' }}>{language.flag}</span>
              <div>
                <div style={{ fontWeight: '500' }}>{language.name}</div>
                {language.native && (
                  <div style={{ fontSize: '11px', color: '#666' }}>{language.native}</div>
                )}
              </div>
              {selectedLanguage === language.code && (
                <span style={{ marginLeft: 'auto', color: '#A67C52', fontWeight: 'bold' }}>✓</span>
              )}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .spinning {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default EpubContentTranslator;
