// Fast Translation Service - Translates entire books in seconds
class FastTranslationService {
  constructor() {
    this.cache = new Map();
    this.isTranslating = false;
    this.abortController = null;
  }

  // Google Translate (fastest, most reliable)
  async translateWithGoogle(texts, targetLang) {
    const results = [];
    const batchSize = 50; // Larger batches for speed
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchPromises = batch.map(async (text) => {
        try {
          const response = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`,
            { signal: this.abortController?.signal }
          );
          const data = await response.json();
          return data?.[0]?.[0]?.[0] || text;
        } catch (error) {
          return text;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }

  // Microsoft Translator (very fast)
  async translateWithMicrosoft(texts, targetLang) {
    try {
      const response = await fetch('https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=' + targetLang, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(texts.map(text => ({ text }))),
        signal: this.abortController?.signal
      });
      
      const data = await response.json();
      return data.map(item => item.translations[0].text);
    } catch (error) {
      console.error('Microsoft Translator error:', error);
      return texts;
    }
  }

  // LibreTranslate (fast and free)
  async translateWithLibre(texts, targetLang) {
    const results = [];
    const batchSize = 20;
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchPromises = batch.map(async (text) => {
        try {
          const response = await fetch('https://libretranslate.de/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              q: text,
              source: 'en',
              target: targetLang,
              format: 'text'
            }),
            signal: this.abortController?.signal
          });
          const data = await response.json();
          return data.translatedText || text;
        } catch (error) {
          return text;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }

  // Instant fallback translations for common words
  getInstantTranslations(texts, targetLang) {
    const translations = {
      'te': {
        'Chapter': 'అధ్యాయం', 'Page': 'పేజీ', 'Book': 'పుస్తకం', 'Story': 'కథ',
        'The': 'ది', 'and': 'మరియు', 'of': 'యొక్క', 'to': 'కు', 'in': 'లో',
        'is': 'ఉంది', 'was': 'ఉంది', 'for': 'కోసం', 'with': 'తో',
        'he': 'అతను', 'she': 'ఆమె', 'they': 'వారు', 'said': 'అన్నారు',
        'time': 'సమయం', 'day': 'రోజు', 'year': 'సంవత్సరం', 'way': 'మార్గం',
        'man': 'మనిషి', 'woman': 'స్త్రీ', 'life': 'జీవితం', 'world': 'ప్రపంచం'
      },
      'ta': {
        'Chapter': 'அத்தியாயம்', 'Page': 'பக்கம்', 'Book': 'புத்தகம்', 'Story': 'கதை',
        'The': 'தி', 'and': 'மற்றும்', 'of': 'இன்', 'to': 'க்கு', 'in': 'இல்',
        'is': 'உள்ளது', 'was': 'இருந்தது', 'for': 'க்காக', 'with': 'உடன்',
        'he': 'அவன்', 'she': 'அவள்', 'they': 'அவர்கள்', 'said': 'என்றார்',
        'time': 'நேரம்', 'day': 'நாள்', 'year': 'ஆண்டு', 'way': 'வழி',
        'man': 'மனிதன்', 'woman': 'பெண்', 'life': 'வாழ்க்கை', 'world': 'உலகம்'
      },
      'hi': {
        'Chapter': 'अध्याय', 'Page': 'पृष्ठ', 'Book': 'किताब', 'Story': 'कहानी',
        'The': 'द', 'and': 'और', 'of': 'का', 'to': 'को', 'in': 'में',
        'is': 'है', 'was': 'था', 'for': 'के लिए', 'with': 'के साथ',
        'he': 'वह', 'she': 'वह', 'they': 'वे', 'said': 'कहा',
        'time': 'समय', 'day': 'दिन', 'year': 'साल', 'way': 'रास्ता',
        'man': 'आदमी', 'woman': 'औरत', 'life': 'जिंदगी', 'world': 'दुनिया'
      },
      'ml': {
        'Chapter': 'അധ്യായം', 'Page': 'പേജ്', 'Book': 'പുസ്തകം', 'Story': 'കഥ',
        'The': 'ദി', 'and': 'ഒപ്പം', 'of': 'യുടെ', 'to': 'ലേക്ക്', 'in': 'ൽ',
        'is': 'ആണ്', 'was': 'ആയിരുന്നു', 'for': 'വേണ്ടി', 'with': 'കൂടെ',
        'he': 'അവൻ', 'she': 'അവൾ', 'they': 'അവർ', 'said': 'പറഞ്ഞു',
        'time': 'സമയം', 'day': 'ദിവസം', 'year': 'വർഷം', 'way': 'വഴി',
        'man': 'മനുഷ്യൻ', 'woman': 'സ്ത്രീ', 'life': 'ജീവിതം', 'world': 'ലോകം'
      }
    };

    return texts.map(text => translations[targetLang]?.[text] || null);
  }

  // Ultra-fast translation with WebWorkers for parallel processing
  async translateFast(texts, targetLang, onProgress) {
    if (this.isTranslating) {
      throw new Error('Translation already in progress');
    }

    this.isTranslating = true;
    this.abortController = new AbortController();

    try {
      console.log(`🚀 Ultra-fast translating ${texts.length} texts to ${targetLang}`);
      const startTime = Date.now();

      // Step 1: Instant translations for common words (0.05 seconds)
      const instantResults = this.getInstantTranslations(texts, targetLang);
      const remainingTexts = [];
      const remainingIndices = [];

      texts.forEach((text, index) => {
        if (!instantResults[index]) {
          remainingTexts.push(text);
          remainingIndices.push(index);
        }
      });

      const instantProgress = Math.round((texts.length - remainingTexts.length) / texts.length * 50);
      onProgress?.(instantProgress);

      if (remainingTexts.length === 0) {
        console.log(`✅ All translations completed instantly!`);
        this.isTranslating = false;
        return instantResults;
      }

      // Step 2: Parallel WebWorker translation for remaining texts
      let apiResults = [];

      if (typeof Worker !== 'undefined') {
        try {
          apiResults = await this.translateWithWorkers(remainingTexts, targetLang, onProgress, instantProgress);
          console.log('✅ Used WebWorkers for parallel translation');
        } catch (error) {
          console.log('⚠️ WebWorkers failed, falling back to direct API');
          apiResults = await this.translateWithGoogle(remainingTexts, targetLang);
        }
      } else {
        // Fallback for environments without WebWorker support
        apiResults = await this.translateWithGoogle(remainingTexts, targetLang);
        console.log('✅ Used direct Google Translate');
      }

      // Step 3: Combine results
      const finalResults = [...instantResults];
      remainingIndices.forEach((originalIndex, i) => {
        finalResults[originalIndex] = apiResults[i] || remainingTexts[i];
      });

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      console.log(`✅ Ultra-fast translation completed in ${duration.toFixed(2)} seconds`);
      onProgress?.(100);

      this.isTranslating = false;
      return finalResults;

    } catch (error) {
      this.isTranslating = false;
      console.error('❌ Fast translation error:', error);
      throw error;
    }
  }

  // WebWorker-based parallel translation
  async translateWithWorkers(texts, targetLang, onProgress, baseProgress = 0) {
    return new Promise((resolve, reject) => {
      const workerCount = Math.min(4, Math.ceil(texts.length / 25)); // Max 4 workers
      const batchSize = Math.ceil(texts.length / workerCount);
      const workers = [];
      const results = new Array(texts.length);
      let completedBatches = 0;

      console.log(`🔧 Using ${workerCount} workers for ${texts.length} texts`);

      // Create workers and assign batches
      for (let i = 0; i < workerCount; i++) {
        const startIndex = i * batchSize;
        const endIndex = Math.min(startIndex + batchSize, texts.length);
        const batch = texts.slice(startIndex, endIndex);

        if (batch.length === 0) continue;

        try {
          const worker = new Worker('/translationWorker.js');
          workers.push(worker);

          worker.onmessage = (e) => {
            const { success, batchId, translations, error } = e.data;

            if (success) {
              // Store results in correct positions
              for (let j = 0; j < translations.length; j++) {
                results[startIndex + j] = translations[j];
              }

              completedBatches++;
              const progress = baseProgress + Math.round((completedBatches / workerCount) * 50);
              onProgress?.(progress);

              // Check if all batches are complete
              if (completedBatches === workerCount) {
                // Cleanup workers
                workers.forEach(w => w.terminate());
                resolve(results.filter(r => r !== undefined));
              }
            } else {
              console.error(`Worker batch ${batchId} failed:`, error);
              // Use original texts for failed batch
              for (let j = 0; j < batch.length; j++) {
                results[startIndex + j] = batch[j];
              }
              completedBatches++;

              if (completedBatches === workerCount) {
                workers.forEach(w => w.terminate());
                resolve(results.filter(r => r !== undefined));
              }
            }
          };

          worker.onerror = (error) => {
            console.error('Worker error:', error);
            // Use original texts for failed worker
            for (let j = 0; j < batch.length; j++) {
              results[startIndex + j] = batch[j];
            }
            completedBatches++;

            if (completedBatches === workerCount) {
              workers.forEach(w => w.terminate());
              resolve(results.filter(r => r !== undefined));
            }
          };

          // Send batch to worker
          worker.postMessage({
            texts: batch,
            targetLang,
            batchId: i
          });

        } catch (error) {
          console.error('Failed to create worker:', error);
          // Fallback: use original texts
          for (let j = 0; j < batch.length; j++) {
            results[startIndex + j] = batch[j];
          }
          completedBatches++;

          if (completedBatches === workerCount) {
            resolve(results.filter(r => r !== undefined));
          }
        }
      }

      // Timeout fallback
      setTimeout(() => {
        if (completedBatches < workerCount) {
          console.log('⏰ Worker timeout, terminating and using available results');
          workers.forEach(w => w.terminate());
          reject(new Error('Translation timeout'));
        }
      }, 10000); // 10 second timeout
    });
  }

  // Cancel ongoing translation
  cancelTranslation() {
    if (this.abortController) {
      this.abortController.abort();
      this.isTranslating = false;
      console.log('🛑 Translation cancelled');
    }
  }

  // Check if translation is in progress
  isTranslationInProgress() {
    return this.isTranslating;
  }

  // Preprocess text for faster translation
  preprocessTexts(texts) {
    return texts
      .filter(text => text && text.trim().length > 1)
      .filter(text => !/^[\d\s\.,;:!?\-'"()]+$/.test(text))
      .map(text => text.trim())
      .filter((text, index, arr) => arr.indexOf(text) === index); // Remove duplicates
  }

  // Get translation statistics
  getStats() {
    return {
      cacheSize: this.cache.size,
      isTranslating: this.isTranslating
    };
  }
}

// Export singleton instance
export default new FastTranslationService();
