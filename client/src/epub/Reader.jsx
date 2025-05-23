// Reader.jsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EpubViewer from './EpubViewer';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ArrowLeft } from 'lucide-react';
import '../pages/EpubViewerPage.css'; // Reuse the CSS from EpubViewerPage

function Reader() {
  const { encodedUrl } = useParams();
  const navigate = useNavigate();

  // Decode the URL parameter
  const epubUrl = decodeURIComponent(encodedUrl);
  console.log("Loading EPUB from URL:", epubUrl);

  const goBack = () => {
    navigate(-1); // Go back to the previous page
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
