// JET SPEED GOOGLE TRANSLATE - Lightning Fast Translation at Jet Speed!
import React, { useState, useEffect } from 'react';
import { ChevronDown, Languages, ArrowRight, Zap, RotateCcw } from 'lucide-react';

const JetSpeedTranslate = ({ position = 'middle-right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedCount, setTranslatedCount] = useState(0);
  const [jetModeActive, setJetModeActive] = useState(false);
  const [translationCache, setTranslationCache] = useState(new Map());
  const [observers, setObservers] = useState([]);

  // ALL WORLD LANGUAGES - Comprehensive list
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    // Indian Languages
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
    { code: 'or', name: 'Odia', flag: '🇮🇳', native: 'ଓଡ଼ିଆ' },
    { code: 'as', name: 'Assamese', flag: '🇮🇳', native: 'অসমীয়া' },
    // European Languages
    { code: 'es', name: 'Spanish', flag: '🇪🇸', native: 'Español' },
    { code: 'fr', name: 'French', flag: '🇫🇷', native: 'Français' },
    { code: 'de', name: 'German', flag: '🇩🇪', native: 'Deutsch' },
    { code: 'it', name: 'Italian', flag: '🇮🇹', native: 'Italiano' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹', native: 'Português' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺', native: 'Русский' },
    { code: 'nl', name: 'Dutch', flag: '🇳🇱', native: 'Nederlands' },
    { code: 'sv', name: 'Swedish', flag: '🇸🇪', native: 'Svenska' },
    { code: 'da', name: 'Danish', flag: '🇩🇰', native: 'Dansk' },
    { code: 'no', name: 'Norwegian', flag: '🇳🇴', native: 'Norsk' },
    { code: 'fi', name: 'Finnish', flag: '🇫🇮', native: 'Suomi' },
    { code: 'pl', name: 'Polish', flag: '🇵🇱', native: 'Polski' },
    { code: 'cs', name: 'Czech', flag: '🇨🇿', native: 'Čeština' },
    { code: 'tr', name: 'Turkish', flag: '🇹🇷', native: 'Türkçe' },
    { code: 'el', name: 'Greek', flag: '🇬🇷', native: 'Ελληνικά' },
    // Asian Languages
    { code: 'zh', name: 'Chinese', flag: '🇨🇳', native: '中文' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵', native: '日本語' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷', native: '한국어' },
    { code: 'th', name: 'Thai', flag: '🇹🇭', native: 'ไทย' },
    { code: 'vi', name: 'Vietnamese', flag: '🇻🇳', native: 'Tiếng Việt' },
    { code: 'id', name: 'Indonesian', flag: '🇮🇩', native: 'Bahasa Indonesia' },
    { code: 'ms', name: 'Malay', flag: '🇲🇾', native: 'Bahasa Melayu' },
    { code: 'tl', name: 'Filipino', flag: '🇵🇭', native: 'Filipino' },
    // Middle Eastern & African
    { code: 'ar', name: 'Arabic', flag: '🇸🇦', native: 'العربية' },
    { code: 'fa', name: 'Persian', flag: '🇮🇷', native: 'فارسی' },
    { code: 'he', name: 'Hebrew', flag: '🇮🇱', native: 'עברית' },
    { code: 'sw', name: 'Swahili', flag: '🇰🇪', native: 'Kiswahili' }
  ];

  // JET SPEED Google Translate - Direct API calls for maximum speed
  const jetTranslate = async (texts, targetLang) => {
    const results = [];
    const batchSize = 50; // Reduced batch size for stability

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);

      // Ultra-parallel processing for jet speed
      const promises = batch.map(async (text) => {
        const cacheKey = `${text}_${targetLang}`;

        // Instant cache lookup
        if (translationCache.has(cacheKey)) {
          return translationCache.get(cacheKey);
        }

        try {
          // Direct Google Translate API call
          const response = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`,
            {
              method: 'GET',
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          const translation = data?.[0]?.[0]?.[0] || text;

          // Cache for instant future use
          setTranslationCache(prev => {
            const newCache = new Map(prev);
            newCache.set(cacheKey, translation);
            return newCache;
          });

          return translation;
        } catch (error) {
          console.error('Jet translation error:', error);
          return text;
        }
      });

      const batchResults = await Promise.all(promises);
      results.push(...batchResults);

      // Small delay between batches to prevent rate limiting
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  };

  // Lightning-fast text collection with safety checks
  const collectAllTexts = () => {
    const allTexts = [];
    const allElements = [];

    try {
      // Get all sources instantly
      const sources = [document];

      // Safely get iframe documents
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            sources.push(iframeDoc);
          }
        } catch (e) {
          // Ignore iframe access errors
        }
      });

      sources.forEach(doc => {
        if (!doc) return;

        try {
          // Ultra-fast text extraction
          const textElements = doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, li, td, th, a, em, strong, i, b, blockquote, cite, section, article');

          textElements.forEach(el => {
            try {
              const text = el.textContent?.trim();
              if (text &&
                  text.length > 2 &&
                  !text.match(/^[\d\s\.,;:!?\-'"()→←▶◀»«⋯…]+$/) &&
                  !el.closest('button, nav, [class*="nav"], [class*="menu"], [class*="btn"], [class*="control"], [class*="translate"]')) {

                allTexts.push(text);
                allElements.push(el);
              }
            } catch (e) {
              // Skip problematic elements
            }
          });
        } catch (e) {
          console.warn('Error processing document:', e);
        }
      });
    } catch (error) {
      console.error('Error in collectAllTexts:', error);
    }

    return { texts: allTexts, elements: allElements };
  };

  // JET SPEED PAGE TRANSLATION - Translates entire page in seconds!
  const jetTranslatePage = async (languageCode) => {
    if (languageCode === 'en') {
      restoreOriginal();
      setJetModeActive(false);
      stopJetMode();
      return;
    }

    console.log(`🚀 JET SPEED TRANSLATION to ${languageCode} - LAUNCHING!`);
    setIsTranslating(true);
    setJetModeActive(true);
    const startTime = Date.now();

    try {
      // STEP 1: Lightning collection (0.05s)
      const { texts, elements } = collectAllTexts();
      console.log(`⚡ Collected ${texts.length} texts in ${Date.now() - startTime}ms`);

      if (texts.length === 0) {
        console.log('No texts found to translate');
        setIsTranslating(false);
        return;
      }

      // STEP 2: Remove duplicates for efficiency
      const uniqueTexts = [...new Set(texts)];
      console.log(`⚡ Deduplicated to ${uniqueTexts.length} unique texts`);

      // STEP 3: JET SPEED TRANSLATION (1-2s)
      const translations = await jetTranslate(uniqueTexts, languageCode);
      console.log(`⚡ Translated in ${Date.now() - startTime}ms`);

      // STEP 4: Instant application (0.05s)
      let applied = 0;
      elements.forEach((element, index) => {
        try {
          if (!element || !texts[index]) return; // Safety check

          const originalText = texts[index];
          const uniqueIndex = uniqueTexts.indexOf(originalText);
          const translatedText = translations[uniqueIndex];

          if (translatedText && translatedText !== originalText && element.textContent) {
            if (!element.dataset.originalText) {
              element.dataset.originalText = originalText;
            }

            element.textContent = translatedText;

            // Jet-speed gold highlight
            element.style.backgroundColor = 'rgba(255, 215, 0, 0.2)';
            element.style.borderLeft = '4px solid #FFD700';
            element.style.paddingLeft = '8px';
            element.style.borderRadius = '3px';
            element.style.boxShadow = '0 2px 5px rgba(255, 215, 0, 0.4)';
            element.style.transition = 'all 0.1s ease';

            applied++;
          }
        } catch (elementError) {
          console.warn('Error applying translation to element:', elementError);
        }
      });

      const duration = (Date.now() - startTime) / 1000;
      setTranslatedCount(applied);
      console.log(`🚀 JET SPEED COMPLETE! ${applied} elements in ${duration.toFixed(2)}s`);

      // Start jet-speed auto-translation
      startJetMode(languageCode);

    } catch (error) {
      console.error('❌ Jet translation error:', error);
      setIsTranslating(false);
    }

    setIsTranslating(false);
  };

  // JET SPEED AUTO-TRANSLATION for page changes
  const startJetMode = (languageCode) => {
    stopJetMode();
    
    const newObservers = [];
    
    const jetAutoTranslate = () => {
      if (!jetModeActive) return;
      
      console.log('🚀 JET AUTO-TRANSLATE: New page detected!');
      
      // Multiple ultra-fast attempts
      [50, 200, 500].forEach((delay) => {
        setTimeout(() => {
          jetTranslateNewContent(languageCode);
        }, delay);
      });
    };
    
    // Main document observer
    const mainObserver = new MutationObserver((mutations) => {
      if (!jetModeActive) return;
      
      let hasNewContent = false;
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const textContent = node.textContent?.trim() || '';
              if (textContent.length > 10) {
                hasNewContent = true;
              }
            }
          });
        }
      });
      
      if (hasNewContent) {
        jetAutoTranslate();
      }
    });
    
    mainObserver.observe(document.body, { childList: true, subtree: true });
    newObservers.push(mainObserver);
    
    // Iframe observers
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach((iframe, index) => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc && iframeDoc.body) {
          const iframeObserver = new MutationObserver(() => {
            if (jetModeActive) {
              console.log(`🚀 JET: New content in iframe ${index + 1}`);
              jetAutoTranslate();
            }
          });
          
          iframeObserver.observe(iframeDoc.body, { childList: true, subtree: true });
          newObservers.push(iframeObserver);
        }
      } catch (e) {
        // Ignore iframe access errors
      }
    });
    
    setObservers(newObservers);
    console.log(`🚀 JET MODE ACTIVE: ${newObservers.length} observers monitoring`);
  };

  // JET SPEED new content translation
  const jetTranslateNewContent = async (languageCode) => {
    try {
      const { texts, elements } = collectAllTexts();

      const untranslated = [];
      const untranslatedTexts = [];

      elements.forEach((element, index) => {
        if (!element || !texts[index]) return; // Safety check

        const text = texts[index];
        const cacheKey = `${text}_${languageCode}`;

        if (!element.dataset.originalText) {
          if (translationCache.has(cacheKey)) {
            // Apply cached translation instantly
            const cached = translationCache.get(cacheKey);
            element.dataset.originalText = text;
            element.textContent = cached;

            // Jet-speed visual
            element.style.backgroundColor = 'rgba(255, 215, 0, 0.2)';
            element.style.borderLeft = '4px solid #FFD700';
            element.style.paddingLeft = '8px';
            element.style.borderRadius = '3px';
            element.style.boxShadow = '0 2px 5px rgba(255, 215, 0, 0.4)';
          } else {
            untranslated.push(element);
            untranslatedTexts.push(text);
          }
        }
      });

      if (untranslated.length > 0) {
        console.log(`🚀 JET TRANSLATING ${untranslated.length} new elements`);

        const uniqueTexts = [...new Set(untranslatedTexts)];
        const translations = await jetTranslate(uniqueTexts, languageCode);

        untranslated.forEach((element, index) => {
          if (!element || !untranslatedTexts[index]) return; // Safety check

          const originalText = untranslatedTexts[index];
          const uniqueIndex = uniqueTexts.indexOf(originalText);
          const translatedText = translations[uniqueIndex];

          if (translatedText && translatedText !== originalText) {
            element.dataset.originalText = originalText;
            element.textContent = translatedText;

            // Jet-speed visual
            element.style.backgroundColor = 'rgba(255, 215, 0, 0.2)';
            element.style.borderLeft = '4px solid #FFD700';
            element.style.paddingLeft = '8px';
            element.style.borderRadius = '3px';
            element.style.boxShadow = '0 2px 5px rgba(255, 215, 0, 0.4)';

            setTranslatedCount(prev => prev + 1);
          }
        });

        console.log(`🚀 JET: Translated ${untranslated.length} new elements!`);
      }

    } catch (error) {
      console.error('Jet new content error:', error);
    }
  };

  // Stop jet mode
  const stopJetMode = () => {
    observers.forEach(observer => observer.disconnect());
    setObservers([]);
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
        delete el.dataset.originalText;
      }
    });
    setTranslatedCount(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        stopJetMode();
      } catch (error) {
        console.warn('Error during cleanup:', error);
      }
    };
  }, []);

  const handleLanguageSelect = (langCode) => {
    try {
      setSelectedLang(langCode);
      setIsOpen(false);
      jetTranslatePage(langCode);
    } catch (error) {
      console.error('Error selecting language:', error);
      setIsTranslating(false);
    }
  };

  const getPositionStyles = () => {
    const baseStyles = { position: 'fixed', zIndex: 1000 };
    
    switch (position) {
      case 'top-left': return { ...baseStyles, top: '80px', left: '20px' };
      case 'top-right': return { ...baseStyles, top: '80px', right: '20px' };
      case 'bottom-left': return { ...baseStyles, bottom: '20px', left: '20px' };
      case 'bottom-right': return { ...baseStyles, bottom: '20px', right: '20px' };
      case 'middle-right': return { ...baseStyles, top: '50%', right: '20px', transform: 'translateY(-50%)' };
      default: return { ...baseStyles, top: '50%', right: '20px', transform: 'translateY(-50%)' };
    }
  };

  const currentLang = languages.find(lang => lang.code === selectedLang);

  return (
    <div style={getPositionStyles()}>
      {/* JET SPEED TRANSLATE BUTTON */}
      <div
        onClick={() => !isTranslating && setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '14px 18px',
          background: isTranslating 
            ? 'linear-gradient(135deg, #6c757d, #5a6268)' 
            : 'linear-gradient(135deg, #FFD700, #FFA500)',
          color: isTranslating ? 'white' : '#333',
          border: 'none',
          borderRadius: '30px',
          cursor: isTranslating ? 'not-allowed' : 'pointer',
          boxShadow: '0 6px 20px rgba(255, 215, 0, 0.4)',
          transition: 'all 0.3s ease',
          fontSize: '15px',
          fontWeight: '600',
          minWidth: '180px',
          justifyContent: 'space-between'
        }}
        onMouseEnter={(e) => {
          if (!isTranslating) {
            e.target.style.transform = 'translateY(-3px) scale(1.02)';
            e.target.style.boxShadow = '0 8px 25px rgba(255, 215, 0, 0.6)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isTranslating) {
            e.target.style.transform = 'translateY(0) scale(1)';
            e.target.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.4)';
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={20} />
          <span>{isTranslating ? 'Jet Translating...' : 'Jet Translate'}</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {translatedCount > 0 && (
            <span style={{ 
              fontSize: '12px', 
              backgroundColor: 'rgba(0,0,0,0.2)', 
              padding: '3px 8px', 
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {translatedCount}
              {jetModeActive && (
                <span style={{ 
                  width: '8px', 
                  height: '8px', 
                  backgroundColor: '#00FF00', 
                  borderRadius: '50%',
                  animation: 'pulse 1s infinite'
                }} />
              )}
            </span>
          )}
          <ArrowRight size={18} />
        </div>
      </div>

      {/* LANGUAGE DROPDOWN */}
      {isOpen && !isTranslating && (
        <div style={{
          position: 'absolute',
          top: '70px',
          right: '0',
          background: 'white',
          border: '2px solid #FFD700',
          borderRadius: '15px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
          minWidth: '320px',
          maxHeight: '450px',
          overflowY: 'auto',
          zIndex: 1001
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
            color: '#333',
            borderRadius: '13px 13px 0 0',
            fontSize: '16px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Zap size={20} />
            <span>JET SPEED TRANSLATE</span>
          </div>

          {/* Current Selection */}
          <div style={{
            padding: '12px 20px',
            backgroundColor: '#fff9e6',
            borderBottom: '1px solid #ffe066',
            fontSize: '13px',
            color: '#b8860b',
            fontWeight: '500'
          }}>
            Current: {currentLang?.flag} {currentLang?.native || currentLang?.name}
          </div>

          {/* Language List */}
          {languages.map((language) => (
            <div
              key={language.code}
              onClick={() => handleLanguageSelect(language.code)}
              style={{
                padding: '14px 20px',
                cursor: 'pointer',
                borderBottom: '1px solid #f5f5f5',
                backgroundColor: selectedLang === language.code ? '#fff9e6' : 'white',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              onMouseEnter={(e) => {
                if (selectedLang !== language.code) {
                  e.target.style.backgroundColor = '#fffbf0';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedLang !== language.code) {
                  e.target.style.backgroundColor = 'white';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>{language.flag}</span>
                <div>
                  <div style={{ fontWeight: '600', color: '#333' }}>
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
                  <span style={{ color: '#FFD700', fontWeight: 'bold', fontSize: '16px' }}>✓</span>
                )}
                <Zap size={16} style={{ color: '#FFD700' }} />
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
              background: 'rgba(0, 0, 0, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#333',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* PROGRESS INDICATOR */}
      {isTranslating && (
        <div style={{
          position: 'absolute',
          top: '70px',
          right: '0',
          background: 'white',
          border: '2px solid #FFD700',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
          minWidth: '250px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px'
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              border: '3px solid #FFD700',
              borderTop: '3px solid transparent',
              borderRadius: '50%',
              animation: 'spin 0.5s linear infinite'
            }} />
            <span style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
              JET TRANSLATING...
            </span>
          </div>
          <div style={{ fontSize: '13px', color: '#666' }}>
            ⚡ Lightning speed translation in progress
          </div>
          <div style={{ fontSize: '12px', color: '#FFD700', marginTop: '8px' }}>
            Translated {translatedCount} elements
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default JetSpeedTranslate;
