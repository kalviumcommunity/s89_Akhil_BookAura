// Enhanced NavbarGoogleTranslate Component
import React, { useState, useEffect } from 'react';
import { Languages } from 'lucide-react';

const NavbarGoogleTranslate = () => {
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
      setTimeout(() => {
        translateWholePage(savedLang);
      }, 1000);
    }
  }, []);

  
  useEffect(() => {
    const continuousRemoval = () => {
      const bannerSelectors = [
        '.goog-te-banner-frame',
        'iframe.goog-te-banner-frame',
        '.goog-te-banner',
        '[id^="goog-gt-"]'
      ];

      bannerSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (element && element.parentNode) {
            element.remove();
          }
        });
      });

      // Reset body positioning
      document.body.style.top = '0';
      document.body.style.position = 'static';
      document.body.style.marginTop = '0';
    };

    // Run immediately
    continuousRemoval();

    // Set up continuous monitoring
    const interval = setInterval(continuousRemoval, 1000);

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, []);

  const removeBanner = () => {
    const removeElements = () => {
      // More comprehensive banner removal
      const selectors = [
        '.goog-te-banner-frame',
        'iframe.goog-te-banner-frame',
        '.goog-te-banner',
        '.goog-te-banner-content',
        '.goog-te-gadget',
        '.goog-te-combo',
        '.goog-te-spinner-pos',
        '[id^="goog-gt-"]',
        '[class^="goog-te-"]',
        '.skiptranslate'
      ];
      

      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (element && element.parentNode) {
            element.style.display = 'none !important';
            element.style.visibility = 'hidden !important';
            element.style.height = '0 !important';
            element.style.overflow = 'hidden !important';
            element.remove();
          }
        });
      });

      // Reset body styles
      document.body.style.top = '0 !important';
      document.body.style.position = 'static !important';
      document.body.style.marginTop = '0 !important';
      document.body.style.paddingTop = '0 !important';

      // Reset html styles
      document.documentElement.style.top = '0 !important';
      document.documentElement.style.position = 'static !important';
      document.documentElement.style.marginTop = '0 !important';
      document.documentElement.style.paddingTop = '0 !important';
    };

    // Immediate removal
    removeElements();

    // Repeat removal more frequently for first few seconds
    const quickInterval = setInterval(removeElements, 100);
    setTimeout(() => clearInterval(quickInterval), 2000);

    // Continue with slower interval
    const slowInterval = setInterval(removeElements, 500);
    setTimeout(() => clearInterval(slowInterval), 10000);

    // Observer for late-injected banners
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
              if (node.classList && (
                node.classList.contains('goog-te-banner-frame') ||
                node.classList.contains('goog-te-banner') ||
                node.tagName === 'IFRAME' && node.className.includes('goog-te')
              )) {
                node.remove();
              }
            }
          });
        }
      });
      removeElements();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    // Keep observer running longer
    setTimeout(() => observer.disconnect(), 15000);
  };

  const handleTranslate = (langCode) => {
    console.log('🌐 LANGUAGE SELECTED:', langCode);
    setCurrentLang(langCode);
    localStorage.setItem('translate-lang', langCode);
    setIsVisible(false);

    if (langCode === 'en') {
      console.log('🌐 RESTORING ORIGINAL CONTENT');
      // Restore original content
      if (window.originalContent) {
        document.body.innerHTML = window.originalContent;
        window.originalContent = null;
      } else {
        window.location.reload();
      }
    } else {
      console.log('🌐 TRANSLATING TO:', langCode);
      translateWholePage(langCode);
    }
  };

  const translateWholePage = async (langCode) => {
    console.log('🌐 FULL PAGE TRANSLATE to:', langCode);

    // Store original content if not already stored
    if (!window.originalContent) {
      window.originalContent = document.body.innerHTML;
    }

    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'translation-loading';
    loadingDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #007bff;
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      z-index: 10000;
      font-family: Arial, sans-serif;
    `;
    loadingDiv.textContent = '🌐 Translating entire page...';
    document.body.appendChild(loadingDiv);

    try {
      // Get ALL text content from the page
      const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, a, button, label, li, td, th, input[placeholder], textarea[placeholder]');
      const textsToTranslate = [];
      const elementMap = new Map();

      textElements.forEach((element, index) => {
        // Get text content
        const text = element.textContent?.trim();
        if (text && text.length > 0 && !text.match(/^[\d\s\W]*$/)) {
          if (text.length <= 300) { // Keep texts short for faster translation
            textsToTranslate.push(text);
            elementMap.set(index, { element, type: 'text' });
          }
        }

        // Get placeholder text
        const placeholder = element.placeholder?.trim();
        if (placeholder && placeholder.length > 0) {
          textsToTranslate.push(placeholder);
          elementMap.set(`${index}-placeholder`, { element, type: 'placeholder' });
        }
      });

      if (textsToTranslate.length === 0) {
        console.log('🌐 No text to translate');
        loadingDiv.remove();
        return;
      }

      console.log(`🌐 Found ${textsToTranslate.length} text elements to translate`);

      // Use multiple free translation APIs for speed
      const translateText = async (text, targetLang) => {
        try {
          // Try LibreTranslate first (faster)
          const response = await fetch('https://libretranslate.de/translate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              q: text,
              source: 'en',
              target: targetLang,
              format: 'text'
            })
          });

          if (response.ok) {
            const data = await response.json();
            return data.translatedText || text;
          }
        } catch (error) {
          console.log('LibreTranslate failed, trying MyMemory...');
        }

        // Fallback to MyMemory
        try {
          const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.substring(0, 400))}&langpair=en|${targetLang}`);
          const data = await response.json();
          return data.responseData?.translatedText || text;
        } catch (error) {
          console.error('All translation APIs failed:', error);
          return text;
        }
      };

      // Translate ALL texts in parallel for speed
      console.log('🌐 Starting parallel translation...');
      const translationPromises = textsToTranslate.map(text => translateText(text, langCode));
      const translatedTexts = await Promise.all(translationPromises);

      // Apply translations immediately
      let translatedCount = 0;
      elementMap.forEach((elementData) => {
        if (translatedTexts[translatedCount]) {
          if (elementData.type === 'text') {
            elementData.element.textContent = translatedTexts[translatedCount];
          } else if (elementData.type === 'placeholder') {
            elementData.element.placeholder = translatedTexts[translatedCount];
          }
          translatedCount++;
        }
      });

      console.log(`🌐 Successfully translated ${translatedCount} elements`);

      // Remove loading indicator
      loadingDiv.remove();

      // Show success message
      const successDiv = document.createElement('div');
      successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 10000;
        font-family: Arial, sans-serif;
      `;
      successDiv.textContent = `✅ Translated ${translatedCount} elements`;
      document.body.appendChild(successDiv);

      setTimeout(() => {
        successDiv.remove();
      }, 3000);

    } catch (error) {
      console.error('🌐 Translation failed:', error);

      // Remove loading indicator
      loadingDiv.remove();

      // Show error message
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #dc3545;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 10000;
        font-family: Arial, sans-serif;
      `;
      errorDiv.textContent = '❌ Translation failed. Please try again.';
      document.body.appendChild(errorDiv);

      setTimeout(() => {
        errorDiv.remove();
      }, 5000);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <div
        onClick={() => setIsVisible(!isVisible)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '8px 12px',
          backgroundColor: 'transparent',
          color: '#333',
          borderRadius: '20px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: '500',
          border: currentLang !== 'en' ? '2px solid #34a853' : 'none'
        }}
      >
        <Languages size={20} />
        {currentLang !== 'en' && (
          <span style={{ fontSize: '10px', color: '#34a853', fontWeight: 'bold' }}>{currentLang}</span>
        )}
      </div>

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

          {languages.map((lang) => (
            <div
              key={lang.code}
              onClick={() => handleTranslate(lang.code)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                backgroundColor: currentLang === lang.code ? '#e8f5e8' : 'white',
                borderBottom: '1px solid #f0f0f0'
              }}
            >
              <span style={{ fontSize: '14px' }}>{lang.flag}</span>
              <span style={{ fontWeight: currentLang === lang.code ? 'bold' : 'normal' }}>
                {lang.name}
              </span>
              {currentLang === lang.code && (
                <span style={{ marginLeft: 'auto', color: '#34a853' }}>✓</span>
              )}
            </div>
          ))}
        </div>
      )}

      <div id="navbar_google_translate_element" style={{ display: 'none' }}></div>

      <style jsx global>{`
        /* Reset body and html positioning */
        html, body {
          margin-top: 0 !important;
          padding-top: 0 !important;
          top: 0 !important;
          position: static !important;
          transform: none !important;
        }

        /* Hide all Google Translate banner elements */
        .goog-te-banner-frame,
        .goog-te-banner-frame.skiptranslate,
        iframe.goog-te-banner-frame,
        .goog-te-banner,
        .goog-te-banner-content,
        .goog-te-gadget,
        .goog-te-combo,
        .goog-te-spinner-pos,
        .goog-te-banner-frame *,
        .skiptranslate,
        .goog-te-ftab,
        .goog-te-menu-frame {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          width: 0 !important;
          overflow: hidden !important;
          opacity: 0 !important;
          position: absolute !important;
          left: -9999px !important;
          top: -9999px !important;
          z-index: -1 !important;
        }

        /* Hide elements by ID and class patterns */
        [id^="goog-gt-"],
        [class^="goog-te-"],
        [class*="goog-te-"],
        [id*="google_translate"] {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          width: 0 !important;
        }

        /* Specific targeting for banner frames */
        body > .goog-te-banner-frame,
        body > .goog-te-banner-frame *,
        body > iframe.goog-te-banner-frame,
        html > .goog-te-banner-frame,
        html > iframe.goog-te-banner-frame {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          width: 0 !important;
        }

        /* Prevent any iframe with Google Translate */
        iframe[src*="translate.google"],
        iframe[src*="translate.googleapis"] {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          width: 0 !important;
        }

        /* Override any inline styles */
        body[style*="top:"] {
          top: 0 !important;
        }

        /* Additional safety measures */
        .notranslate {
          transform: none !important;
        }
      `}</style>
    </div>
  );
};

export default NavbarGoogleTranslate;
