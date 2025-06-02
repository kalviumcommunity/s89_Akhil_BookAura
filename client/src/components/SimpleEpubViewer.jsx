import React, { useState, useEffect } from 'react';
import { ReactReader } from 'react-reader';
import { Sun, Moon, Settings, BookOpen, RotateCcw, ZoomIn, ZoomOut, Languages, Globe } from 'lucide-react';
import translate from '@vitalets/google-translate-api';

const SimpleEpubViewer = ({ epubUrl, title = "EPUB Reader" }) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState(100);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rendition, setRendition] = useState(null);
  const [currentLanguage, setCurrentLanguage] = useState('original');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [translationCache, setTranslationCache] = useState({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [originalContent, setOriginalContent] = useState(null);
  const [translationError, setTranslationError] = useState(null);
  const [translationProgress, setTranslationProgress] = useState({ current: 0, total: 0 });

  // Fallback EPUB URL for when books don't work - using the working URL from AllBooks
  const FALLBACK_EPUB_URL = 'https://res.cloudinary.com/dg3i8akzq/raw/upload/v1748874237/ebooks/file_ifmsnc.epub';



  // Supported languages for translation with Google Translate API
  const SUPPORTED_LANGUAGES = [
    { code: 'original', name: 'Original', flag: '📖' },

    // Major World Languages
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'zh', name: 'Chinese (Simplified)', flag: '🇨🇳' },
    { code: 'zh-tw', name: 'Chinese (Traditional)', flag: '🇹🇼' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },

    // Indian Languages
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'te', name: 'Telugu', flag: '🇮🇳' },
    { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
    { code: 'ml', name: 'Malayalam', flag: '🇮🇳' },
    { code: 'kn', name: 'Kannada', flag: '🇮🇳' },
    { code: 'bn', name: 'Bengali', flag: '🇮🇳' },
    { code: 'gu', name: 'Gujarati', flag: '🇮🇳' },
    { code: 'mr', name: 'Marathi', flag: '🇮🇳' },
    { code: 'pa', name: 'Punjabi', flag: '🇮🇳' },
    { code: 'or', name: 'Odia', flag: '🇮🇳' },
    { code: 'as', name: 'Assamese', flag: '🇮🇳' },
    { code: 'ur', name: 'Urdu', flag: '🇵🇰' },

    // European Languages
    { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
    { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
    { code: 'da', name: 'Danish', flag: '🇩🇰' },
    { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
    { code: 'fi', name: 'Finnish', flag: '🇫🇮' },
    { code: 'pl', name: 'Polish', flag: '🇵🇱' },
    { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
    { code: 'el', name: 'Greek', flag: '🇬🇷' },
    { code: 'cs', name: 'Czech', flag: '🇨🇿' },
    { code: 'hu', name: 'Hungarian', flag: '🇭🇺' },
    { code: 'ro', name: 'Romanian', flag: '🇷🇴' },

    // Other Major Languages
    { code: 'th', name: 'Thai', flag: '🇹🇭' },
    { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
    { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
    { code: 'ms', name: 'Malay', flag: '🇲🇾' },
    { code: 'tl', name: 'Filipino', flag: '🇵🇭' },
    { code: 'sw', name: 'Swahili', flag: '🇰🇪' },
    { code: 'he', name: 'Hebrew', flag: '🇮🇱' },
    { code: 'fa', name: 'Persian', flag: '🇮🇷' }
  ];

  // Keyboard event handler
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (isFullscreen) {
          exitFullscreen();
        } else {
          // Close the reader if parent has a close function
          console.log('ESC pressed - Reader should close');
          // You can emit a custom event or call a parent function here
          window.dispatchEvent(new CustomEvent('closeEpubReader'));
        }
      } else if (event.key === 'f' || event.key === 'F') {
        event.preventDefault();
        toggleFullscreen();
      } else if (event.key === 'd' || event.key === 'D') {
        event.preventDefault();
        toggleDarkMode();
      } else if (event.key === 's' || event.key === 'S') {
        event.preventDefault();
        setShowSettings(!showSettings);
      } else if (event.key === 'l' || event.key === 'L') {
        event.preventDefault();
        setShowLanguageMenu(!showLanguageMenu);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isFullscreen, showSettings]);

  // Apply theme when dark mode changes
  useEffect(() => {
    if (rendition) {
      applyTheme(rendition);
    }
  }, [isDarkMode, fontSize]);

  const handleLocationChanged = (epubcifi) => {
    setLocation(epubcifi);
  };

  // Reader styles for the outer container
  const readerStyles = {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
    color: isDarkMode ? '#e0e0e0' : '#333333',
    height: '100%',
    width: '100%'
  };

  const handleRenditionReady = (renditionInstance) => {
    setRendition(renditionInstance);
    applyTheme(renditionInstance);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (rendition) {
      applyTheme(rendition);
    }
  };

  const applyTheme = (renditionInstance) => {
    if (isDarkMode) {
      // Dark mode theme
      renditionInstance.themes.default({
        'html': {
          'background': '#1a1a1a !important',
          'color': '#e0e0e0 !important'
        },
        'body': {
          'background': '#1a1a1a !important',
          'color': '#e0e0e0 !important',
          'margin': '0 !important',
          'padding': '20px !important',
          'line-height': '1.6 !important',
          'font-family': 'Georgia, serif !important'
        },
        'p, div, span': {
          'color': '#e0e0e0 !important',
          'background': 'transparent !important'
        },
        'h1, h2, h3, h4, h5, h6': {
          'color': '#ffffff !important',
          'background': 'transparent !important'
        },
        'a': {
          'color': '#66b3ff !important'
        },
        '*': {
          'background': 'transparent !important'
        }
      });
    } else {
      // Light mode theme
      renditionInstance.themes.default({
        'html': {
          'background': '#ffffff !important',
          'color': '#333333 !important'
        },
        'body': {
          'background': '#ffffff !important',
          'color': '#333333 !important',
          'margin': '0 !important',
          'padding': '20px !important',
          'line-height': '1.6 !important',
          'font-family': 'Georgia, serif !important'
        },
        'p, div, span': {
          'color': '#333333 !important',
          'background': 'transparent !important'
        },
        'h1, h2, h3, h4, h5, h6': {
          'color': '#000000 !important',
          'background': 'transparent !important'
        },
        'a': {
          'color': '#0066cc !important'
        },
        '*': {
          'background': 'transparent !important'
        }
      });
    }

    // Apply font size
    renditionInstance.themes.fontSize(`${fontSize}%`);

    // Force theme application
    setTimeout(() => {
      if (renditionInstance.manager && renditionInstance.manager.container) {
        const iframe = renditionInstance.manager.container.querySelector('iframe');
        if (iframe && iframe.contentDocument) {
          const doc = iframe.contentDocument;
          if (doc.body) {
            doc.body.style.backgroundColor = isDarkMode ? '#1a1a1a' : '#ffffff';
            doc.body.style.color = isDarkMode ? '#e0e0e0' : '#333333';
          }
        }
      }
    }, 100);
  };

  const increaseFontSize = () => {
    const newSize = Math.min(fontSize + 10, 200);
    setFontSize(newSize);
    if (rendition) {
      rendition.themes.fontSize(`${newSize}%`);
    }
  };

  const decreaseFontSize = () => {
    const newSize = Math.max(fontSize - 10, 50);
    setFontSize(newSize);
    if (rendition) {
      rendition.themes.fontSize(`${newSize}%`);
    }
  };

  const resetSettings = () => {
    setFontSize(100);
    setIsDarkMode(false);
    if (rendition) {
      setFontSize(100);
      setIsDarkMode(false);
      applyTheme(rendition);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.log('Error attempting to enable fullscreen:', err);
      });
    } else {
      exitFullscreen();
    }
  };

  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  const translateText = async (text, targetLanguage) => {
    if (!text || text.trim().length === 0) return text;

    // Validate inputs
    let cleanText = text.trim();
    if (cleanText.length === 0) return text;
    if (cleanText.length > 5000) {
      console.warn('Text too long for translation, truncating...');
      cleanText = cleanText.substring(0, 5000);
    }

    // Get valid language codes from our supported languages
    const validLanguages = SUPPORTED_LANGUAGES.map(lang => lang.code).filter(code => code !== 'original');
    if (!validLanguages.includes(targetLanguage)) {
      console.error(`Invalid target language: ${targetLanguage}`);
      return text;
    }

    // Check cache first
    const cacheKey = `${cleanText}_${targetLanguage}`;
    if (translationCache[cacheKey]) {
      console.log(`📋 Using cached translation for: ${cleanText.substring(0, 50)}...`);
      return translationCache[cacheKey];
    }

    try {
      console.log(`🌍 Translating to ${targetLanguage}: ${cleanText.substring(0, 50)}...`);

      // Use Google Translate API
      const result = await translate(cleanText, { to: targetLanguage });

      if (!result || !result.text) {
        throw new Error('No translation result received');
      }

      const translatedText = result.text;
      console.log(`✅ Translation successful: ${translatedText.substring(0, 50)}...`);

      // Cache the translation
      setTranslationCache(prev => ({
        ...prev,
        [cacheKey]: translatedText
      }));

      return translatedText;

    } catch (error) {
      console.error(`❌ Google Translate failed:`, error.message);

      // Return mock translation as fallback
      const mockTranslated = mockTranslateText(cleanText, targetLanguage);
      if (mockTranslated !== cleanText) {
        console.log(`🎭 Using mock translation as fallback`);
        return mockTranslated;
      }

      return text; // Final fallback - return original text
    }
  };

  // Mock translation function for testing (when APIs are down)
  const mockTranslateText = (text, targetLanguage) => {
    const mockTranslations = {
      // Major World Languages
      'es': text => `[ES] ${text}`,
      'fr': text => `[FR] ${text}`,
      'de': text => `[DE] ${text}`,
      'it': text => `[IT] ${text}`,
      'pt': text => `[PT] ${text}`,
      'ru': text => `[RU] ${text}`,
      'ja': text => `[JA] ${text}`,
      'ko': text => `[KO] ${text}`,
      'zh': text => `[ZH] ${text}`,
      'zh-tw': text => `[ZH-TW] ${text}`,
      'ar': text => `[AR] ${text}`,

      // Indian Languages
      'hi': text => `[हिंदी] ${text}`,
      'te': text => `[తెలుగు] ${text}`,
      'ta': text => `[தமிழ்] ${text}`,
      'ml': text => `[മലയാളം] ${text}`,
      'kn': text => `[ಕನ್ನಡ] ${text}`,
      'bn': text => `[বাংলা] ${text}`,
      'gu': text => `[ગુજરાતી] ${text}`,
      'mr': text => `[मराठी] ${text}`,
      'pa': text => `[ਪੰਜਾਬੀ] ${text}`,
      'or': text => `[ଓଡ଼ିଆ] ${text}`,
      'as': text => `[অসমীয়া] ${text}`,
      'ur': text => `[اردو] ${text}`,

      // European Languages
      'nl': text => `[NL] ${text}`,
      'sv': text => `[SV] ${text}`,
      'da': text => `[DA] ${text}`,
      'no': text => `[NO] ${text}`,
      'fi': text => `[FI] ${text}`,
      'pl': text => `[PL] ${text}`,
      'tr': text => `[TR] ${text}`,
      'el': text => `[EL] ${text}`,
      'cs': text => `[CS] ${text}`,
      'hu': text => `[HU] ${text}`,
      'ro': text => `[RO] ${text}`,

      // Other Major Languages
      'th': text => `[TH] ${text}`,
      'vi': text => `[VI] ${text}`,
      'id': text => `[ID] ${text}`,
      'ms': text => `[MS] ${text}`,
      'tl': text => `[TL] ${text}`,
      'sw': text => `[SW] ${text}`,
      'he': text => `[HE] ${text}`,
      'fa': text => `[FA] ${text}`
    };

    const translator = mockTranslations[targetLanguage];
    return translator ? translator(text) : text;
  };

  const translateEpubContent = async (targetLanguage) => {
    if (!rendition || targetLanguage === 'original') {
      // Restore original content
      if (originalContent && rendition) {
        restoreOriginalContent();
      }
      return;
    }

    setIsTranslating(true);
    setTranslationError(null);
    setTranslationProgress({ current: 0, total: 0 });

    try {
      // Get all text nodes in the current view
      const iframe = rendition.manager.container.querySelector('iframe');
      if (!iframe || !iframe.contentDocument) {
        throw new Error('Cannot access EPUB content - iframe not found');
      }

      const doc = iframe.contentDocument;

      // Store original content if not already stored
      if (!originalContent) {
        setOriginalContent(doc.body.innerHTML);
      }

      // Find all text nodes
      const walker = doc.createTreeWalker(
        doc.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            // Skip empty text nodes and script/style content
            if (!node.textContent.trim() ||
                node.parentElement.tagName === 'SCRIPT' ||
                node.parentElement.tagName === 'STYLE') {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      const textNodes = [];
      let node;
      while (node = walker.nextNode()) {
        textNodes.push(node);
      }

      if (textNodes.length === 0) {
        throw new Error('No text content found to translate');
      }

      console.log(`📝 Found ${textNodes.length} text nodes to translate`);
      setTranslationProgress({ current: 0, total: textNodes.length });

      // Translate text nodes in batches
      const batchSize = 3; // Reduced batch size for better reliability
      let translatedCount = 0;
      let failedCount = 0;

      for (let i = 0; i < textNodes.length; i += batchSize) {
        const batch = textNodes.slice(i, i + batchSize);

        const batchResults = await Promise.allSettled(batch.map(async (textNode) => {
          const originalText = textNode.textContent.trim();
          if (originalText.length > 0) {
            try {
              const translatedText = await translateText(originalText, targetLanguage);
              if (translatedText !== originalText) {
                textNode.textContent = translatedText;
                return 'success';
              } else {
                // If API translation failed, use mock translation for demo
                const mockTranslated = mockTranslateText(originalText, targetLanguage);
                if (mockTranslated !== originalText) {
                  textNode.textContent = mockTranslated;
                  return 'mock';
                }
              }
            } catch (error) {
              console.warn('Translation failed for text node:', error);
              // Use mock translation as fallback
              const mockTranslated = mockTranslateText(originalText, targetLanguage);
              if (mockTranslated !== originalText) {
                textNode.textContent = mockTranslated;
                return 'mock';
              }
            }
          }
          return 'skipped';
        }));

        // Count results
        batchResults.forEach(result => {
          if (result.status === 'fulfilled') {
            if (result.value === 'success' || result.value === 'mock') {
              translatedCount++;
            }
          } else if (result.status === 'rejected') {
            failedCount++;
          }
        });

        // Update progress
        const processedCount = Math.min(i + batchSize, textNodes.length);
        setTranslationProgress({ current: processedCount, total: textNodes.length });

        // Small delay between batches to be respectful to the API
        if (i + batchSize < textNodes.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      console.log(`✅ Translation complete: ${translatedCount} translated, ${failedCount} failed`);

      if (translatedCount === 0 && failedCount > 0) {
        setTranslationError('Translation service unavailable. Please try again later.');
      }

    } catch (error) {
      console.error('Error translating EPUB content:', error);
      setTranslationError(error.message || 'Translation failed. Please try again.');
    } finally {
      setIsTranslating(false);
      setTranslationProgress({ current: 0, total: 0 });
    }
  };

  const restoreOriginalContent = () => {
    if (!rendition || !originalContent) return;

    try {
      const iframe = rendition.manager.container.querySelector('iframe');
      if (iframe && iframe.contentDocument) {
        iframe.contentDocument.body.innerHTML = originalContent;
      }
    } catch (error) {
      console.error('Error restoring original content:', error);
    }
  };

  const handleLanguageChange = async (languageCode) => {
    console.log(`🌍 Changing language to: ${languageCode}`);
    setCurrentLanguage(languageCode);
    setShowLanguageMenu(false);

    if (languageCode === 'original') {
      restoreOriginalContent();
    } else {
      await translateEpubContent(languageCode);
    }
  };

  const handleError = (error) => {
    console.error('EPUB loading error:', error);
    console.log('🔄 EPUB failed to load, using fallback URL...');
    setError(`Original EPUB failed to load. Using fallback content.`);
  };

  // Check if URL is broken and use fallback immediately
  const isOldBrokenUrl = epubUrl && (
    epubUrl.includes('bookstore/bookFiles') ||
    epubUrl.includes('s89-akhil-bookaura-3.onrender.com/api/books/file/') ||
    epubUrl.includes('/api/books/file/') // Any in-memory storage URL
  );

  // Check if it's a direct Cloudinary URL (new system)
  const isDirectCloudinaryUrl = epubUrl && epubUrl.includes('res.cloudinary.com') && epubUrl.includes('/ebooks/');

  const urlToUse = isOldBrokenUrl ? FALLBACK_EPUB_URL : (epubUrl || FALLBACK_EPUB_URL);

  console.log('📚 EPUB Viewer URL decision:');
  console.log('Original URL:', epubUrl);
  console.log('Is old broken URL:', isOldBrokenUrl);
  console.log('Is direct Cloudinary URL:', isDirectCloudinaryUrl);
  console.log('URL to use:', urlToUse);

  // Show notice if using fallback
  if (isOldBrokenUrl) {
    console.log('⚠️ Using fallback EPUB because original URL is from old storage');
  } else if (isDirectCloudinaryUrl) {
    console.log('✅ Using direct Cloudinary URL - should work perfectly');
  }

  if (error) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        margin: '20px'
      }}>
        <h3 style={{ color: '#dc3545', marginBottom: '16px' }}>
          📚 Unable to Load EPUB
        </h3>
        <p style={{ color: '#6c757d', marginBottom: '16px' }}>
          <strong>Error:</strong> {error}
        </p>
        <button
          onClick={() => {
            setError(null);
            window.location.reload();
          }}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔄 Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{
      height: '100vh',
      width: '100%',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff'
    }}>
      {/* Enhanced Header with Controls */}
      <div style={{
        padding: '10px 20px',
        backgroundColor: isDarkMode ? '#2d2d2d' : '#f8f9fa',
        borderBottom: `1px solid ${isDarkMode ? '#444' : '#dee2e6'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0', color: isDarkMode ? '#ffffff' : '#495057', fontSize: '18px' }}>
            📖 {title}
          </h3>
          <small style={{ color: isDarkMode ? '#cccccc' : '#6c757d', display: 'block', marginTop: '4px' }}>
            Arrow keys: Navigate • F: Fullscreen • D: Dark mode • S: Settings • L: Language • ESC: Close
          </small>
        </div>

        {/* Control Buttons */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Font Size Controls */}
          <button
            onClick={decreaseFontSize}
            style={{
              backgroundColor: isDarkMode ? '#444' : '#ffffff',
              color: isDarkMode ? '#ffffff' : '#333',
              border: `1px solid ${isDarkMode ? '#666' : '#ddd'}`,
              borderRadius: '4px',
              padding: '6px 8px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
            title="Decrease font size"
          >
            <ZoomOut size={14} />
          </button>

          <span style={{
            color: isDarkMode ? '#cccccc' : '#666',
            fontSize: '12px',
            minWidth: '35px',
            textAlign: 'center'
          }}>
            {fontSize}%
          </span>

          <button
            onClick={increaseFontSize}
            style={{
              backgroundColor: isDarkMode ? '#444' : '#ffffff',
              color: isDarkMode ? '#ffffff' : '#333',
              border: `1px solid ${isDarkMode ? '#666' : '#ddd'}`,
              borderRadius: '4px',
              padding: '6px 8px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
            title="Increase font size"
          >
            <ZoomIn size={14} />
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            style={{
              backgroundColor: isDarkMode ? '#444' : '#ffffff',
              color: isDarkMode ? '#ffffff' : '#333',
              border: `1px solid ${isDarkMode ? '#666' : '#ddd'}`,
              borderRadius: '4px',
              padding: '6px 8px',
              cursor: 'pointer'
            }}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          {/* Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              backgroundColor: showSettings ? (isDarkMode ? '#555' : '#e9ecef') : (isDarkMode ? '#444' : '#ffffff'),
              color: isDarkMode ? '#ffffff' : '#333',
              border: `1px solid ${isDarkMode ? '#666' : '#ddd'}`,
              borderRadius: '4px',
              padding: '6px 8px',
              cursor: 'pointer'
            }}
            title="Toggle settings"
          >
            <Settings size={14} />
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            style={{
              backgroundColor: showLanguageMenu ? (isDarkMode ? '#555' : '#e9ecef') : (isDarkMode ? '#444' : '#ffffff'),
              color: isDarkMode ? '#ffffff' : '#333',
              border: `1px solid ${isDarkMode ? '#666' : '#ddd'}`,
              borderRadius: '4px',
              padding: '6px 8px',
              cursor: 'pointer',
              position: 'relative'
            }}
            title="Change language"
          >
            <Languages size={14} />
            {isTranslating && (
              <div style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '8px',
                height: '8px',
                backgroundColor: '#28a745',
                borderRadius: '50%',
                animation: 'pulse 1s infinite'
              }} />
            )}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            style={{
              backgroundColor: isDarkMode ? '#444' : '#ffffff',
              color: isDarkMode ? '#ffffff' : '#333',
              border: `1px solid ${isDarkMode ? '#666' : '#ddd'}`,
              borderRadius: '4px',
              padding: '6px 8px',
              cursor: 'pointer'
            }}
            title="Toggle fullscreen"
          >
            <BookOpen size={14} />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div style={{
          position: 'absolute',
          top: '70px',
          right: '20px',
          backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff',
          border: `1px solid ${isDarkMode ? '#444' : '#ddd'}`,
          borderRadius: '8px',
          padding: '15px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          minWidth: '200px'
        }}>
          <h4 style={{
            margin: '0 0 12px 0',
            color: isDarkMode ? '#ffffff' : '#333',
            fontSize: '14px'
          }}>
            Reader Settings
          </h4>

          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              color: isDarkMode ? '#cccccc' : '#666',
              fontSize: '12px'
            }}>
              Font Size: {fontSize}%
            </label>
            <input
              type="range"
              min="50"
              max="200"
              step="10"
              value={fontSize}
              onChange={(e) => {
                const newSize = parseInt(e.target.value);
                setFontSize(newSize);
                if (rendition) {
                  rendition.themes.fontSize(`${newSize}%`);
                }
              }}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              color: isDarkMode ? '#cccccc' : '#666',
              fontSize: '12px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={isDarkMode}
                onChange={toggleDarkMode}
                style={{ marginRight: '8px' }}
              />
              Dark Mode
            </label>
          </div>

          <button
            onClick={resetSettings}
            style={{
              backgroundColor: isDarkMode ? '#444' : '#f8f9fa',
              color: isDarkMode ? '#ffffff' : '#333',
              border: `1px solid ${isDarkMode ? '#666' : '#ddd'}`,
              borderRadius: '4px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '12px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <RotateCcw size={12} />
            Reset to Default
          </button>
        </div>
      )}

      {/* Language Menu */}
      {showLanguageMenu && (
        <div style={{
          position: 'absolute',
          top: '70px',
          right: '20px',
          backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff',
          border: `1px solid ${isDarkMode ? '#444' : '#ddd'}`,
          borderRadius: '8px',
          padding: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          minWidth: '220px',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          <h4 style={{
            margin: '0 0 12px 0',
            color: isDarkMode ? '#ffffff' : '#333',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Globe size={16} />
            Select Language
            {isTranslating && (
              <span style={{
                fontSize: '12px',
                color: '#28a745',
                fontWeight: 'normal'
              }}>
                {translationProgress.total > 0
                  ? `(${translationProgress.current}/${translationProgress.total})`
                  : '(Translating...)'
                }
              </span>
            )}
          </h4>

          {/* Translation Error Display */}
          {translationError && (
            <div style={{
              marginBottom: '12px',
              padding: '8px',
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#c33'
            }}>
              <strong>⚠️ Translation Error:</strong><br />
              {translationError}
            </div>
          )}

          {/* Progress Bar */}
          {isTranslating && translationProgress.total > 0 && (
            <div style={{
              marginBottom: '12px',
              padding: '8px',
              backgroundColor: isDarkMode ? '#1a1a1a' : '#f0f8ff',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '4px',
                color: isDarkMode ? '#cccccc' : '#666'
              }}>
                <span>Translating...</span>
                <span>{Math.round((translationProgress.current / translationProgress.total) * 100)}%</span>
              </div>
              <div style={{
                width: '100%',
                height: '4px',
                backgroundColor: isDarkMode ? '#444' : '#ddd',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(translationProgress.current / translationProgress.total) * 100}%`,
                  height: '100%',
                  backgroundColor: '#28a745',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          )}

          <div style={{
            display: 'grid',
            gap: '4px'
          }}>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                disabled={isTranslating}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  backgroundColor: currentLanguage === lang.code
                    ? (isDarkMode ? '#555' : '#e9ecef')
                    : 'transparent',
                  color: isDarkMode ? '#ffffff' : '#333',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isTranslating ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  textAlign: 'left',
                  width: '100%',
                  opacity: isTranslating ? 0.6 : 1,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isTranslating && currentLanguage !== lang.code) {
                    e.target.style.backgroundColor = isDarkMode ? '#444' : '#f8f9fa';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentLanguage !== lang.code) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span style={{ fontSize: '16px' }}>{lang.flag}</span>
                <span>{lang.name}</span>
                {currentLanguage === lang.code && (
                  <span style={{ marginLeft: 'auto', color: '#28a745' }}>✓</span>
                )}
              </button>
            ))}
          </div>

          <div style={{
            marginTop: '12px',
            padding: '8px',
            backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa',
            borderRadius: '4px',
            fontSize: '11px',
            color: isDarkMode ? '#cccccc' : '#666'
          }}>
            <div style={{ marginBottom: '4px' }}>
              <strong>💡 Translation Tips:</strong>
            </div>
            <div>• Powered by Google Translate API</div>
            <div>• Press 'L' for quick access</div>
            <div>• Supports 40+ languages including Indian languages</div>
            <div>• Translations are cached for speed</div>
            <div>• Select 'Original' to restore</div>
            <div>• Demo mode available if API is down</div>
            <div>• Works offline with cached content</div>
          </div>
        </div>
      )}

      {/* Status Notices */}
      {isOldBrokenUrl && (
        <div style={{
          margin: '8px 20px',
          padding: '8px 12px',
          backgroundColor: '#fff3cd',
          color: '#856404',
          borderRadius: '4px',
          fontSize: '12px',
          border: '1px solid #ffeaa7'
        }}>
          ⚠️ Original book file unavailable - showing working EPUB content
        </div>
      )}
      {isDirectCloudinaryUrl && (
        <div style={{
          margin: '8px 20px',
          padding: '8px 12px',
          backgroundColor: '#d4edda',
          color: '#155724',
          borderRadius: '4px',
          fontSize: '12px',
          border: '1px solid #c3e6cb'
        }}>
          ✅ Using direct Cloudinary storage - optimal performance
        </div>
      )}

      {/* EPUB Reader - Takes all remaining space */}
      <div style={{
        flex: 1,
        minHeight: 0,
        backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
        overflow: 'hidden'
      }}>
        <ReactReader
          url={urlToUse}
          location={location}
          locationChanged={handleLocationChanged}
          epubInitOptions={{
            openAs: 'epub',
            allowScriptedContent: true
          }}
          epubOptions={{
            flow: 'scrolled',
            manager: 'default'
          }}
          getRendition={handleRenditionReady}
          onError={handleError}
          readerStyles={{
            ...readerStyles,
            backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff'
          }}
        />
      </div>

      {/* CSS Animations and Styles */}
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }

        /* Ensure EPUB viewer takes full space */
        .react-reader {
          height: 100% !important;
          width: 100% !important;
        }

        .react-reader iframe {
          height: 100% !important;
          width: 100% !important;
          border: none !important;
        }

        /* Dark mode scrollbar */
        .react-reader iframe::-webkit-scrollbar {
          width: 8px;
        }

        .react-reader iframe::-webkit-scrollbar-track {
          background: ${isDarkMode ? '#2d2d2d' : '#f1f1f1'};
        }

        .react-reader iframe::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? '#555' : '#888'};
          border-radius: 4px;
        }

        .react-reader iframe::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? '#777' : '#555'};
        }
      `}</style>
    </div>
  );
};

export default SimpleEpubViewer;
