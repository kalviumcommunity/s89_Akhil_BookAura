// Simple Google Translate Button - Fast and Reliable
import React, { useState, useEffect } from 'react';
import { ChevronDown, Languages, ArrowRight } from 'lucide-react';

const SimpleTranslateButton = ({ position = 'top-right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedCount, setTranslatedCount] = useState(0);
  const [autoTranslateEnabled, setAutoTranslateEnabled] = useState(false);
  const [observers, setObservers] = useState([]);
  const [intervalId, setIntervalId] = useState(null);
  const [globalTranslatedElements, setGlobalTranslatedElements] = useState(new Map());

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

  // Check if element should be excluded from translation
  const shouldExcludeElement = (element) => {
    // Skip if element or its parents contain navigation/UI keywords
    const excludeSelectors = [
      'button', 'nav', 'header', 'footer', 'aside', 'menu',
      '[role="button"]', '[role="navigation"]', '[role="menubar"]',
      '[class*="nav"]', '[class*="menu"]', '[class*="button"]', '[class*="btn"]',
      '[class*="control"]', '[class*="toolbar"]', '[class*="header"]',
      '[class*="footer"]', '[class*="sidebar"]', '[class*="translate"]',
      '[id*="nav"]', '[id*="menu"]', '[id*="button"]', '[id*="btn"]',
      '[id*="control"]', '[id*="toolbar"]', '[id*="translate"]',
      '.react-reader__container', '.react-reader__toolbar',
      '[aria-label*="nav"]', '[aria-label*="menu"]', '[aria-label*="button"]'
    ];

    // Check if element matches any exclude selector
    for (const selector of excludeSelectors) {
      if (element.matches && element.matches(selector)) {
        return true;
      }
      if (element.closest && element.closest(selector)) {
        return true;
      }
    }

    // Skip elements with navigation-related text content
    const navKeywords = [
      'next', 'previous', 'prev', 'back', 'forward', 'chapter', 'contents',
      'menu', 'close', 'open', 'settings', 'options', 'bookmark', 'search',
      '→', '←', '▶', '◀', '»', '«', '⋯', '…'
    ];

    const textContent = element.textContent.toLowerCase().trim();
    if (navKeywords.some(keyword => textContent === keyword || textContent.includes(keyword))) {
      return true;
    }

    // Skip very short text that might be UI elements
    if (textContent.length < 3 && /^[^\w]*$/.test(textContent)) {
      return true;
    }

    return false;
  };

  // Comprehensive text element finder
  const findAllTextElements = (doc = document) => {
    const allElements = [];

    // More comprehensive selectors to catch ALL text
    const selectors = [
      'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div', 'li', 'td', 'th',
      'a', 'em', 'strong', 'i', 'b', 'u', 'small', 'big', 'sub', 'sup',
      'blockquote', 'cite', 'code', 'pre', 'label', 'legend', 'caption',
      'dt', 'dd', 'figcaption', 'summary', 'details', 'mark', 'time'
    ];

    selectors.forEach(selector => {
      const elements = doc.querySelectorAll(selector);
      elements.forEach(el => {
        // Skip excluded elements
        if (shouldExcludeElement(el)) {
          return;
        }

        // Check if element has direct text content (not just child elements)
        const hasDirectText = Array.from(el.childNodes).some(node =>
          node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0
        );

        // Include elements with no children OR elements with direct text
        if ((el.children.length === 0 || hasDirectText) && el.textContent.trim().length > 1) {
          // Skip if already in list
          if (!allElements.includes(el)) {
            allElements.push(el);
          }
        }
      });
    });

    return allElements;
  };

  // Translate all text in the page/book
  const translatePage = async (languageCode, isAutoTranslate = false) => {
    if (languageCode === 'en') {
      restoreOriginal();
      setAutoTranslateEnabled(false);
      stopObserving();
      return;
    }

    // Don't show loading state for auto-translate
    if (!isAutoTranslate) {
      setIsTranslating(true);
      setTranslatedCount(0);
      setAutoTranslateEnabled(true);
    }

    console.log(`🚀 ${isAutoTranslate ? 'Auto-' : ''}Translating to ${languageCode}...`);

    try {
      const allElements = [];

      // Check iframes (EPUB content) with better error handling
      const iframes = document.querySelectorAll('iframe');
      console.log(`🔍 Found ${iframes.length} iframes`);

      iframes.forEach((iframe, index) => {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            console.log(`📖 Accessing iframe ${index + 1} content`);
            const iframeElements = findAllTextElements(iframeDoc);
            allElements.push(...iframeElements);
            console.log(`📝 Found ${iframeElements.length} elements in iframe ${index + 1}`);
          }
        } catch (e) {
          console.log(`❌ Cannot access iframe ${index + 1} content:`, e.message);
        }
      });

      // Check main document (already filtered by findAllTextElements)
      const mainElements = findAllTextElements(document);
      allElements.push(...mainElements);

      console.log(`📝 Total found ${allElements.length} text elements`);

      // Remove duplicates
      const uniqueElements = [...new Set(allElements)];
      console.log(`📝 After deduplication: ${uniqueElements.length} elements`);

      // Translate in batches for speed
      const batchSize = 15; // Increased batch size
      let translated = 0;

      for (let i = 0; i < uniqueElements.length; i += batchSize) {
        const batch = uniqueElements.slice(i, i + batchSize);

        // Process batch in parallel
        const promises = batch.map(async (element) => {
          const originalText = element.textContent.trim();

          // Skip short, meaningless, or already translated text
          if (originalText.length < 2 ||
              /^[\d\s\.,;:!?\-'"()]+$/.test(originalText) ||
              element.dataset.originalText) {
            return;
          }

          try {
            const translatedText = await translateText(originalText, languageCode);

            if (translatedText && translatedText !== originalText) {
              // Store original
              element.dataset.originalText = originalText;
              element.dataset.translatedLang = languageCode;
              element.dataset.translatedText = translatedText;

              // Apply translation
              element.textContent = translatedText;

              // Add visual indicator
              element.style.backgroundColor = 'rgba(166, 124, 82, 0.1)';
              element.style.borderLeft = '3px solid #A67C52';
              element.style.paddingLeft = '6px';
              element.style.borderRadius = '2px';
              element.style.transition = 'all 0.3s ease';
              element.style.boxShadow = '0 1px 3px rgba(166, 124, 82, 0.1)';

              // Store in global map for persistence
              const elementKey = `${originalText}_${languageCode}`;
              globalTranslatedElements.set(elementKey, {
                original: originalText,
                translated: translatedText,
                language: languageCode
              });

              translated++;
              setTranslatedCount(prev => prev + 1);
            }
          } catch (error) {
            console.error('Error translating element:', error);
          }
        });

        await Promise.all(promises);

        // Smaller delay between batches for faster processing
        if (i + batchSize < uniqueElements.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      console.log(`✅ ${isAutoTranslate ? 'Auto-' : ''}Translated ${translated} elements`);

      // Start observing for new content (only on initial translation)
      if (!isAutoTranslate) {
        startObserving(languageCode);
      }

    } catch (error) {
      console.error('Translation error:', error);
    }

    // Only update loading state for manual translation
    if (!isAutoTranslate) {
      setIsTranslating(false);
    }
  };

  // Auto-translate new content when pages change
  const startObserving = (languageCode) => {
    stopObserving(); // Clear existing observers

    const newObservers = [];

    // Function to handle page changes and translate new content
    const handlePageChange = () => {
      if (!autoTranslateEnabled) return;

      console.log('🔄 Page change detected, auto-translating new content...');

      // Multiple attempts to catch all content
      const translateAttempts = [300, 800, 1500]; // Multiple delays

      translateAttempts.forEach((delay, index) => {
        setTimeout(() => {
          console.log(`🔄 Translation attempt ${index + 1} after ${delay}ms`);
          translateAllVisibleContent(languageCode);
        }, delay);
      });
    };

    // Comprehensive translation of all visible content
    const translateAllVisibleContent = async (languageCode) => {
      try {
        const allElements = [];

        // Get all iframes and their content
        const iframes = document.querySelectorAll('iframe');
        console.log(`🔍 Checking ${iframes.length} iframes for content`);

        iframes.forEach((iframe, index) => {
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (iframeDoc) {
              const iframeElements = findAllTextElements(iframeDoc);
              console.log(`📖 Iframe ${index + 1}: Found ${iframeElements.length} text elements`);
              allElements.push(...iframeElements);
            }
          } catch (e) {
            console.log(`❌ Cannot access iframe ${index + 1}:`, e.message);
          }
        });

        // Get main document elements
        const mainElements = findAllTextElements(document);
        allElements.push(...mainElements);

        // Filter for untranslated elements
        const untranslated = allElements.filter(element => {
          const text = element.textContent.trim();
          const elementKey = `${text}_${languageCode}`;

          // Skip if already translated or should be excluded
          if (element.dataset.originalText ||
              shouldExcludeElement(element) ||
              text.length < 3) {
            return false;
          }

          // Check if we have a cached translation
          if (globalTranslatedElements.has(elementKey)) {
            const cached = globalTranslatedElements.get(elementKey);
            // Apply cached translation
            element.dataset.originalText = cached.original;
            element.dataset.translatedLang = cached.language;
            element.dataset.translatedText = cached.translated;
            element.textContent = cached.translated;

            // Apply visual styling
            element.style.backgroundColor = 'rgba(166, 124, 82, 0.1)';
            element.style.borderLeft = '3px solid #A67C52';
            element.style.paddingLeft = '6px';
            element.style.borderRadius = '2px';
            element.style.boxShadow = '0 1px 3px rgba(166, 124, 82, 0.1)';

            return false; // Don't need to translate again
          }

          return true; // Needs translation
        });

        if (untranslated.length > 0) {
          console.log(`🆕 Found ${untranslated.length} new elements to translate`);
          await translateNewElements(untranslated, languageCode);
        } else {
          console.log('✅ All visible content is already translated');
        }

      } catch (error) {
        console.error('Error in comprehensive translation:', error);
      }
    };

    // Observe main document changes
    const mainObserver = new MutationObserver((mutations) => {
      if (!autoTranslateEnabled) return;

      let hasSignificantChange = false;

      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          // Check for significant content changes
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Look for content containers or multiple new elements
              const newElements = findAllTextElements(node);
              if (newElements.length > 5) { // Significant content change
                hasSignificantChange = true;
              }
            }
          });
        }
      });

      if (hasSignificantChange) {
        console.log('🔄 Significant content change detected in main document');
        handlePageChange();
      }
    });

    mainObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
    newObservers.push(mainObserver);

    // Observe iframe content changes with better detection
    const setupIframeObserver = (iframe, index) => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc && iframeDoc.body) {

          // Observer for content changes
          const iframeObserver = new MutationObserver((mutations) => {
            if (!autoTranslateEnabled) return;

            let hasSignificantChange = false;

            mutations.forEach(mutation => {
              if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                  if (node.nodeType === Node.ELEMENT_NODE) {
                    const newElements = findAllTextElements(node);
                    if (newElements.length > 3) { // Page change threshold
                      hasSignificantChange = true;
                    }
                  }
                });
              }
            });

            if (hasSignificantChange) {
              console.log(`🔄 Page change detected in iframe ${index + 1}`);
              handlePageChange();
            }
          });

          iframeObserver.observe(iframeDoc.body, {
            childList: true,
            subtree: true
          });
          newObservers.push(iframeObserver);

          // Also observe for attribute changes that might indicate page changes
          const attrObserver = new MutationObserver((mutations) => {
            if (!autoTranslateEnabled) return;

            mutations.forEach(mutation => {
              if (mutation.type === 'attributes' &&
                  (mutation.attributeName === 'src' ||
                   mutation.attributeName === 'data-page' ||
                   mutation.attributeName === 'class')) {
                console.log(`🔄 Attribute change detected in iframe ${index + 1}`);
                handlePageChange();
              }
            });
          });

          attrObserver.observe(iframeDoc.documentElement, {
            attributes: true,
            subtree: true
          });
          newObservers.push(attrObserver);

          console.log(`👁️ Started observing iframe ${index + 1} for changes`);
        }
      } catch (e) {
        console.log(`❌ Cannot observe iframe ${index + 1}:`, e.message);
      }
    };

    // Setup observers for existing iframes
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(setupIframeObserver);

    // Also observe for new iframes being added
    const iframeWatcher = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'IFRAME') {
              console.log('🆕 New iframe detected, setting up observer');
              setupIframeObserver(node, iframes.length);
            }
            // Also check for iframes within added nodes
            const newIframes = node.querySelectorAll && node.querySelectorAll('iframe');
            if (newIframes) {
              newIframes.forEach((iframe, index) => {
                setupIframeObserver(iframe, iframes.length + index);
              });
            }
          }
        });
      });
    });

    iframeWatcher.observe(document.body, {
      childList: true,
      subtree: true
    });
    newObservers.push(iframeWatcher);

    setObservers(newObservers);

    // Also start periodic checking as backup
    const id = setInterval(() => {
      if (autoTranslateEnabled) {
        checkForUntranslatedContent(languageCode);
      }
    }, 2000); // Check every 2 seconds

    setIntervalId(id);
    console.log(`👁️ Started ${newObservers.length} observers + periodic check for auto-translation`);
  };

  // Periodic check for untranslated content
  const checkForUntranslatedContent = (languageCode) => {
    try {
      const allElements = [];

      // Check iframes
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            const elements = findAllTextElements(iframeDoc);
            allElements.push(...elements);
          }
        } catch (e) {
          // Ignore iframe access errors
        }
      });

      // Check main document
      const mainElements = findAllTextElements(document);
      allElements.push(...mainElements);

      // Find untranslated elements
      const untranslated = allElements.filter(el =>
        !el.dataset.originalText &&
        el.textContent.trim().length > 2 &&
        !shouldExcludeElement(el)
      );

      if (untranslated.length > 0) {
        console.log(`🔍 Found ${untranslated.length} untranslated elements, auto-translating...`);
        translateNewElements(untranslated, languageCode);
      }
    } catch (error) {
      console.error('Error in periodic check:', error);
    }
  };

  // Stop observing changes
  const stopObserving = () => {
    observers.forEach(observer => observer.disconnect());
    setObservers([]);

    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }

    console.log('🛑 Stopped all observers and periodic check');
  };

  // Translate new elements that appear
  const translateNewElements = async (elements, languageCode) => {
    let newTranslated = 0;

    for (const element of elements) {
      const originalText = element.textContent.trim();

      // Skip if already translated, not worth translating, or UI element
      if (originalText.length < 3 ||
          /^[\d\s\.,;:!?\-'"()→←▶◀»«⋯…]+$/.test(originalText) ||
          element.dataset.originalText ||
          shouldExcludeElement(element)) {
        continue;
      }

      try {
        // Check cache first
        const elementKey = `${originalText}_${languageCode}`;
        let translatedText;

        if (globalTranslatedElements.has(elementKey)) {
          // Use cached translation
          const cached = globalTranslatedElements.get(elementKey);
          translatedText = cached.translated;
          console.log(`💾 Using cached translation for: "${originalText}"`);
        } else {
          // Get new translation
          translatedText = await translateText(originalText, languageCode);

          // Cache the translation
          if (translatedText && translatedText !== originalText) {
            globalTranslatedElements.set(elementKey, {
              original: originalText,
              translated: translatedText,
              language: languageCode
            });
          }
        }

        if (translatedText && translatedText !== originalText) {
          // Store data
          element.dataset.originalText = originalText;
          element.dataset.translatedLang = languageCode;
          element.dataset.translatedText = translatedText;

          // Apply translation
          element.textContent = translatedText;

          // Add visual indicator
          element.style.backgroundColor = 'rgba(166, 124, 82, 0.1)';
          element.style.borderLeft = '3px solid #A67C52';
          element.style.paddingLeft = '6px';
          element.style.borderRadius = '2px';
          element.style.transition = 'all 0.3s ease';
          element.style.boxShadow = '0 1px 3px rgba(166, 124, 82, 0.1)';

          newTranslated++;
        }
      } catch (error) {
        console.error('Error auto-translating element:', error);
      }
    }

    if (newTranslated > 0) {
      setTranslatedCount(prev => prev + newTranslated);
      console.log(`✅ Auto-translated ${newTranslated} new elements`);
    }
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
        delete el.dataset.translatedLang;
      }
    });
    setTranslatedCount(0);
  };

  // Cleanup observers when component unmounts
  useEffect(() => {
    return () => {
      stopObserving();
    };
  }, []);

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
        return { ...baseStyles, top: '80px', left: '20px' }; // Moved down to avoid close button
      case 'top-right':
        return { ...baseStyles, top: '80px', right: '20px' }; // Moved down to avoid close button
      case 'bottom-left':
        return { ...baseStyles, bottom: '20px', left: '20px' };
      case 'bottom-right':
        return { ...baseStyles, bottom: '20px', right: '20px' };
      case 'middle-right':
        return { ...baseStyles, top: '50%', right: '20px', transform: 'translateY(-50%)' };
      default:
        return { ...baseStyles, top: '80px', right: '20px' }; // Default moved down
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
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {translatedCount}
              {autoTranslateEnabled && (
                <span style={{
                  width: '6px',
                  height: '6px',
                  backgroundColor: '#4CAF50',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite'
                }} title="Auto-translate active" />
              )}
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

        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default SimpleTranslateButton;
