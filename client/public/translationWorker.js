// Translation Web Worker - For ultra-fast parallel translation
self.onmessage = async function(e) {
  const { texts, targetLang, batchId } = e.data;
  
  try {
    console.log(`🔧 Worker translating batch ${batchId} with ${texts.length} texts`);
    
    // Fast translation function
    const translateBatch = async (textArray, lang) => {
      const results = [];
      
      // Instant translations for common words
      const instantTranslations = {
        'te': {
          'Chapter': 'అధ్యాయం', 'Page': 'పేజీ', 'Book': 'పుస్తకం', 'Story': 'కథ',
          'The': 'ది', 'and': 'మరియు', 'of': 'యొక్క', 'to': 'కు', 'in': 'లో',
          'is': 'ఉంది', 'was': 'ఉంది', 'for': 'కోసం', 'with': 'తో',
          'he': 'అతను', 'she': 'ఆమె', 'they': 'వారు', 'said': 'అన్నారు',
          'time': 'సమయం', 'day': 'రోజు', 'year': 'సంవత్సరం', 'way': 'మార్గం',
          'man': 'మనిషి', 'woman': 'స్త్రీ', 'life': 'జీవితం', 'world': 'ప్రపంచం',
          'love': 'ప్రేమ', 'good': 'మంచి', 'great': 'గొప్ప', 'new': 'కొత్త',
          'first': 'మొదటి', 'last': 'చివరి', 'long': 'పొడవు', 'little': 'చిన్న'
        },
        'ta': {
          'Chapter': 'அத்தியாயம்', 'Page': 'பக்கம்', 'Book': 'புத்தகம்', 'Story': 'கதை',
          'The': 'தி', 'and': 'மற்றும்', 'of': 'இன்', 'to': 'க்கு', 'in': 'இல்',
          'is': 'உள்ளது', 'was': 'இருந்தது', 'for': 'க்காக', 'with': 'உடன்',
          'he': 'அவன்', 'she': 'அவள்', 'they': 'அவர்கள்', 'said': 'என்றார்',
          'time': 'நேரம்', 'day': 'நாள்', 'year': 'ஆண்டு', 'way': 'வழி',
          'man': 'மனிதன்', 'woman': 'பெண்', 'life': 'வாழ்க்கை', 'world': 'உலகம்',
          'love': 'காதல்', 'good': 'நல்ல', 'great': 'பெரிய', 'new': 'புதிய',
          'first': 'முதல்', 'last': 'கடைசி', 'long': 'நீண்ட', 'little': 'சிறிய'
        },
        'hi': {
          'Chapter': 'अध्याय', 'Page': 'पृष्ठ', 'Book': 'किताब', 'Story': 'कहानी',
          'The': 'द', 'and': 'और', 'of': 'का', 'to': 'को', 'in': 'में',
          'is': 'है', 'was': 'था', 'for': 'के लिए', 'with': 'के साथ',
          'he': 'वह', 'she': 'वह', 'they': 'वे', 'said': 'कहा',
          'time': 'समय', 'day': 'दिन', 'year': 'साल', 'way': 'रास्ता',
          'man': 'आदमी', 'woman': 'औरत', 'life': 'जिंदगी', 'world': 'दुनिया',
          'love': 'प्यार', 'good': 'अच्छा', 'great': 'महान', 'new': 'नया',
          'first': 'पहला', 'last': 'अंतिम', 'long': 'लंबा', 'little': 'छोटा'
        },
        'ml': {
          'Chapter': 'അധ്യായം', 'Page': 'പേജ്', 'Book': 'പുസ്തകം', 'Story': 'കഥ',
          'The': 'ദി', 'and': 'ഒപ്പം', 'of': 'യുടെ', 'to': 'ലേക്ക്', 'in': 'ൽ',
          'is': 'ആണ്', 'was': 'ആയിരുന്നു', 'for': 'വേണ്ടി', 'with': 'കൂടെ',
          'he': 'അവൻ', 'she': 'അവൾ', 'they': 'അവർ', 'said': 'പറഞ്ഞു',
          'time': 'സമയം', 'day': 'ദിവസം', 'year': 'വർഷം', 'way': 'വഴി',
          'man': 'മനുഷ്യൻ', 'woman': 'സ്ത്രീ', 'life': 'ജീവിതം', 'world': 'ലോകം',
          'love': 'സ്നേഹം', 'good': 'നല്ല', 'great': 'വലിയ', 'new': 'പുതിയ',
          'first': 'ആദ്യത്തെ', 'last': 'അവസാനത്തെ', 'long': 'നീണ്ട', 'little': 'ചെറിയ'
        }
      };
      
      // Process each text
      for (const text of textArray) {
        // Check instant translations first
        const instant = instantTranslations[lang]?.[text];
        if (instant) {
          results.push(instant);
          continue;
        }
        
        // Try Google Translate API
        try {
          const response = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`
          );
          const data = await response.json();
          const translation = data?.[0]?.[0]?.[0];
          
          if (translation && translation !== text) {
            results.push(translation);
          } else {
            results.push(text);
          }
        } catch (error) {
          // Fallback to original text
          results.push(text);
        }
      }
      
      return results;
    };
    
    // Translate the batch
    const translations = await translateBatch(texts, targetLang);
    
    // Send results back
    self.postMessage({
      success: true,
      batchId,
      translations,
      originalTexts: texts
    });
    
  } catch (error) {
    console.error('Worker translation error:', error);
    self.postMessage({
      success: false,
      batchId,
      error: error.message,
      originalTexts: texts
    });
  }
};
