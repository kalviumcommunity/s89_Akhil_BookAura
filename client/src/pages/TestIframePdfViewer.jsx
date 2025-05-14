import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import IframePdfViewer from '../components/IframePdfViewer';

const TestIframePdfViewer = () => {
  // Make sure the URL doesn't have a .pdf extension for Cloudinary URLs
  const pdfUrl = "https://res.cloudinary.com/dg3i8akzq/raw/upload/v1746792433/bookstore/bookFiles/zspcnbobqoimglk83yz6";

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
          }}>Iframe PDF Viewer Test</h1>

          <div style={{ height: '600px', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
            <IframePdfViewer fileUrl={pdfUrl} />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default TestIframePdfViewer;
