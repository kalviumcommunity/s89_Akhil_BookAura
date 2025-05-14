import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PdfJsViewer from '../components/PdfJsViewer';

const TestPdfJsViewer = () => {
  // Sample PDF URLs for testing
  const pdfUrls = [
    "https://res.cloudinary.com/dg3i8akzq/raw/upload/v1746792433/bookstore/bookFiles/zspcnbobqoimglk83yz6",
    "https://res.cloudinary.com/dg3i8akzq/raw/upload/v1747146328/bookstore/bookFiles/1747146242513",
    "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf" // Public test PDF
  ];

  const [selectedPdfUrl, setSelectedPdfUrl] = useState(pdfUrls[0]);

  return (
    <>
      <Navbar />
      <div style={{
        padding: '120px 20px 60px',
        minHeight: '100vh',
        backgroundColor: '#E6D9CC'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
        }}>
          <h1 style={{
            textAlign: 'center',
            marginBottom: '30px',
            fontFamily: 'MightySouly, serif',
            fontSize: '2.5rem',
            color: '#333'
          }}>PDF.js Viewer Test</h1>

          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
            {pdfUrls.map((url, index) => (
              <button
                key={index}
                onClick={() => setSelectedPdfUrl(url)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: selectedPdfUrl === url ? '#A67C52' : '#f0f0f0',
                  color: selectedPdfUrl === url ? 'white' : '#333',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                PDF {index + 1}
              </button>
            ))}
          </div>

          <div style={{ height: '600px', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
            <PdfJsViewer key={selectedPdfUrl} fileUrl={selectedPdfUrl} />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default TestPdfJsViewer;
