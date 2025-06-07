// NUCLEAR OPTION - Completely hide Google Translate banner
export const hideGoogleTranslateBanner = () => {
  const nukeGoogleElements = () => {
    // Remove all possible Google Translate elements
    const selectors = [
      '.goog-te-banner-frame',
      'iframe.goog-te-banner-frame',
      '.goog-te-banner-frame.skiptranslate',
      '[id^="goog-gt-"]',
      '[class^="goog-te-"]',
      '[class*="goog-te-"]',
      'div[jsaction*="translate"]',
      'body > div[style*="position: fixed"]',
      'body > div[style*="position: sticky"]',
      'body > iframe[style*="position: fixed"]',
      'body > iframe[style*="position: sticky"]'
    ];

    selectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (element) {
            // Multiple destruction methods
            element.remove();
            element.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; height: 0 !important; width: 0 !important; position: absolute !important; top: -9999px !important; left: -9999px !important; z-index: -1 !important; transform: scale(0) !important;';
            
            // Try to remove from parent
            if (element.parentNode) {
              element.parentNode.removeChild(element);
            }
          }
        });
      } catch (e) {
        // Ignore errors, keep trying
      }
    });

    // Force reset body and html styles
    document.body.style.cssText = 'top: 0 !important; position: static !important; margin-top: 0 !important; padding-top: 0 !important;';
    document.documentElement.style.cssText = 'top: 0 !important; position: static !important; margin-top: 0 !important; padding-top: 0 !important;';
  };

  // Immediate removal
  nukeGoogleElements();
  
  // Aggressive repeated removal
  const interval = setInterval(nukeGoogleElements, 50);
  setTimeout(() => clearInterval(interval), 15000);
  
  // Continuous monitoring with MutationObserver
  const observer = new MutationObserver(() => {
    nukeGoogleElements();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class', 'id']
  });
  
  // Keep monitoring for 30 seconds
  setTimeout(() => observer.disconnect(), 30000);
};

// Auto-start on page load
if (typeof window !== 'undefined') {
  // Start immediately
  hideGoogleTranslateBanner();
  
  // Start on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hideGoogleTranslateBanner);
  } else {
    hideGoogleTranslateBanner();
  }
  
  // Start on window load
  window.addEventListener('load', hideGoogleTranslateBanner);
  
  // Start on focus (when user returns to tab)
  window.addEventListener('focus', hideGoogleTranslateBanner);
}
