// Fast EPUB Translator - Translates entire books in seconds
import React, { useState, useEffect } from 'react';
import { Globe, ChevronDown, Zap, Eye, EyeOff, RotateCcw, X } from 'lucide-react';
import fastTranslationService from '../services/fastTranslationService';

const FastEpubTranslator = ({ position = 'top-right' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);
  const [translatedElements, setTranslatedElements] = useState(new Map());
  const [showOriginal, setShowOriginal] = useState(false);
  const [translationStats, setTranslationStats] = useState(null);

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

  // Collect all text elements from EPUB
  const collectAllTexts = () => {
    const allElements = [];
    const allTexts = [];

    // Find all iframes (EPUB content)
    const iframes = document.querySelectorAll('iframe');
    
    iframes.forEach(iframe => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (!iframeDoc) return;

        // Get all text elements
        const textElements = iframeDoc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, td, th, li, blockquote, em, strong, i, b, a');
        
        textElements.forEach(element => {
          if (element.children.length === 0 && element.textContent.trim()) {
            const text = element.textContent.trim();
            if (text.length > 1 && !/^[\d\s\.,;:!?\-'"()]+$/.test(text)) {
              allElements.push(element);
              allTexts.push(text);
            }
          }
        });
      } catch (error) {
        console.error('Error accessing iframe:', error);
      }
    });

    // Also check main document
    const mainElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span:not([class*="translate"]):not([id*="translate"])');
    mainElements.forEach(element => {
      if (element.children.length === 0 && element.textContent.trim()) {
        const text = element.textContent.trim();
        if (text.length > 1 && !/^[\d\s\.,;:!?\-'"()]+$/.test(text)) {
          allElements.push(element);
          allTexts.push(text);
        }
      }
    });

    return { elements: allElements, texts: allTexts };
  };

  // Ultra-fast translation
  const translateEntireBook = async (languageCode) => {
    if (languageCode === 'en') {
      restoreOriginalContent();
      return;
    }

    setIsTranslating(true);
    setTranslationProgress(0);
    const startTime = Date.now();

    try {
      console.log(`🚀 Starting ultra-fast translation to ${languageCode}`);
      
      // Step 1: Collect all texts (0.1 seconds)
      const { elements, texts } = collectAllTexts();
      console.log(`📝 Collected ${texts.length} text elements`);
      
      if (texts.length === 0) {
        setIsTranslating(false);
        return;
      }

      // Step 2: Preprocess texts for faster translation
      const processedTexts = fastTranslationService.preprocessTexts(texts);
      console.log(`⚡ Preprocessed to ${processedTexts.length} unique texts`);

      // Step 3: Ultra-fast translation
      const translations = await fastTranslationService.translateFast(
        processedTexts, 
        languageCode,
        (progress) => setTranslationProgress(progress)
      );

      // Step 4: Apply translations instantly
      const newTranslatedElements = new Map();
      let appliedCount = 0;

      elements.forEach((element, index) => {
        const originalText = texts[index];
        const processedIndex = processedTexts.indexOf(originalText);
        const translatedText = processedIndex >= 0 ? translations[processedIndex] : originalText;

        if (translatedText && translatedText !== originalText) {
          // Store original
          if (!element.dataset.originalText) {
            element.dataset.originalText = originalText;
          }

          // Apply translation
          element.textContent = translatedText;
          
          // Add visual indicator
          element.style.backgroundColor = 'rgba(166, 124, 82, 0.15)';
          element.style.borderLeft = '4px solid #A67C52';
          element.style.paddingLeft = '8px';
          element.style.borderRadius = '3px';
          element.style.transition = 'all 0.2s ease';
          element.style.boxShadow = '0 1px 3px rgba(166, 124, 82, 0.1)';

          newTranslatedElements.set(element, {
            original: originalText,
            translated: translatedText,
            language: languageCode
          });

          appliedCount++;
        }
      });

      setTranslatedElements(newTranslatedElements);
      
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      setTranslationStats({
        totalElements: texts.length,
        translatedElements: appliedCount,
        duration: duration.toFixed(2),
        language: languageCode
      });

      console.log(`✅ Ultra-fast translation completed in ${duration.toFixed(2)} seconds!`);
      console.log(`📊 Translated ${appliedCount}/${texts.length} elements`);

    } catch (error) {
      console.error('❌ Translation error:', error);
    }

    setIsTranslating(false);
    setTranslationProgress(100);
  };

  // Restore original content
  const restoreOriginalContent = () => {
    translatedElements.forEach((data, element) => {
      if (element && element.dataset.originalText) {
        element.textContent = element.dataset.originalText;
        element.style.backgroundColor = '';
        element.style.borderLeft = '';
        element.style.paddingLeft = '';
        element.style.borderRadius = '';
        element.style.boxShadow = '';
      }
    });
    
    setTranslatedElements(new Map());
    setShowOriginal(false);
    setTranslationStats(null);
  };

  // Toggle between original and translated
  const toggleOriginalTranslated = () => {
    const newShowOriginal = !showOriginal;
    setShowOriginal(newShowOriginal);
    
    translatedElements.forEach((data, element) => {
      if (element) {
        element.textContent = newShowOriginal ? data.original : data.translated;
      }
    });
  };

  // Cancel translation
  const cancelTranslation = () => {
    fastTranslationService.cancelTranslation();
    setIsTranslating(false);
    setTranslationProgress(0);
  };

  const handleLanguageSelect = (languageCode) => {
    setSelectedLanguage(languageCode);
    setIsVisible(false);
    translateEntireBook(languageCode);
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
        minWidth: '220px',
        maxWidth: '280px'
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
            <Zap size={16} />
            <span style={{ fontSize: '14px', fontWeight: '600' }}>Fast Translator</span>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {translatedElements.size > 0 && (
              <button
                onClick={toggleOriginalTranslated}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white',
                  padding: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title={showOriginal ? 'Show Translation' : 'Show Original'}
              >
                {showOriginal ? <Eye size={12} /> : <EyeOff size={12} />}
              </button>
            )}
            {isTranslating && (
              <button
                onClick={cancelTranslation}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white',
                  padding: '4px',
                  cursor: 'pointer'
                }}
                title="Cancel Translation"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '16px' }}>
          {/* Language Selector */}
          <div
            onClick={() => !isTranslating && setIsVisible(!isVisible)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              border: '2px solid #e1e5e9',
              borderRadius: '8px',
              cursor: isTranslating ? 'not-allowed' : 'pointer',
              backgroundColor: isTranslating ? '#f8f9fa' : 'white',
              transition: 'all 0.3s ease',
              opacity: isTranslating ? 0.7 : 1
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>{selectedLang?.flag}</span>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>
                {selectedLang?.native || selectedLang?.name}
              </span>
            </div>
            <ChevronDown size={16} />
          </div>

          {/* Progress Bar */}
          {isTranslating && (
            <div style={{ marginTop: '12px' }}>
              <div style={{
                width: '100%',
                height: '6px',
                backgroundColor: '#e9ecef',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${translationProgress}%`,
                  height: '100%',
                  backgroundColor: '#A67C52',
                  transition: 'width 0.3s ease',
                  borderRadius: '3px'
                }} />
              </div>
              <div style={{
                marginTop: '6px',
                fontSize: '12px',
                color: '#666',
                textAlign: 'center'
              }}>
                {translationProgress}% - Translating at lightning speed...
              </div>
            </div>
          )}

          {/* Translation Stats */}
          {translationStats && (
            <div style={{
              marginTop: '12px',
              padding: '10px 12px',
              backgroundColor: '#d4edda',
              border: '1px solid #c3e6cb',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#155724'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                ⚡ Translation Complete!
              </div>
              <div>📊 {translationStats.translatedElements}/{translationStats.totalElements} elements</div>
              <div>⏱️ Completed in {translationStats.duration}s</div>
              <div>🌍 Language: {languages.find(l => l.code === translationStats.language)?.name}</div>
            </div>
          )}
        </div>
      </div>

      {/* Language Dropdown */}
      {isVisible && !isTranslating && (
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
          minWidth: '280px',
          zIndex: 1001
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #eee',
            backgroundColor: '#f8f9fa',
            fontSize: '13px',
            fontWeight: '600',
            color: '#333'
          }}>
            ⚡ Select Language for Ultra-Fast Translation
          </div>
          
          {languages.map((language) => (
            <div
              key={language.code}
              onClick={() => handleLanguageSelect(language.code)}
              style={{
                padding: '12px 16px',
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
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '500' }}>{language.name}</div>
                {language.native && (
                  <div style={{ fontSize: '11px', color: '#666' }}>{language.native}</div>
                )}
              </div>
              {selectedLanguage === language.code && (
                <span style={{ color: '#A67C52', fontWeight: 'bold' }}>✓</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FastEpubTranslator;
