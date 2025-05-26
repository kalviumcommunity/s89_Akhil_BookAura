import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SimpleEpubViewer from '../../epub/SimpleEpubViewer';
import './Reader.css';

function Reader() {
  const { bookUrl } = useParams();
  const navigate = useNavigate();
  const [decodedUrl, setDecodedUrl] = useState('');
  const [bookTitle, setBookTitle] = useState('Reading Book');

  useEffect(() => {
    if (bookUrl) {
      // Decode the URL parameter
      const decoded = decodeURIComponent(bookUrl);
      setDecodedUrl(decoded);
      console.log("📖 Reader: Loading book from URL:", decoded);
      
      // Extract book title from URL if possible
      const urlParts = decoded.split('/');
      const fileName = urlParts[urlParts.length - 1];
      setBookTitle(`Reading: ${fileName}`);
    }
  }, [bookUrl]);

  const handleGoBack = () => {
    navigate('/my-books');
  };

  if (!decodedUrl) {
    return (
      <div className="reader-loading">
        <p>Loading book...</p>
      </div>
    );
  }

  return (
    <div className="reader-container">
      <div className="reader-header">
        <button onClick={handleGoBack} className="back-button">
          ← Back to My Books
        </button>
        <h1 className="reader-title">{bookTitle}</h1>
      </div>
      
      <div className="reader-content">
        <SimpleEpubViewer epubUrl={decodedUrl} />
      </div>
    </div>
  );
}

export default Reader;
