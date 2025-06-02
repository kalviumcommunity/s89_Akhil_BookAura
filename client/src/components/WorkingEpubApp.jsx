import React, { useState } from 'react';
import SimpleUpload from './SimpleUpload';
import SimpleBookList from './SimpleBookList';

const WorkingEpubApp = () => {
  const [activeTab, setActiveTab] = useState('books');
  const [refreshBooks, setRefreshBooks] = useState(0);

  const handleUploadSuccess = (newBook) => {
    console.log('✅ Book uploaded successfully:', newBook);
    // Switch to books tab and refresh the list
    setActiveTab('books');
    setRefreshBooks(prev => prev + 1);
  };

  const tabStyle = (isActive) => ({
    padding: '12px 24px',
    border: 'none',
    backgroundColor: isActive ? '#007bff' : '#f8f9fa',
    color: isActive ? 'white' : '#495057',
    cursor: 'pointer',
    borderRadius: '4px 4px 0 0',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'all 0.2s'
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '20px'
        }}>
          <h1 style={{
            margin: '0',
            textAlign: 'center',
            color: '#333',
            fontSize: '28px'
          }}>
            📚 Working EPUB System
          </h1>
          <p style={{
            margin: '8px 0 0 0',
            textAlign: 'center',
            color: '#6c757d',
            fontSize: '16px'
          }}>
            Upload and read EPUB books with ease
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #dee2e6'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          gap: '2px',
          padding: '0 20px'
        }}>
          <button
            onClick={() => setActiveTab('books')}
            style={tabStyle(activeTab === 'books')}
            onMouseEnter={(e) => {
              if (activeTab !== 'books') {
                e.target.style.backgroundColor = '#e9ecef';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'books') {
                e.target.style.backgroundColor = '#f8f9fa';
              }
            }}
          >
            📚 Browse Books
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            style={tabStyle(activeTab === 'upload')}
            onMouseEnter={(e) => {
              if (activeTab !== 'upload') {
                e.target.style.backgroundColor = '#e9ecef';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'upload') {
                e.target.style.backgroundColor = '#f8f9fa';
              }
            }}
          >
            📤 Upload Book
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div style={{
        backgroundColor: 'white',
        minHeight: 'calc(100vh - 140px)'
      }}>
        {activeTab === 'books' && (
          <SimpleBookList key={refreshBooks} />
        )}
        {activeTab === 'upload' && (
          <SimpleUpload onUploadSuccess={handleUploadSuccess} />
        )}
      </div>

      {/* Footer */}
      <div style={{
        backgroundColor: '#343a40',
        color: 'white',
        textAlign: 'center',
        padding: '20px'
      }}>
        <p style={{ margin: '0', fontSize: '14px' }}>
          📚 Working EPUB System • Built with React & react-reader
        </p>
        <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#adb5bd' }}>
          Upload EPUB files and read them instantly with automatic fallback support
        </p>
      </div>
    </div>
  );
};

export default WorkingEpubApp;
