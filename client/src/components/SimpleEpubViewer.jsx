import React, { useState, useEffect, useRef } from 'react';
import { ReactReader } from 'react-reader';
import { Sun, Moon, Play, Pause, RefreshCcw, RotateCcw, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './css.css';

// Cookie helpers
function setCookie(name, value, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/';
}
function getCookie(name) {
  return document.cookie.split('; ').reduce((r, v) => {
    const parts = v.split('=');
    return parts[0] === name ? decodeURIComponent(parts[1]) : r
  }, '');
}

const SimpleEpubViewer = ({ epubUrl }) => {
  const navigate = useNavigate();

  const renditionRef = useRef(null);
  const utteranceRef = useRef(null);

  const defaultFontSize = 100;
  const defaultFontFamily = 'serif';
  const defaultDarkMode = false;

  const [highlights, setHighlights] = useState(() => {
    try {
      const saved = getCookie('epubHighlights');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [darkMode, setDarkMode] = useState(() => {
    const cookie = getCookie('epubDarkMode');
    return cookie ? cookie === 'true' : defaultDarkMode;
  });

  const [fontSize, setFontSize] = useState(() => {
    const cookie = getCookie('epubFontSize');
    return cookie ? Number(cookie) : defaultFontSize;
  });

  const [fontFamily, setFontFamily] = useState(() => {
    const cookie = getCookie('epubFontFamily');
    return cookie || defaultFontFamily;
  });

  const [location, setLocation] = useState(null);
  const [currentPageLabel, setCurrentPageLabel] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const newUrl = epubUrl || 'https://res.cloudinary.com/dg3i8akzq/raw/upload/v1748874237/ebooks/file_ifmsnc.epub';

  useEffect(() => {
    setCookie('epubDarkMode', darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    setCookie('epubFontSize', fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    setCookie('epubFontFamily', fontFamily);
  }, [fontFamily]);

  useEffect(() => {
    setCookie('epubHighlights', JSON.stringify(highlights));
  }, [highlights]);

  const applyThemeStyles = () => {
    if (!renditionRef.current) return;
    const rendition = renditionRef.current;

    rendition.themes.register('default', {
      body: {
        background: '#ffffff',
        color: '#000000',
        'font-family': fontFamily,
        'font-size': `${fontSize}%`,
      },
      a: { color: '#007bff' },
      '.highlighted': {
        background: 'yellow',
      },
    });

    rendition.themes.register('dark', {
      body: {
        background: '#121212',
        color: '#f1f1f1',
        'font-family': fontFamily,
        'font-size': `${fontSize}%`,
      },
      a: { color: '#9cdcfe' },
      '.highlighted': {
        background: 'orange',
      },
    });

    rendition.themes.select(darkMode ? 'dark' : 'default');

    const injectStyles = () => {
      const iframe = document.querySelector('iframe');
      if (!iframe?.contentDocument?.body) return;
      const docBody = iframe.contentDocument.body;
      docBody.style.backgroundColor = darkMode ? '#121212' : '#ffffff';
      docBody.style.color = darkMode ? '#f1f1f1' : '#000000';
      docBody.style.fontFamily = fontFamily;
      docBody.style.fontSize = `${fontSize}%`;

      iframe.contentDocument.querySelectorAll('a').forEach(link => {
        link.style.color = darkMode ? '#9cdcfe' : '#007bff';
      });
    };

    injectStyles();
    rendition.on('rendered', injectStyles);
  };

  const restoreHighlights = () => {
    if (!renditionRef.current) return;
    highlights.forEach((cfiRange) => {
      try {
        renditionRef.current.annotations.highlight(cfiRange, {}, () => {});
      } catch (e) {
        console.warn('Failed to restore highlight:', e);
      }
    });
  };

  const handleRendition = (rendition) => {
    renditionRef.current = rendition;
    applyThemeStyles();

    restoreHighlights();

    rendition.on('selected', (cfiRange, contents) => {
      if (!cfiRange) return;

      removeHighlightMenu();

      const highlightBtn = document.createElement('button');
      highlightBtn.textContent = 'Highlight';
      highlightBtn.className = 'highlight-btn';
      highlightBtn.style.position = 'absolute';
      highlightBtn.style.zIndex = '10000';

      const iframe = document.querySelector('iframe');
      if (!iframe) return;
      const iframeRect = iframe.getBoundingClientRect();

      const selection = contents.document.getSelection();
      if (!selection.rangeCount) return;
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      highlightBtn.style.top = (rect.top + iframeRect.top - 40) + 'px';
      highlightBtn.style.left = (rect.left + iframeRect.left) + 'px';

      document.body.appendChild(highlightBtn);

      highlightBtn.onclick = () => {
        renditionRef.current.annotations.highlight(cfiRange, {}, () => {
          setHighlights((prev) => {
            if (!prev.includes(cfiRange)) return [...prev, cfiRange];
            return prev;
          });
          removeHighlightMenu();
        });
        contents.window.getSelection().removeAllRanges();
      };

      function removeHighlightMenu() {
        const existing = document.querySelector('.highlight-btn');
        if (existing) existing.remove();
      }

      document.addEventListener('click', (e) => {
        if (!highlightBtn.contains(e.target)) {
          removeHighlightMenu();
        }
      }, { once: true });
    });
  };

  useEffect(() => {
    applyThemeStyles();
  }, [darkMode, fontSize, fontFamily, location]);

  useEffect(() => {
    const rendition = renditionRef.current;
    if (rendition && rendition.location?.start) {
      const displayed = rendition.location.start.displayed;
      if (displayed && displayed.page && displayed.total) {
        setCurrentPageLabel(`Page ${displayed.page} of ${displayed.total}`);
      } else {
        setCurrentPageLabel('');
      }
    }
  }, [location]);

  const readCurrentPageAloud = () => {
    stopSpeech();
    const iframe = document.querySelector('iframe');
    const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
    if (!iframeDoc) return;

    const pageText = iframeDoc.body.innerText;
    if (!pageText.trim()) return;

    const utterance = new SpeechSynthesisUtterance(pageText);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => setIsSpeaking(false);
    utteranceRef.current = utterance;

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const pauseSpeech = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsSpeaking(false);
    }
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const resetAllSettings = () => {
    stopSpeech();
    setDarkMode(defaultDarkMode);
    setFontSize(defaultFontSize);
    setFontFamily(defaultFontFamily);
    setHighlights([]);
    setCookie('epubDarkMode', defaultDarkMode.toString());
    setCookie('epubFontSize', defaultFontSize.toString());
    setCookie('epubFontFamily', defaultFontFamily);
    setCookie('epubHighlights', JSON.stringify([]));
    setTimeout(() => applyThemeStyles(), 100);
  };

  // Close handler - navigate to /my-books
  const handleClose = () => {
    stopSpeech();
    navigate('/my-books');
  };

  // Listen for Escape key to close
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className={`w-screen h-screen ${darkMode ? 'dark' : ''} relative font-sans bg-white text-black dark:bg-gray-900 dark:text-white`}>
      

      <div className="top-bar">
        <div className="controls">
          <button onClick={() => setDarkMode(prev => !prev)} title="Toggle mode" className="btn">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={readCurrentPageAloud} disabled={isSpeaking} title="Play" className="btn">
            <Play size={20} />
          </button>
          <button onClick={pauseSpeech} title="Pause" className="btn">
            <Pause size={20} />
          </button>
          <button onClick={stopSpeech} title="Stop" className="btn">
            <RefreshCcw size={20} />
          </button>
          <div className="font-size-control">
            <label htmlFor="fontSize">Font Size:</label>
            <input
              id="fontSize"
              type="range"
              min={50}
              max={200}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="font-slider"
            />
          </div>
          <div className="font-family-control">
            <label htmlFor="fontFamily">Font:</label>
            <select
              id="fontFamily"
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="font-select"
            >
              <option value="serif">Serif</option>
              <option value="sans-serif">Sans-serif</option>
              <option value="monospace">Monospace</option>
              <option value="cursive">Cursive</option>
              <option value="fantasy">Fantasy</option>
            </select>
          </div>
          <button onClick={resetAllSettings} title="Reset" className="btn">
            <RotateCcw size={20} />
          </button>
        </div>
        <div className="page-label" aria-live="polite">{currentPageLabel}</div>
      </div>

      <div className="reader-container">
        <ReactReader
          url={newUrl}
          location={location}
          locationChanged={setLocation}
          getRendition={handleRendition}
        />
      </div>
    </div>
  );
};

export default SimpleEpubViewer;
