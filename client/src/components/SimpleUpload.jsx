import React, { useState } from 'react';
import axios from 'axios';

const SimpleUpload = ({ onUploadSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    genre: '',
    price: ''
  });
  const [epubFile, setEpubFile] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (name === 'epub') {
      setEpubFile(files[0]);
    } else if (name === 'cover') {
      setCoverImage(files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.title || !formData.author || !formData.description || !formData.genre || !formData.price) {
      setError('Please fill in all required fields');
      return;
    }

    if (!epubFile) {
      setError('Please select an EPUB file');
      return;
    }

    if (!coverImage) {
      setError('Please select a cover image');
      return;
    }

    if (!epubFile.name.toLowerCase().endsWith('.epub')) {
      setError('Please select a valid EPUB file');
      return;
    }

    setUploading(true);

    try {
      const uploadData = new FormData();

      // Add form fields
      uploadData.append('title', formData.title);
      uploadData.append('author', formData.author);
      uploadData.append('description', formData.description);
      uploadData.append('genre', formData.genre);
      uploadData.append('price', formData.price);

      // Add files
      uploadData.append('epub', epubFile);
      uploadData.append('coverimage', coverImage);

      console.log('📤 Uploading book:', formData.title);

      const response = await axios.post('https://s89-akhil-bookaura-3.onrender.com/api/books/upload', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('✅ Upload successful:', response.data);

      // Reset form
      setFormData({
        title: '',
        author: '',
        description: '',
        genre: '',
        price: ''
      });
      setEpubFile(null);
      setCoverImage(null);

      // Clear file inputs
      document.getElementById('epub-input').value = '';
      document.getElementById('cover-input').value = '';

      if (onUploadSuccess) {
        onUploadSuccess(response.data);
      }

      alert(`✅ Book "${response.data.title}" uploaded successfully!`);

    } catch (error) {
      console.error('❌ Upload failed:', error);
      setError(error.response?.data?.error || error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>📚 Upload EPUB Book</h2>

      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #f5c6cb'
        }}>
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Enter book title"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Author *
          </label>
          <input
            type="text"
            name="author"
            value={formData.author}
            onChange={handleInputChange}
            placeholder="Enter author name"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Enter book description"
            rows={4}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px',
              resize: 'vertical'
            }}
            required
          />
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Genre *
            </label>
            <select
              name="genre"
              value={formData.genre}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
              required
            >
              <option value="">Select Genre</option>
              <option value="Fiction">Fiction</option>
              <option value="Non-fiction">Non-fiction</option>
              <option value="Fantasy">Fantasy</option>
              <option value="Romance">Romance</option>
              <option value="Science Fiction">Science Fiction</option>
              <option value="Mystery">Mystery</option>
              <option value="Biography">Biography</option>
              <option value="Horror">Horror</option>
              <option value="Thriller">Thriller</option>
              <option value="Self-help">Self-help</option>
              <option value="History">History</option>
              <option value="Others">Others</option>
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Price (₹) *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="0.00"
              min="0"
              step="0.01"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
              required
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Cover Image *
          </label>
          <input
            id="cover-input"
            type="file"
            name="cover"
            accept="image/*"
            onChange={handleFileChange}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
            required
          />
          {coverImage && (
            <div style={{ marginTop: '8px', color: '#28a745', fontSize: '14px' }}>
              ✅ Selected: {coverImage.name}
            </div>
          )}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            EPUB File *
          </label>
          <input
            id="epub-input"
            type="file"
            name="epub"
            accept=".epub"
            onChange={handleFileChange}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
            required
          />
          {epubFile && (
            <div style={{ marginTop: '8px', color: '#28a745', fontSize: '14px' }}>
              ✅ Selected: {epubFile.name}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={uploading}
          style={{
            backgroundColor: uploading ? '#6c757d' : '#007bff',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: uploading ? 'not-allowed' : 'pointer',
            marginTop: '10px'
          }}
        >
          {uploading ? '📤 Uploading...' : '📚 Upload Book'}
        </button>
      </form>
    </div>
  );
};

export default SimpleUpload;
