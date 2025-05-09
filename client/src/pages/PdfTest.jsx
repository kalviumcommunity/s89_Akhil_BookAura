import React, { useState } from 'react';
import PdfViewer from '../components/PdfViewer';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const PdfTest = () => {
  const [pdfUrl, setPdfUrl] = useState('');
  const [showViewer, setShowViewer] = useState(false);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (pdfUrl) {
      setShowViewer(true);
    }
  };
  
  return (
    <>
      <Navbar />
      <div style={{ 
        minHeight: '100vh', 
        padding: '120px 20px 60px',
        backgroundColor: '#E6D9CC'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
        }}>
          <h1 style={{ 
            fontFamily: 'MightySouly, serif',
            fontSize: '2.5rem',
            color: '#333',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            PDF Viewer Test
          </h1>
          
          <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
            <div style={{ marginBottom: '20px' }}>
              <label 
                htmlFor="pdfUrl" 
                style={{ 
                  display: 'block', 
                  marginBottom: '10px',
                  fontWeight: '500'
                }}
              >
                Enter PDF URL:
              </label>
              <input 
                type="text" 
                id="pdfUrl"
                value={pdfUrl}
                onChange={(e) => setPdfUrl(e.target.value)}
                style={{ 
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '16px'
                }}
                placeholder="https://example.com/sample.pdf"
              />
            </div>
            
            <button 
              type="submit"
              style={{ 
                backgroundColor: '#A67C52',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Load PDF
            </button>
          </form>
          
          {showViewer && (
            <div style={{ 
              height: '800px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <PdfViewer fileUrl={pdfUrl} />
            </div>
          )}
          
          <div style={{ marginTop: '30px' }}>
            <h3>Sample PDFs to Test:</h3>
            <ul>
              <li>
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    setPdfUrl('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
                    setShowViewer(true);
                  }}
                  style={{ color: '#A67C52' }}
                >
                  W3C Sample PDF
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    setPdfUrl('https://www.africau.edu/images/default/sample.pdf');
                    setShowViewer(true);
                  }}
                  style={{ color: '#A67C52' }}
                >
                  Sample PDF with Multiple Pages
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PdfTest;
