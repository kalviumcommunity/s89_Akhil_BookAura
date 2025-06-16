// Translation Service - Multiple translation providers
class TranslationService {
  constructor() {
    this.cache = new Map();
    this.providers = [
      'mymemory',
      'libretranslate',
      'googletranslate'
    ];
  }

  // Get cached translation
  getCachedTranslation(text, targetLang) {
    const key = `${text}_${targetLang}`;
    return this.cache.get(key);
  }

  // Cache translation
  setCachedTranslation(text, targetLang, translation) {
    const key = `${text}_${targetLang}`;
    this.cache.set(key, translation);
  }

  // MyMemory Translation API (Free)
  async translateWithMyMemory(text, targetLang) {
    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`
      );
      const data = await response.json();
      
      if (data.responseStatus === 200) {
        return data.responseData.translatedText;
      }
      return null;
    } catch (error) {
      console.error('MyMemory translation error:', error);
      return null;
    }
  }

  // LibreTranslate API (Free, self-hosted)
  async translateWithLibreTranslate(text, targetLang) {
    try {
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
      
      const data = await response.json();
      return data.translatedText || null;
    } catch (error) {
      console.error('LibreTranslate translation error:', error);
      return null;
    }
  }

  // Google Translate (using unofficial API)
  async translateWithGoogleTranslate(text, targetLang) {
    try {
      // Using Google Translate unofficial API
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
      );
      const data = await response.json();
      
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        return data[0][0][0];
      }
      return null;
    } catch (error) {
      console.error('Google Translate error:', error);
      return null;
    }
  }

  // Fallback translations for common phrases
  getFallbackTranslation(text, targetLang) {
    const fallbacks = {
      'te': {
        'Chapter': 'అధ్యాయం',
        'Page': 'పేజీ',
        'The': 'ది',
        'and': 'మరియు',
        'of': 'యొక్క',
        'to': 'కు',
        'in': 'లో',
        'is': 'ఉంది',
        'was': 'ఉంది',
        'for': 'కోసం',
        'with': 'తో',
        'he': 'అతను',
        'she': 'ఆమె',
        'they': 'వారు',
        'said': 'అన్నారు'
      },
      'ta': {
        'Chapter': 'அத்தியாயம்',
        'Page': 'பக்கம்',
        'The': 'தி',
        'and': 'மற்றும்',
        'of': 'இன்',
        'to': 'க்கு',
        'in': 'இல்',
        'is': 'உள்ளது',
        'was': 'இருந்தது',
        'for': 'க்காக',
        'with': 'உடன்',
        'he': 'அவன்',
        'she': 'அவள்',
        'they': 'அவர்கள்',
        'said': 'என்றார்'
      },
      'hi': {
        'Chapter': 'अध्याय',
        'Page': 'पृष्ठ',
        'The': 'द',
        'and': 'और',
        'of': 'का',
        'to': 'को',
        'in': 'में',
        'is': 'है',
        'was': 'था',
        'for': 'के लिए',
        'with': 'के साथ',
        'he': 'वह',
        'she': 'वह',
        'they': 'वे',
        'said': 'कहा'
      },
      'ml': {
        'Chapter': 'അധ്യായം',
        'Page': 'പേജ്',
        'The': 'ദി',
        'and': 'ഒപ്പം',
        'of': 'യുടെ',
        'to': 'ലേക്ക്',
        'in': 'ൽ',
        'is': 'ആണ്',
        'was': 'ആയിരുന്നു',
        'for': 'വേണ്ടി',
        'with': 'കൂടെ',
        'he': 'അവൻ',
        'she': 'അവൾ',
        'they': 'അവർ',
        'said': 'പറഞ്ഞു'
      }
    };

    return fallbacks[targetLang]?.[text] || null;
  }

  // Main translation function with multiple fallbacks
  async translateText(text, targetLang) {
    // Return original if English
    if (targetLang === 'en') {
      return text;
    }

    // Check cache first
    const cached = this.getCachedTranslation(text, targetLang);
    if (cached) {
      return cached;
    }

    // Skip very short or non-meaningful text
    if (text.length < 2 || /^\d+$/.test(text) || /^[^\w\s]+$/.test(text)) {
      return text;
    }

    // Try fallback translations for common words
    const fallback = this.getFallbackTranslation(text, targetLang);
    if (fallback) {
      this.setCachedTranslation(text, targetLang, fallback);
      return fallback;
    }

    // Try translation providers in order
    for (const provider of this.providers) {
      try {
        let translation = null;
        
        switch (provider) {
          case 'mymemory':
            translation = await this.translateWithMyMemory(text, targetLang);
            break;
          case 'libretranslate':
            translation = await this.translateWithLibreTranslate(text, targetLang);
            break;
          case 'googletranslate':
            translation = await this.translateWithGoogleTranslate(text, targetLang);
            break;
        }

        if (translation && translation !== text) {
          console.log(`✅ Translated "${text}" to "${translation}" using ${provider}`);
          this.setCachedTranslation(text, targetLang, translation);
          return translation;
        }
      } catch (error) {
        console.error(`Translation provider ${provider} failed:`, error);
        continue;
      }
    }

    // If all providers fail, return original text
    console.log(`⚠️ Translation failed for "${text}", returning original`);
    return text;
  }

  // Batch translation for better performance
  async translateBatch(texts, targetLang) {
    const results = [];
    
    // Process in small batches to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchPromises = batch.map(text => this.translateText(text, targetLang));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache size
  getCacheSize() {
    return this.cache.size;
  }
}

// Export singleton instance
export default new TranslationService();
