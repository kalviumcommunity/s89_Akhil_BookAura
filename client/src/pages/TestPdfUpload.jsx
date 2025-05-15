import React, { useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BasicPdfViewer from '../components/BasicPdfViewer';
import ErrorBoundary from '../components/ErrorBoundary';

const TestPdfUpload = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [selectedUrl, setSelectedUrl] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setFile(null);
      setError('Please select a valid PDF file');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a PDF file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('pdfFile', file);

      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('No authentication token found. Please log in.');
        setLoading(false);
        return;
      }

      const response = await axios.post('https://s89-akhil-bookaura-2.onrender.com/router/test-pdf-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Upload response:', response.data);
      setUploadResult(response.data);
      setSelectedUrl(response.data.url); // Default to URL without .pdf extension

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Error uploading PDF');
    } finally {
      setLoading(false);
    }
  };

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
          }}>Test PDF Upload</h1>

          <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="pdfFile" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Select PDF File:
              </label>
              <input
                type="file"
                id="pdfFile"
                accept="application/pdf"
                onChange={handleFileChange}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
              {error && (
                <p style={{ color: 'red', marginTop: '5px' }}>{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !file}
              style={{
                padding: '10px 20px',
                backgroundColor: '#A67C52',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading || !file ? 'not-allowed' : 'pointer',
                opacity: loading || !file ? 0.7 : 1
              }}
            >
              {loading ? 'Uploading...' : 'Upload PDF'}
            </button>
          </form>

          {uploadResult && (
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Upload Result</h2>

              <div style={{
                backgroundColor: '#f5f5f5',
                padding: '15px',
                borderRadius: '4px',
                marginBottom: '20px'
              }}>
                <p><strong>Status:</strong> {uploadResult.success ? 'Success' : 'Failed'}</p>
                <p><strong>Message:</strong> {uploadResult.message}</p>
                <p><strong>URL (without .pdf):</strong> {uploadResult.url}</p>
                <p><strong>URL (with .pdf):</strong> {uploadResult.urlWithPdfExtension}</p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Test PDF Viewer</h3>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                  <button
                    onClick={() => setSelectedUrl(uploadResult.url)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: selectedUrl === uploadResult.url ? '#A67C52' : '#f0f0f0',
                      color: selectedUrl === uploadResult.url ? 'white' : '#333',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Without .pdf extension
                  </button>

                  <button
                    onClick={() => setSelectedUrl(uploadResult.urlWithPdfExtension)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: selectedUrl === uploadResult.urlWithPdfExtension ? '#A67C52' : '#f0f0f0',
                      color: selectedUrl === uploadResult.urlWithPdfExtension ? 'white' : '#333',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    With .pdf extension
                  </button>
                </div>

                {selectedUrl && (
                  <div style={{ height: '600px', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                    <ErrorBoundary showDetails={true}>
                      <BasicPdfViewer key={selectedUrl} fileUrl={selectedUrl} />
                    </ErrorBoundary>
                  </div>
                )}

                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Enhanced Google PDF Viewer with Page Summaries</h3>
                  <p style={{ lineHeight: '1.5', marginBottom: '10px' }}>
                    This PDF is displayed using Google Docs Viewer with enhanced features for a better reading experience.
                  </p>
                  <ul style={{ paddingLeft: '20px', lineHeight: '1.5' }}>
                    <li><strong>Page-by-Page Summaries</strong>: Click the document icon to view an AI-generated summary of the current page</li>
                    <li><strong>Page Navigation</strong>: Navigate between pages directly from the summary panel</li>
                    <li><strong>Text-to-Speech</strong>: Click the speaker icon to have the current page's summary read aloud</li>
                    <li><strong>Dark Mode</strong>: Toggle between light and dark viewing modes for comfortable reading</li>
                    <li><strong>Download & External View</strong>: Options to download or open the PDF in a new tab</li>
                  </ul>
                  <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                    Note: The page summaries are placeholders in this demo. In a production environment, they would be generated by an AI service analyzing the actual content of each page.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default TestPdfUpload;
