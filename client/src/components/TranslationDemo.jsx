// Translation Demo Component - Shows how translation works
import React, { useState } from 'react';
import { Globe, Info, ExternalLink } from 'lucide-react';

const TranslationDemo = () => {
  const [showDemo, setShowDemo] = useState(false);

  const demoTranslations = {
    'te': {
      title: 'పుస్తక అరా - మీ డిజిటల్ లైబ్రరీ',
      text: 'విజయం సాధించాలంటే మీరు చదవాలి',
      description: 'మా ఎడిటర్లతో పబ్లిక్ డొమైన్ పుస్తకాల మా కేటలాగ్‌ను అన్వేషించండి'
    },
    'ta': {
      title: 'புக் ஆரா - உங்கள் டிஜிட்டல் நூலகம்',
      text: 'வெற்றி பெற நீங்கள் படிக்க வேண்டும்',
      description: 'எங்கள் ஆசிரியர்களுடன் பொது டொமைன் புத்தகங்களின் எங்கள் பட்டியலை ஆராயுங்கள்'
    },
    'hi': {
      title: 'बुक आरा - आपकी डिजिटल लाइब्रेरी',
      text: 'सफल होने के लिए आपको पढ़ना होगा',
      description: 'हमारे संपादकों के साथ सार्वजनिक डोमेन पुस्तकों के हमारे कैटलॉग का अन्वेषण करें'
    },
    'ml': {
      title: 'ബുക്ക് ആര - നിങ്ങളുടെ ഡിജിറ്റൽ ലൈബ്രറി',
      text: 'വിജയിക്കാൻ നിങ്ങൾ വായിക്കണം',
      description: 'ഞങ്ങളുടെ എഡിറ്റർമാരുമായി പബ്ലിക് ഡൊമെയ്ൻ പുസ്തകങ്ങളുടെ ഞങ്ങളുടെ കാറ്റലോഗ് പര്യവേക്ഷണം ചെയ്യുക'
    },
    'es': {
      title: 'Book Aura - Tu Biblioteca Digital',
      text: 'Para tener éxito debes leer',
      description: 'Explora nuestro catálogo de libros de dominio público con nuestros editores'
    },
    'fr': {
      title: 'Book Aura - Votre Bibliothèque Numérique',
      text: 'Pour réussir, vous devez lire',
      description: 'Explorez notre catalogue de livres du domaine public avec nos éditeurs'
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      right: '20px',
      zIndex: 999,
      maxWidth: '300px'
    }}>
      {/* Demo Toggle Button */}
      <button
        onClick={() => setShowDemo(!showDemo)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          backgroundColor: '#17a2b8',
          color: 'white',
          border: 'none',
          borderRadius: '20px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: '500',
          boxShadow: '0 2px 10px rgba(23, 162, 184, 0.3)',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 4px 15px rgba(23, 162, 184, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 2px 10px rgba(23, 162, 184, 0.3)';
        }}
      >
        <Info size={14} />
        <span>Translation Demo</span>
      </button>

      {/* Demo Panel */}
      {showDemo && (
        <div style={{
          position: 'absolute',
          bottom: '50px',
          right: '0',
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: '12px',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
          width: '350px',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px',
            background: 'linear-gradient(135deg, #17a2b8, #138496)',
            color: 'white',
            borderRadius: '12px 12px 0 0',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={16} />
              <span>Translation Preview</span>
            </div>
            <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.9 }}>
              How your site will look when translated
            </div>
          </div>

          {/* Demo Content */}
          <div style={{ padding: '16px' }}>
            <div style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#666',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <ExternalLink size={14} />
              <span>In production, clicking a language opens the translated page in a new tab</span>
            </div>

            {Object.entries(demoTranslations).map(([code, translation]) => (
              <div key={code} style={{
                marginBottom: '16px',
                padding: '12px',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                backgroundColor: '#fff'
              }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#A67C52',
                  marginBottom: '8px'
                }}>
                  {code.toUpperCase()} - {
                    code === 'te' ? 'Telugu' :
                    code === 'ta' ? 'Tamil' :
                    code === 'hi' ? 'Hindi' :
                    code === 'ml' ? 'Malayalam' :
                    code === 'es' ? 'Spanish' :
                    code === 'fr' ? 'French' : ''
                  }
                </div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#333',
                  marginBottom: '4px'
                }}>
                  {translation.title}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#666',
                  marginBottom: '4px'
                }}>
                  {translation.text}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: '#888'
                }}>
                  {translation.description}
                </div>
              </div>
            ))}

            <div style={{
              padding: '12px',
              backgroundColor: '#d4edda',
              border: '1px solid #c3e6cb',
              borderRadius: '8px',
              fontSize: '11px',
              color: '#155724'
            }}>
              <strong>✅ Production Features:</strong>
              <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                <li>Full page translation</li>
                <li>35+ languages supported</li>
                <li>Opens in new tab</li>
                <li>Preserves original page</li>
                <li>Works with all content</li>
              </ul>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={() => setShowDemo(false)}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              fontSize: '14px',
              cursor: 'pointer',
              color: 'white'
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default TranslationDemo;
