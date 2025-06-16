import React, { useState, useEffect } from 'react';
import './UniversalTranslator.css';

const UniversalTranslator = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);

  const languages = [
    { code: 'en', name: '🇺🇸 English', flag: '🇺🇸' },
    { code: 'es', name: '🇪🇸 Spanish', flag: '🇪🇸' },
    { code: 'fr', name: '🇫🇷 French', flag: '🇫🇷' },
    { code: 'de', name: '🇩🇪 German', flag: '🇩🇪' },
    { code: 'it', name: '🇮🇹 Italian', flag: '🇮🇹' },
    { code: 'pt', name: '🇵🇹 Portuguese', flag: '🇵🇹' },
    { code: 'ru', name: '🇷🇺 Russian', flag: '🇷🇺' },
    { code: 'ja', name: '🇯🇵 Japanese', flag: '🇯🇵' },
    { code: 'ko', name: '🇰🇷 Korean', flag: '🇰🇷' },
    { code: 'zh', name: '🇨🇳 Chinese', flag: '🇨🇳' },
    { code: 'ar', name: '🇸🇦 Arabic', flag: '🇸🇦' },
    { code: 'hi', name: '🇮🇳 Hindi', flag: '🇮🇳' },
    { code: 'te', name: '🇮🇳 Telugu', flag: '🇮🇳' },
    { code: 'ta', name: '🇮🇳 Tamil', flag: '🇮🇳' },
    { code: 'ml', name: '🇮🇳 Malayalam', flag: '🇮🇳' },
    { code: 'kn', name: '🇮🇳 Kannada', flag: '🇮🇳' },
    { code: 'bn', name: '🇧🇩 Bengali', flag: '🇧🇩' },
    { code: 'gu', name: '🇮🇳 Gujarati', flag: '🇮🇳' },
    { code: 'mr', name: '🇮🇳 Marathi', flag: '🇮🇳' },
    { code: 'pa', name: '🇮🇳 Punjabi', flag: '🇮🇳' },
    { code: 'ur', name: '🇵🇰 Urdu', flag: '🇵🇰' },
    { code: 'th', name: '🇹🇭 Thai', flag: '🇹🇭' },
    { code: 'vi', name: '🇻🇳 Vietnamese', flag: '🇻🇳' },
    { code: 'tr', name: '🇹🇷 Turkish', flag: '🇹🇷' },
    { code: 'pl', name: '🇵🇱 Polish', flag: '🇵🇱' },
    { code: 'nl', name: '🇳🇱 Dutch', flag: '🇳🇱' },
    { code: 'sv', name: '🇸🇪 Swedish', flag: '🇸🇪' },
    { code: 'da', name: '🇩🇰 Danish', flag: '🇩🇰' },
    { code: 'no', name: '🇳🇴 Norwegian', flag: '🇳🇴' },
    { code: 'fi', name: '🇫🇮 Finnish', flag: '🇫🇮' },
    { code: 'he', name: '🇮🇱 Hebrew', flag: '🇮🇱' },
    { code: 'fa', name: '🇮🇷 Persian', flag: '🇮🇷' },
    { code: 'id', name: '🇮🇩 Indonesian', flag: '🇮🇩' },
    { code: 'ms', name: '🇲🇾 Malay', flag: '🇲🇾' },
    { code: 'tl', name: '🇵🇭 Filipino', flag: '🇵🇭' }
  ];

  // Load saved language preference
  useEffect(() => {
    const savedLang = localStorage.getItem('universal-translate-lang');
    if (savedLang && savedLang !== 'en') {
      setCurrentLang(savedLang);
      // Auto-translate if not English
      setTimeout(() => translatePage(savedLang), 1000);
    }
  }, []);

  // Simple translation cache
  const translationCache = new Map();

  const translateText = async (text, targetLang) => {
    if (targetLang === 'en' || !text || text.length < 2) return text;
    
    const cacheKey = `${text}-${targetLang}`;
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey);
    }

    try {
      // Use Google Translate unofficial API
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
      );
      const data = await response.json();
      const translation = data?.[0]?.[0]?.[0];
      
      if (translation && translation !== text) {
        translationCache.set(cacheKey, translation);
        return translation;
      }
    } catch (error) {
      console.log('Translation failed for:', text);
    }
    
    return text;
  };

  const translatePage = async (targetLang) => {
    if (targetLang === 'en') {
      // Restore original content
      if (window.originalPageContent) {
        document.body.innerHTML = window.originalPageContent;
        window.originalPageContent = null;
      } else {
        window.location.reload();
      }
      return;
    }

    setIsTranslating(true);
    
    // Store original content
    if (!window.originalPageContent) {
      window.originalPageContent = document.body.innerHTML;
    }

    // Get all text nodes
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip script, style, and other non-visible elements
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          
          const tagName = parent.tagName.toLowerCase();
          if (['script', 'style', 'noscript', 'meta', 'title'].includes(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Skip empty or whitespace-only text
          const text = node.textContent.trim();
          if (!text || text.length < 2) return NodeFilter.FILTER_REJECT;
          
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }

    // Translate in batches
    const batchSize = 10;
    for (let i = 0; i < textNodes.length; i += batchSize) {
      const batch = textNodes.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (textNode) => {
        const originalText = textNode.textContent.trim();
        if (originalText) {
          const translatedText = await translateText(originalText, targetLang);
          if (translatedText !== originalText) {
            textNode.textContent = translatedText;
          }
        }
      }));
      
      // Small delay between batches to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsTranslating(false);
  };

  const handleLanguageSelect = (langCode) => {
    setCurrentLang(langCode);
    localStorage.setItem('universal-translate-lang', langCode);
    setIsOpen(false);
    translatePage(langCode);
  };

  const currentLanguage = languages.find(lang => lang.code === currentLang);

  return (
    <div className="universal-translator">
      <button 
        className="translator-toggle"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isTranslating}
      >
        {isTranslating ? (
          <span className="translating">🔄 Translating...</span>
        ) : (
          <span>{currentLanguage?.flag} {currentLanguage?.name.split(' ')[1] || 'English'}</span>
        )}
      </button>

      {isOpen && (
        <div className="translator-dropdown">
          <div className="translator-header">
            <h3>🌐 Translate Page</h3>
            <button onClick={() => setIsOpen(false)}>×</button>
          </div>
          <div className="language-grid">
            {languages.map((lang) => (
              <button
                key={lang.code}
                className={`language-option ${currentLang === lang.code ? 'active' : ''}`}
                onClick={() => handleLanguageSelect(lang.code)}
                disabled={isTranslating}
              >
                {lang.name}
              </button>
            ))}
          </div>
          <div className="translator-footer">
            <small>Translation powered by Google Translate</small>
          </div>
        </div>
      )}
    </div>
  );
};

export default UniversalTranslator;
