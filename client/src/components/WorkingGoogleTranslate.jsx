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
      // Method 1: Try using Google Translate API directly
      if (window.google && window.google.translate) {
        // Create a temporary element for Google Translate
        const tempDiv = document.createElement('div');
        tempDiv.id = 'temp_google_translate';
        tempDiv.style.display = 'none';
        document.body.appendChild(tempDiv);

        new window.google.translate.TranslateElement({
          pageLanguage: 'en',
          includedLanguages: languageCode,
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false
        }, 'temp_google_translate');

        // Trigger translation
        setTimeout(() => {
          const select = tempDiv.querySelector('select');
          if (select) {
            select.value = languageCode;
            select.dispatchEvent(new Event('change'));
            console.log('✅ Translation triggered via Google Translate API');
          }
          document.body.removeChild(tempDiv);
          setIsTranslating(false);
        }, 1000);
      } else {
        // Method 2: Use Google Translate URL redirect
        const currentUrl = window.location.href;
        const translateUrl = `https://translate.google.com/translate?sl=en&tl=${languageCode}&u=${encodeURIComponent(currentUrl)}`;
        console.log('🔗 Redirecting to Google Translate:', translateUrl);
        window.open(translateUrl, '_blank');
        setIsTranslating(false);
      }
    } catch (error) {
      console.error('❌ Translation error:', error);
      // Fallback: Open Google Translate in new tab
      const currentUrl = window.location.href;
      const translateUrl = `https://translate.google.com/translate?sl=en&tl=${languageCode}&u=${encodeURIComponent(currentUrl)}`;
      window.open(translateUrl, '_blank');
      setIsTranslating(false);
    }
  };

  // Function to restore original language
  const restoreOriginal = () => {
    console.log('🔄 Restoring original language...');
    
    // Try to find and click the "Show original" button
    const showOriginalBtn = document.querySelector('.goog-te-menu-value span');
    if (showOriginalBtn && showOriginalBtn.textContent.includes('Show original')) {
      showOriginalBtn.click();
      return;
    }

    // Alternative: Reload the page to restore original
    window.location.reload();
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
