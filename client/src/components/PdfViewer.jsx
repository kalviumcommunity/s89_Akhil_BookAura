import React, { useEffect, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import './PdfViewer.css';

// Ensure the worker is correctly set up for your version
const pdfjsVersion = '4.8.69';
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.mjs`;

const PdfViewer = ({ fileUrl }) => {
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); // Initialize to 1 instead of numPages

  const onLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const nextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  useEffect(()=>{
    const keyRight = (e)=>{
      if(e.key === 'ArrowRight'){
        nextPage();
      }
    }
    const keyLeft = (e)=>{
      if(e.key === 'ArrowLeft'){
        prevPage();
      }
    }
    window.addEventListener('keydown',keyRight);
    window.addEventListener('keydown',keyLeft);
    return ()=>{
      window.removeEventListener('keydown',keyRight);
      window.removeEventListener('keydown',keyLeft);
    }
  })

  return (
    <div className="pdf-viewer-container">
      <Document
        file={fileUrl}
        className="pdf-document"
        onLoadSuccess={onLoadSuccess}
        loading="Loading PDF..."
      >
        <div className="page-container">
          <Page
            pageNumber={currentPage}
            className="pdf-page"
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </div>
      </Document>

      <div className="navigation-buttons">
        <button onClick={prevPage} disabled={currentPage <= 1}>
          &lt; Previous
        </button>
        <button onClick={nextPage} disabled={currentPage >= numPages}>
          Next &gt;
        </button>
      </div>

      <div className="page-number">
        Page {currentPage} of {numPages}
      </div>
    </div>
  );
};

export default PdfViewer;
