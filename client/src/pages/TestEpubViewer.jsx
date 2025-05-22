import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import EpubViewer from '../components/EpubViewer';

const TestEpubViewer = () => {
  // Sample EPUB URL - replace with an actual EPUB URL from your application
  const epubUrl = "https://s3.amazonaws.com/moby-dick/moby-dick.epub";

  return (
    <>
      <Navbar />
      <div style={{
        padding: '120px 20px 60px',
        minHeight: '100vh',
        backgroundColor: '#E6D9CC'
      }}>
        <div style={{
          maxWidth: '1000px',
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
          }}>EPUB Viewer Test</h1>

          <div style={{ height: '700px' }}>
            <EpubViewer epubUrl={epubUrl} />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default TestEpubViewer;
