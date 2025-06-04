// src/components/GoogleTranslate.js
import React, { useEffect, useState } from 'react';
import './GoogleTranslateWidget.css';

const GoogleTranslate = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  // Comprehensive language list including all Indian languages and major world languages
  const getAllLanguages = () => {
    // Indian Languages (Official and Regional)
    // Includes: Hindi, Bengali, Telugu, Marathi, Tamil, Urdu, Gujarati, Kannada, Malayalam,
    // Punjabi, Odia, Assamese, Maithili, Bhojpuri, Magahi, Nepali, Sinhala, Myanmar,
    // Sindhi, Kashmiri, Sanskrit, Tibetan, Dzongkha, Manipuri, Santali, Konkani,
    // Goan Konkani, Bodo, Dogri, Mizo
    const indianLanguages = [
      'hi', 'bn', 'te', 'mr', 'ta', 'ur', 'gu', 'kn', 'ml', 'pa', 'or', 'as',
      'mai', 'bho', 'mag', 'ne', 'si', 'my', 'sd', 'ks', 'sa', 'bo', 'dz',
      'mni', 'sat', 'gom', 'kok', 'brx', 'doi', 'lus'
    ];

    // Major World Languages
    // Includes: English, Chinese (Simplified & Traditional), Japanese, Korean, Arabic,
    // French, Spanish, German, Italian, Portuguese, Russian, Dutch, Swedish, Danish,
    // Norwegian, Finnish, Polish, Turkish, Hebrew, Thai, Vietnamese, Indonesian,
    // Malay, Filipino, Swahili, Amharic, Hausa, Igbo, Yoruba, Zulu, Xhosa,
    // Afrikaans, Albanian, Azerbaijani, Basque, Belarusian, Bulgarian, Catalan,
    // Croatian, Czech, Estonian, Faroese, Galician, Georgian, Greek, Icelandic,
    // Irish, Latvian, Lithuanian, Macedonian, Maltese, Romanian, Slovak, Slovenian,
    // Ukrainian, Welsh, Armenian, Persian, Pashto, Kurdish, Tajik, Uzbek, Kazakh,
    // Kyrgyz, Mongolian, Lao, Khmer, Javanese, Sundanese, Cebuano, Hawaiian,
    // Malagasy, Samoan, Corsican, Esperanto, Latin, Yiddish, Hmong, Haitian Creole,
    // Hungarian, Serbian
    const worldLanguages = [
      'en', 'zh', 'zh-cn', 'zh-tw', 'ja', 'ko', 'ar', 'fr', 'es', 'de', 'it',
      'pt', 'ru', 'nl', 'sv', 'da', 'no', 'fi', 'pl', 'tr', 'he', 'th', 'vi',
      'id', 'ms', 'tl', 'sw', 'am', 'ha', 'ig', 'yo', 'zu', 'xh', 'st', 'tn',
      'ts', 've', 'nr', 'ss', 'af', 'sq', 'az', 'eu', 'be', 'bg', 'ca', 'hr',
      'cs', 'et', 'fo', 'gl', 'ka', 'el', 'is', 'ga', 'lv', 'lt', 'mk', 'mt',
      'ro', 'sk', 'sl', 'uk', 'cy', 'hy', 'fa', 'ps', 'ku', 'tg', 'uz', 'kk',
      'ky', 'mn', 'lo', 'km', 'jv', 'su', 'ceb', 'haw', 'mg', 'sm', 'co', 'eo',
      'la', 'yi', 'hmn', 'ht', 'hu', 'sr'
    ];

    // Combine and remove duplicates
    const allLanguages = [...new Set([...indianLanguages, ...worldLanguages])];
    return allLanguages.join(',');
  };

  useEffect(() => {
    let mounted = true;

    const initializeGoogleTranslate = () => {
      try {
        if (!mounted) return;

        if (window.google && window.google.translate && window.google.translate.TranslateElement) {
          new window.google.translate.TranslateElement({
            pageLanguage: 'en',
            includedLanguages: getAllLanguages(),
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          }, 'google_translate_element');

          if (mounted) {
            setIsLoaded(true);
            setError(null);
          }
        }
      } catch (err) {
        console.error('Google Translate initialization error:', err);
        if (mounted) {
          setError('Failed to initialize Google Translate');
        }
      }
    };

    // Set up the global callback
    window.googleTranslateElementInit = initializeGoogleTranslate;

    // Check if script is already loaded
    const existingScript = document.querySelector('script[src*="translate.google.com"]');

    if (!existingScript) {
      const script = document.createElement('script');
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      script.defer = true;

      script.onload = () => {
        if (mounted) {
          console.log('Google Translate script loaded successfully');
        }
      };

      script.onerror = () => {
        if (mounted) {
          console.error('Failed to load Google Translate script');
          setError('Failed to load translation service');
        }
      };

      document.head.appendChild(script);
    } else {
      // Script already exists, try to initialize
      if (window.google && window.google.translate) {
        initializeGoogleTranslate();
      }
    }

    // Cleanup function
    return () => {
      mounted = false;
      // Clean up the global callback
      if (window.googleTranslateElementInit === initializeGoogleTranslate) {
        delete window.googleTranslateElementInit;
      }
    };
  }, []);

  if (error) {
    return (
      <div className="google-translate-error">
        Translation unavailable
      </div>
    );
  }

  return (
    <div className="google-translate-container">
      <div id="google_translate_element"></div>
      {!isLoaded && (
        <div className="google-translate-loading">
          Loading translator...
        </div>
      )}
    </div>
  );
};

export default GoogleTranslate;
