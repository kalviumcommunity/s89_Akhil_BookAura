// src/pages/Reader.jsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EpubViewer from './EpubViewer';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ArrowLeft } from 'lucide-react';
import '../pages/EpubViewerPage.css';

function Reader() {
  const { encodedUrl } = useParams();
  const navigate = useNavigate();

  const epubUrl = decodeURIComponent(encodedUrl);
  const goBack = () => {
    navigate(-1);
  };

  return (
    <div className="epub-viewer-page">
      <Navbar />
      <div className="epub-viewer-container">
        <div className="epub-header">
          <button className="back-button" onClick={goBack}>
            <ArrowLeft size={20} /> Back to My Books
          </button>
          <h1>EPUB Reader</h1>
        </div>
        <div className="epub-content">
          <EpubViewer epubUrl={epubUrl} />
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Reader;
