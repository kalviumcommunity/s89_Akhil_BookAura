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

  // Position banner under navbar instead of hiding it
  useEffect(() => {
    const positionBanner = () => {
      // Position banner under navbar instead of removing it
      const bannerSelectors = [
        '.goog-te-banner-frame',
        '.goog-te-banner'
      ];

      bannerSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          // Position under navbar (assuming navbar height is around 70px)
          el.style.position = 'fixed !important';
          el.style.top = '70px !important';
          el.style.left = '0 !important';
          el.style.right = '0 !important';
          el.style.zIndex = '999 !important';
          el.style.height = '40px !important';
          el.style.backgroundColor = '#f8f9fa !important';
          el.style.borderBottom = '1px solid #ddd !important';
        });
      });

      // Adjust body positioning to account for banner
      if (document.querySelector('.goog-te-banner-frame')) {
        document.body.style.paddingTop = '110px !important'; // navbar + banner
      } else {
        document.body.style.paddingTop = '70px !important'; // just navbar
      }
    };

    // Run periodically to catch when banner appears
    const interval = setInterval(positionBanner, 500);

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

      // Create translate element - make it visible but positioned under navbar
      const translateDiv = document.createElement('div');
      translateDiv.id = 'google_translate_element';
      translateDiv.style.position = 'fixed';
      translateDiv.style.top = '70px';
      translateDiv.style.right = '20px';
      translateDiv.style.zIndex = '1000';
      translateDiv.style.backgroundColor = 'white';
      translateDiv.style.padding = '10px';
      translateDiv.style.border = '1px solid #ddd';
      translateDiv.style.borderRadius = '5px';
      translateDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
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
              positionBannerElements();
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

  // Position banner elements under navbar instead of hiding
  const positionBannerElements = () => {
    const bannerSelectors = [
      '.goog-te-banner-frame',
      '.goog-te-banner'
    ];

    bannerSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        // Position under navbar instead of hiding
        el.style.position = 'fixed !important';
        el.style.top = '70px !important';
        el.style.left = '0 !important';
        el.style.right = '0 !important';
        el.style.zIndex = '999 !important';
        el.style.height = '40px !important';
        el.style.backgroundColor = '#f8f9fa !important';
        el.style.borderBottom = '1px solid #ddd !important';
      });
    });
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
        /* Position banner under navbar instead of hiding */
        .goog-te-banner-frame,
        .goog-te-banner {
          position: fixed !important;
          top: 70px !important;
          left: 0 !important;
          right: 0 !important;
          z-index: 999 !important;
          height: 40px !important;
          background-color: #f8f9fa !important;
          border-bottom: 1px solid #ddd !important;
        }

        /* Adjust body for navbar + banner */
        body {
          padding-top: 110px !important;
        }

        /* Style the translate element */
        #google_translate_element {
          position: fixed !important;
          top: 70px !important;
          right: 20px !important;
          z-index: 1000 !important;
          background: white !important;
          padding: 10px !important;
          border: 1px solid #ddd !important;
          border-radius: 5px !important;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1) !important;
        }

        /* Style the translate dropdown */
        .goog-te-combo {
          padding: 5px !important;
          border: 1px solid #ccc !important;
          border-radius: 3px !important;
          font-size: 14px !important;
        }
      `}</style>
    </div>
  );
};

export default SimpleGoogleTranslate;
