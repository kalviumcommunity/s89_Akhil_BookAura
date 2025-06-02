import React, { useState, useEffect } from 'react';
import { ReactReader } from 'react-reader';
import { Sun, Moon, Settings, BookOpen, RotateCcw, ZoomIn, ZoomOut, Languages, Globe } from 'lucide-react';

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

  // Fallback EPUB URL for when books don't work - using the working URL from AllBooks
  const FALLBACK_EPUB_URL = 'https://res.cloudinary.com/dg3i8akzq/raw/upload/v1748874237/ebooks/file_ifmsnc.epub';

  // LibreTranslate configuration
  const LIBRETRANSLATE_API = 'https://libretranslate.de/translate'; // Free public instance

  // Supported languages for translation
  const SUPPORTED_LANGUAGES = [
    { code: 'original', name: 'Original', flag: '📖' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
    { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
    { code: 'da', name: 'Danish', flag: '🇩🇰' },
    { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
    { code: 'fi', name: 'Finnish', flag: '🇫🇮' },
    { code: 'pl', name: 'Polish', flag: '🇵🇱' },
    { code: 'tr', name: 'Turkish', flag: '🇹🇷' }
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

  const handleLocationChanged = (epubcifi) => {
    setLocation(epubcifi);
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
      renditionInstance.themes.default({
        'body': {
          'background': '#1a1a1a !important',
          'color': '#e0e0e0 !important'
        },
        'p': {
          'color': '#e0e0e0 !important'
        },
        'h1, h2, h3, h4, h5, h6': {
          'color': '#ffffff !important'
        }
      });
    } else {
      renditionInstance.themes.default({
        'body': {
          'background': '#ffffff !important',
          'color': '#333333 !important'
        },
        'p': {
          'color': '#333333 !important'
        },
        'h1, h2, h3, h4, h5, h6': {
          'color': '#000000 !important'
        }
      });
    }

    // Apply font size
    renditionInstance.themes.fontSize(`${fontSize}%`);
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

  // Translation functions
  const translateText = async (text, targetLanguage) => {
    if (!text || text.trim().length === 0) return text;

    // Check cache first
    const cacheKey = `${text}_${targetLanguage}`;
    if (translationCache[cacheKey]) {
      return translationCache[cacheKey];
    }

    try {
      const response = await fetch(LIBRETRANSLATE_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: 'auto', // Auto-detect source language
          target: targetLanguage,
          format: 'text'
        })
      });

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.status}`);
      }

      const data = await response.json();
      const translatedText = data.translatedText;

      // Cache the translation
      setTranslationCache(prev => ({
        ...prev,
        [cacheKey]: translatedText
      }));

      return translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original text if translation fails
    }
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

    try {
      // Get all text nodes in the current view
      const iframe = rendition.manager.container.querySelector('iframe');
      if (!iframe || !iframe.contentDocument) {
        console.error('Cannot access EPUB content');
        return;
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

      // Translate text nodes in batches
      const batchSize = 5; // Translate 5 nodes at a time to avoid overwhelming the API
      for (let i = 0; i < textNodes.length; i += batchSize) {
        const batch = textNodes.slice(i, i + batchSize);

        await Promise.all(batch.map(async (textNode) => {
          const originalText = textNode.textContent.trim();
          if (originalText.length > 0) {
            const translatedText = await translateText(originalText, targetLanguage);
            textNode.textContent = translatedText;
          }
        }));

        // Small delay between batches to be respectful to the API
        if (i + batchSize < textNodes.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

    } catch (error) {
      console.error('Error translating EPUB content:', error);
    } finally {
      setIsTranslating(false);
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
    <div style={{ height: '600px', width: '100%', position: 'relative' }}>
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
                (Translating...)
              </span>
            )}
          </h4>

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
            <div>• Powered by LibreTranslate</div>
            <div>• Press 'L' for quick access</div>
            <div>• Translations are cached</div>
            <div>• Select 'Original' to restore</div>
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

      {/* EPUB Reader */}
      <div style={{
        height: 'calc(100% - 120px)',
        backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff'
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
        />
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default SimpleEpubViewer;
