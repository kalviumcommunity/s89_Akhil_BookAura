// Working Google Translate with Manual Language Selector
import React, { useState, useEffect } from 'react';
import { Globe, ChevronDown } from 'lucide-react';

const WorkingGoogleTranslate = ({ position = 'top-right' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);

  // Language options with Google Translate codes
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'te', name: 'Telugu (తెలుగు)' },
    { code: 'ta', name: 'Tamil (தமிழ்)' },
    { code: 'ml', name: 'Malayalam (മലയാളം)' },
    { code: 'hi', name: 'Hindi (हिन्दी)' },
    { code: 'bn', name: 'Bengali (বাংলা)' },
    { code: 'gu', name: 'Gujarati (ગુજરાતી)' },
    { code: 'kn', name: 'Kannada (ಕನ್ನಡ)' },
    { code: 'mr', name: 'Marathi (मराठी)' },
    { code: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ)' },
    { code: 'ur', name: 'Urdu (اردو)' },
    { code: 'es', name: 'Spanish (Español)' },
    { code: 'fr', name: 'French (Français)' },
    { code: 'de', name: 'German (Deutsch)' },
    { code: 'it', name: 'Italian (Italiano)' },
    { code: 'pt', name: 'Portuguese (Português)' },
    { code: 'ru', name: 'Russian (Русский)' },
    { code: 'ja', name: 'Japanese (日本語)' },
    { code: 'ko', name: 'Korean (한국어)' },
    { code: 'zh', name: 'Chinese (中文)' },
    { code: 'ar', name: 'Arabic (العربية)' },
    { code: 'th', name: 'Thai (ไทย)' },
    { code: 'vi', name: 'Vietnamese (Tiếng Việt)' },
    { code: 'tr', name: 'Turkish (Türkçe)' },
    { code: 'pl', name: 'Polish (Polski)' },
    { code: 'nl', name: 'Dutch (Nederlands)' },
    { code: 'sv', name: 'Swedish (Svenska)' },
    { code: 'da', name: 'Danish (Dansk)' },
    { code: 'no', name: 'Norwegian (Norsk)' },
    { code: 'fi', name: 'Finnish (Suomi)' },
    { code: 'he', name: 'Hebrew (עברית)' },
    { code: 'fa', name: 'Persian (فارسی)' },
    { code: 'id', name: 'Indonesian (Bahasa Indonesia)' },
    { code: 'ms', name: 'Malay (Bahasa Melayu)' },
    { code: 'tl', name: 'Filipino (Filipino)' }
  ];

  // Initialize Google Translate
  useEffect(() => {
    const initGoogleTranslate = () => {
      if (window.google && window.google.translate) {
        console.log('✅ Google Translate API is ready');
        return;
      }

      // Load Google Translate script
      if (!document.querySelector('script[src*="translate.google.com"]')) {
        const script = document.createElement('script');
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        document.head.appendChild(script);
      }
    };

    // Global callback for Google Translate
    window.googleTranslateElementInit = () => {
      console.log('🌍 Google Translate initialized');
    };

    initGoogleTranslate();
  }, []);

  // Function to trigger translation
  const translatePage = (languageCode) => {
    if (languageCode === 'en') {
      // Restore original
      restoreOriginal();
      return;
    }

    setIsTranslating(true);
    console.log(`🔄 Translating to: ${languageCode}`);

    try {
      // Method 1: Use Google Translate Widget approach
      if (window.google && window.google.translate) {
        console.log('🎯 Using Google Translate Widget method...');

        // Remove any existing translate elements
        const existingElements = document.querySelectorAll('[id^="google_translate_element"]');
        existingElements.forEach(el => el.remove());

        // Create a new translate element
        const translateDiv = document.createElement('div');
        translateDiv.id = 'google_translate_element_active';
        translateDiv.style.position = 'fixed';
        translateDiv.style.top = '-1000px';
        translateDiv.style.left = '-1000px';
        translateDiv.style.visibility = 'hidden';
        document.body.appendChild(translateDiv);

        // Initialize Google Translate
        const translateElement = new window.google.translate.TranslateElement({
          pageLanguage: 'en',
          includedLanguages: `en,${languageCode}`,
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
          multilanguagePage: true
        }, 'google_translate_element_active');

        // Wait for the element to be created and trigger translation
        setTimeout(() => {
          const select = translateDiv.querySelector('.goog-te-combo');
          if (select) {
            console.log('🎯 Found translate dropdown, triggering translation...');

            // Find the option for the target language
            const targetOption = Array.from(select.options).find(option =>
              option.value.includes(languageCode)
            );

            if (targetOption) {
              select.value = targetOption.value;
              select.dispatchEvent(new Event('change', { bubbles: true }));
              console.log(`✅ Translation triggered for ${languageCode}`);

              // Check if translation actually happened
              setTimeout(() => {
                const isTranslated = document.querySelector('.goog-te-banner-frame') ||
                                   document.body.classList.contains('translated-ltr') ||
                                   document.body.classList.contains('translated-rtl');

                if (isTranslated) {
                  console.log('✅ Page successfully translated!');
                } else {
                  console.log('⚠️ Translation may not have worked, trying fallback...');
                  fallbackTranslation(languageCode);
                }
                setIsTranslating(false);
              }, 2000);
            } else {
              console.log('❌ Target language option not found, using fallback...');
              fallbackTranslation(languageCode);
            }
          } else {
            console.log('❌ Translate dropdown not found, using fallback...');
            fallbackTranslation(languageCode);
          }
        }, 1500);

      } else {
        console.log('❌ Google Translate API not available, using fallback...');
        fallbackTranslation(languageCode);
      }
    } catch (error) {
      console.error('❌ Translation error:', error);
      fallbackTranslation(languageCode);
    }
  };

  // Fallback translation method
  const fallbackTranslation = (languageCode) => {
    console.log(`🔄 Using fallback translation for ${languageCode}...`);

    // Method 1: Try to use existing Google Translate on page
    const existingSelect = document.querySelector('.goog-te-combo');
    if (existingSelect) {
      const targetOption = Array.from(existingSelect.options).find(option =>
        option.value.includes(languageCode)
      );
      if (targetOption) {
        existingSelect.value = targetOption.value;
        existingSelect.dispatchEvent(new Event('change', { bubbles: true }));
        setIsTranslating(false);
        return;
      }
    }

    // Method 2: Open in Google Translate (new tab)
    const currentUrl = window.location.href;
    const translateUrl = `https://translate.google.com/translate?sl=en&tl=${languageCode}&u=${encodeURIComponent(currentUrl)}`;
    console.log('🔗 Opening Google Translate in new tab:', translateUrl);
    window.open(translateUrl, '_blank');
    setIsTranslating(false);
  };

  // Function to restore original language
  const restoreOriginal = () => {
    console.log('🔄 Restoring original language...');
    setIsTranslating(true);

    try {
      // Method 1: Try to find and use existing Google Translate dropdown
      const existingSelect = document.querySelector('.goog-te-combo');
      if (existingSelect) {
        // Find the English option
        const englishOption = Array.from(existingSelect.options).find(option =>
          option.value === '' || option.value.includes('en') || option.text.includes('English')
        );
        if (englishOption) {
          existingSelect.value = englishOption.value;
          existingSelect.dispatchEvent(new Event('change', { bubbles: true }));
          console.log('✅ Restored to original language via dropdown');
          setIsTranslating(false);
          return;
        }
      }

      // Method 2: Try to find and click the "Show original" button
      const showOriginalBtn = document.querySelector('.goog-te-menu-value span');
      if (showOriginalBtn && showOriginalBtn.textContent.includes('Show original')) {
        showOriginalBtn.click();
        console.log('✅ Restored to original language via Show Original button');
        setIsTranslating(false);
        return;
      }

      // Method 3: Remove translation classes from body
      document.body.classList.remove('translated-ltr', 'translated-rtl');
      const translateBanner = document.querySelector('.goog-te-banner-frame');
      if (translateBanner) {
        translateBanner.remove();
      }

      // Method 4: Reload the page as last resort
      console.log('🔄 Reloading page to restore original language...');
      window.location.reload();

    } catch (error) {
      console.error('❌ Error restoring original language:', error);
      setIsTranslating(false);
    }
  };

  const handleLanguageSelect = (languageCode) => {
    setSelectedLanguage(languageCode);
    setIsVisible(false);
    translatePage(languageCode);
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
          backgroundColor: isTranslating ? '#6c757d' : '#A67C52',
          color: 'white',
          border: 'none',
          borderRadius: '25px',
          cursor: isTranslating ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 15px rgba(166, 124, 82, 0.3)',
          transition: 'all 0.3s ease',
          fontSize: '14px',
          fontWeight: '500',
          minWidth: '120px',
          justifyContent: 'center'
        }}
      >
        <Globe size={18} />
        <span>{isTranslating ? 'Translating...' : 'Translate'}</span>
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
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            minWidth: '280px',
            maxWidth: '320px',
            zIndex: 1001,
            maxHeight: '400px',
            overflowY: 'auto'
          }}
        >
          <div style={{ 
            padding: '12px 16px', 
            borderBottom: '1px solid #eee',
            backgroundColor: '#f8f9fa',
            fontWeight: '600',
            fontSize: '14px',
            color: '#333'
          }}>
            Select Language
          </div>
          
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
                transition: 'background-color 0.2s ease'
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
              {language.name}
              {selectedLanguage === language.code && (
                <span style={{ float: 'right', color: '#A67C52', fontWeight: 'bold' }}>✓</span>
              )}
            </div>
          ))}
          
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
              padding: '4px',
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkingGoogleTranslate;
