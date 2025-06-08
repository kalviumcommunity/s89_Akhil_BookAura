// Clean Google Translate - Works Everywhere
import React, { useState, useEffect } from 'react';
import { Languages } from 'lucide-react';

const SimpleGoogleTranslate = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
    { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
    { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'ml', name: 'മലയാളം', flag: '🇮🇳' },
    { code: 'bn', name: 'বাংলা', flag: '🇮🇳' },
    { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' },
    { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
    { code: 'ur', name: 'اردو', flag: '🇵🇰' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'th', name: 'ไทย', flag: '🇹🇭' },
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' }
  ];

  // Smart banner hiding - only hide visual banner, not functional elements
  useEffect(() => {
    const smartHideBanner = () => {
      // Only hide the visual banner elements, not the functional ones
      const bannerSelectors = [
        '.goog-te-banner-frame',
        '.goog-te-banner'
      ];

      bannerSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          el.style.display = 'none !important';
          el.style.visibility = 'hidden !important';
        });
      });

      // Reset body positioning
      document.body.style.top = '0 !important';
      document.body.style.position = 'static !important';
    };

    // Run periodically but less aggressively
    const interval = setInterval(smartHideBanner, 500);

    return () => clearInterval(interval);
  }, []);

  // Load saved language
  useEffect(() => {
    const savedLang = localStorage.getItem('translate-lang') || 'en';
    setCurrentLang(savedLang);
    if (savedLang !== 'en') {
      setTimeout(() => translatePage(savedLang), 1000);
    }
  }, []);

  const translatePage = async (langCode) => {
    console.log('🌐 Starting translation to:', langCode);

    // Try multiple approaches for maximum compatibility

    // Approach 1: Try Google Translate API directly
    try {
      await tryGoogleTranslateAPI(langCode);
      return;
    } catch (error) {
      console.log('🌐 Google Translate API failed, trying alternative...');
    }

    // Approach 2: Use free translation API
    try {
      await tryFreeTranslationAPI(langCode);
      return;
    } catch (error) {
      console.log('🌐 Free API failed, trying direct URL...');
    }

    // Approach 3: Direct Google Translate URL (works everywhere)
    tryDirectTranslation(langCode);
  };

  const tryGoogleTranslateAPI = (langCode) => {
    return new Promise((resolve, reject) => {
      // Clean up existing elements
      document.querySelectorAll('#google-translate-script, #google_translate_element').forEach(el => el.remove());

      // Create translate element
      const translateDiv = document.createElement('div');
      translateDiv.id = 'google_translate_element';
      translateDiv.style.position = 'absolute';
      translateDiv.style.left = '-9999px';
      translateDiv.style.top = '-9999px';
      translateDiv.style.width = '1px';
      translateDiv.style.height = '1px';
      translateDiv.style.overflow = 'hidden';
      document.body.appendChild(translateDiv);

      // Load Google Translate script with timeout
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';

      const timeout = setTimeout(() => {
        reject(new Error('Script load timeout'));
      }, 5000);

      window.googleTranslateElementInit = function() {
        clearTimeout(timeout);
        console.log('🌐 Google Translate API loaded successfully');

        try {
          new window.google.translate.TranslateElement({
            pageLanguage: 'en',
            includedLanguages: languages.map(l => l.code).join(','),
            autoDisplay: false,
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
          }, 'google_translate_element');

          // Trigger translation
          setTimeout(() => {
            const select = document.querySelector('.goog-te-combo');
            if (select && select.options.length > 1) {
              select.value = langCode;
              select.dispatchEvent(new Event('change'));
              hideBannerElements();
              resolve();
            } else {
              reject(new Error('Translation select not found'));
            }
          }, 1000);

        } catch (error) {
          reject(error);
        }
      };

      script.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Failed to load Google Translate script'));
      };

      document.head.appendChild(script);
    });
  };

  const tryFreeTranslationAPI = async (langCode) => {
    console.log('🌐 Using free translation API');

    // Get all text content
    const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, a, button, label');
    const textsToTranslate = [];
    const elementMap = new Map();

    textElements.forEach((element, index) => {
      const text = element.textContent?.trim();
      if (text && text.length > 0 && text.length < 200 && !text.match(/^[\d\s\W]*$/)) {
        textsToTranslate.push(text);
        elementMap.set(index, element);
      }
    });

    if (textsToTranslate.length === 0) return;

    // Translate using LibreTranslate
    const translateText = async (text) => {
      try {
        const response = await fetch('https://libretranslate.de/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: text,
            source: 'en',
            target: langCode,
            format: 'text'
          })
        });

        if (response.ok) {
          const data = await response.json();
          return data.translatedText || text;
        }
        return text;
      } catch {
        return text;
      }
    };

    // Translate all texts
    const translatedTexts = await Promise.all(textsToTranslate.map(translateText));

    // Apply translations
    let index = 0;
    elementMap.forEach((element) => {
      if (translatedTexts[index]) {
        element.textContent = translatedTexts[index];
        index++;
      }
    });

    console.log(`🌐 Translated ${index} elements using free API`);
  };

  const tryDirectTranslation = (langCode) => {
    console.log('🌐 Using direct Google Translate URL');

    // Create a simple redirect to Google Translate
    const currentUrl = window.location.href.split('?')[0].split('#')[0];
    const translateUrl = `https://translate.google.com/translate?sl=en&tl=${langCode}&u=${encodeURIComponent(currentUrl)}`;

    // Show user a choice
    const userChoice = confirm(`Translation service is blocked. Would you like to open Google Translate in a new tab?`);
    if (userChoice) {
      window.open(translateUrl, '_blank');
    }
  };

  // Separate function to hide banner elements without affecting functionality
  const hideBannerElements = () => {
    const bannerSelectors = [
      '.goog-te-banner-frame',
      '.goog-te-banner'
    ];

    bannerSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.style.display = 'none !important';
        el.style.visibility = 'hidden !important';
      });
    });

    // Reset body positioning
    document.body.style.top = '0 !important';
    document.body.style.position = 'static !important';
  };

  const handleTranslate = (langCode) => {
    setCurrentLang(langCode);
    localStorage.setItem('translate-lang', langCode);
    setIsVisible(false);

    if (langCode === 'en') {
      window.location.reload();
    } else {
      translatePage(langCode);
    }
  };

  const currentLanguage = languages.find(lang => lang.code === currentLang) || languages[0];

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          backgroundColor: 'transparent',
          border: '1px solid #ddd',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          color: '#333'
        }}
      >
        <Languages size={16} />
        <span>{currentLanguage.flag}</span>
        <span>{currentLanguage.name}</span>
      </button>

      {isVisible && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 1000,
          minWidth: '200px',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleTranslate(language.code)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '10px 15px',
                border: 'none',
                backgroundColor: currentLang === language.code ? '#f0f0f0' : 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                textAlign: 'left'
              }}
            >
              <span>{language.flag}</span>
              <span>{language.name}</span>
            </button>
          ))}
        </div>
      )}

      <style jsx global>{`
        /* Hide only the visual banner, keep functional elements */
        .goog-te-banner-frame,
        .goog-te-banner {
          display: none !important;
          visibility: hidden !important;
        }

        /* Reset body positioning */
        body {
          top: 0 !important;
          position: static !important;
          margin-top: 0 !important;
        }

        /* Keep translate element hidden but functional */
        #google_translate_element {
          position: absolute !important;
          left: -9999px !important;
          top: -9999px !important;
          width: 1px !important;
          height: 1px !important;
          overflow: hidden !important;
        }
      `}</style>
    </div>
  );
};

export default SimpleGoogleTranslate;
