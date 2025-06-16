import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddProducts.css';
import api from '../services/api';

const AddProducts = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    genre: '',
    price: '',
    categories: '',
    isBestSeller: false,
    isFeatured: false,
    isNewRelease: false
  });
  const [coverImage, setCoverImage] = useState(null);
  const [bookFile, setBookFile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // Check if user is admin on component mount
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setLoading(true);

        const response = await api.get('/router/check-admin');

        if (response.data.isAdmin) {
          setIsAdmin(true);
        } else {
          setError('You do not have admin privileges to access this page');
          setTimeout(() => {
            navigate('/');
          }, 3000);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);

        // Check if it's an authentication error
        if (error.response && error.response.status === 401) {
          setError('You must be logged in to access this page');
          navigate('/login');
        } else {
          setError('Failed to verify admin status. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [navigate]);

  // Available categories
  const availableCategories = [
    'Fiction', 'Mystery', 'Thriller', 'Science Fiction', 'Adventure',
    'Romance', 'Historical Fiction', 'Self-Help', 'Psychology',
    'Wellness', 'Horror', 'Supernatural', 'Business', 'Economics',
    'Finance', 'Fantasy', 'Best Seller', 'Featured', 'New Release'
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleCategoryChange = (category) => {
    setFormData(prevData => {
      // Convert string to array for processing
      const currentCategories = prevData.categories ? prevData.categories.split(',').map(cat => cat.trim()).filter(cat => cat) : [];

      if (currentCategories.includes(category)) {
        // Remove category if already selected
        const updatedCategories = currentCategories.filter(cat => cat !== category);
        return {
          ...prevData,
          categories: updatedCategories.join(', ')
        };
      } else {
        // Add category if not already selected
        const updatedCategories = [...currentCategories, category];
        return {
          ...prevData,
          categories: updatedCategories.join(', ')
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields before submitting
    if (!formData.title || !formData.author || !formData.description || !formData.genre || !formData.price) {
      alert('Please fill in all required fields: Title, Author, Description, Genre, and Price');
      return;
    }

    if (!coverImage || !bookFile) {
      alert('Please select both cover image and EPUB file');
      return;
    }

    // Validate file types
    if (!bookFile.name.toLowerCase().endsWith('.epub')) {
      alert('Please select an EPUB file for the book. Only EPUB format is supported.');
      return;
    }

    if (!coverImage.type.startsWith('image/')) {
      alert('Please select a valid image file for the cover');
      return;
    }

    setUploading(true);
    setError(null);

    console.log('📤 Uploading book with data:');
    console.log('Title:', formData.title);
    console.log('Author:', formData.author);
    console.log('Price:', formData.price);
    console.log('EPUB file:', bookFile.name);
    console.log('Cover image:', coverImage.name);

    const uploadData = new FormData();

    // Add form fields exactly as expected by BookRouter
    uploadData.append('title', formData.title);
    uploadData.append('author', formData.author);
    uploadData.append('description', formData.description);
    uploadData.append('genre', formData.genre);
    uploadData.append('price', formData.price);
    uploadData.append('categories', formData.categories); // Send as string, backend will split
    uploadData.append('isBestSeller', formData.isBestSeller);
    uploadData.append('isFeatured', formData.isFeatured);
    uploadData.append('isNewRelease', formData.isNewRelease);

    // Add files with correct field names for new API
    uploadData.append('coverimage', coverImage);  // Changed from 'coverImage' to 'coverimage'
    uploadData.append('epub', bookFile);          // Changed from 'bookFile' to 'epub'

    // Log what's being sent
    console.log('FormData contents:');
    for (let [key, value] of uploadData.entries()) {
      console.log(`${key}:`, value);
    }

    try {
      const token = localStorage.getItem('authToken');
      console.log('Token:', token);
      if (!token) {
        alert('No token found. Please log in again.');
        return;
      }

      const res = await axios.post('https://s89-akhil-bookaura-3.onrender.com/router/uploadBook', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('✅ Upload successful:', res.data);

      // Show success message with book details
      alert(
        `✅ Book uploaded successfully!\n\n` +
        `Title: ${res.data.title}\n` +
        `Author: ${res.data.author}\n` +
        `Price: ₹${res.data.price}\n\n` +
        `Your book is now available in the marketplace with direct Cloudinary storage for optimal performance!`
      );

      // Reset form after successful upload
      setFormData({
        title: '',
        author: '',
        description: '',
        genre: '',
        price: '',
        categories: '',
        isBestSeller: false,
        isFeatured: false,
        isNewRelease: false
      });
      setCoverImage(null);
      setBookFile(null);

      // Reset file inputs
      const coverInput = document.getElementById('coverImage');
      const bookInput = document.getElementById('bookFile');
      if (coverInput) coverInput.value = '';
      if (bookInput) bookInput.value = '';
    } catch (error) {
      console.error('❌ Upload error:', error);

      if (error.response) {
        // Server responded with a status other than 2xx
        const errorMessage = error.response.data.error || error.response.data.message || 'Failed to upload book';
        setError(errorMessage);

        // Check if it's an authentication error
        if (error.response.status === 401) {
          alert('❌ Authentication error. Please log in again.');
          navigate('/login');
        } else if (error.response.status === 403) {
          alert('❌ You do not have permission to upload books. Admin access required.');
        } else {
          alert(`❌ Upload failed: ${errorMessage}`);
        }
      } else if (error.request) {
        // Request was made but no response received
        const errorMessage = 'No response from server. Please check your internet connection.';
        setError(errorMessage);
        alert(`❌ ${errorMessage}`);
      } else {
        // Something else caused the error
        const errorMessage = error.message || 'An unexpected error occurred.';
        setError(errorMessage);
        alert(`❌ Upload failed: ${errorMessage}`);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="add-product-container">
      <h2>Add New Book</h2>

      {loading ? (
        <div className="loading-message">
          <p>Verifying admin privileges...</p>
        </div>
      ) : error ? (
        <div className="error-message">
          <p>{error}</p>
        </div>
      ) : isAdmin ? (
        <form onSubmit={handleSubmit} className="add-product-form">
        <div className="form-group">
          <label htmlFor="title">Book Title</label>
          <input
            type="text"
            id="title"
            name="title"
            placeholder="Enter book title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="author">Author</label>
          <input
            type="text"
            id="author"
            name="author"
            placeholder="Enter author name"
            value={formData.author}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            placeholder="Enter book description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={5}
          />
        </div>

        <div className="form-group">
          <label htmlFor="genre">Primary Genre</label>
          <select
            id="genre"
            name="genre"
            value={formData.genre}
            onChange={handleChange}
            required
          >
            <option value="">Select a genre</option>
            {availableCategories.slice(0, 16).map((genre, index) => (
              <option key={index} value={genre}>{genre}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="price">Price (₹)</label>
          <input
            type="number"
            id="price"
            name="price"
            placeholder="Enter price"
            value={formData.price}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
          />
        </div>

        <div className="form-group">
          <label>Additional Categories</label>
          <div className="categories-container">
            {availableCategories.slice(0, 16).map((category, index) => (
              <div key={index} className="category-checkbox">
                <input
                  type="checkbox"
                  id={`category-${index}`}
                  checked={formData.categories ? formData.categories.split(',').map(cat => cat.trim()).includes(category) : false}
                  onChange={() => handleCategoryChange(category)}
                />
                <label htmlFor={`category-${index}`}>{category}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Book Status</label>
          <div className="status-options">
            <div className="status-checkbox">
              <input
                type="checkbox"
                id="isBestSeller"
                name="isBestSeller"
                checked={formData.isBestSeller}
                onChange={handleChange}
              />
              <label htmlFor="isBestSeller">Best Seller</label>
            </div>

            <div className="status-checkbox">
              <input
                type="checkbox"
                id="isFeatured"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleChange}
              />
              <label htmlFor="isFeatured">Featured</label>
            </div>

            <div className="status-checkbox">
              <input
                type="checkbox"
                id="isNewRelease"
                name="isNewRelease"
                checked={formData.isNewRelease}
                onChange={handleChange}
              />
              <label htmlFor="isNewRelease">New Release</label>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="coverImage">Cover Image</label>
          <input
            type="file"
            id="coverImage"
            accept="image/*"
            onChange={(e) => setCoverImage(e.target.files[0])}
            required
          />
          <small>Upload a high-quality cover image (JPG, PNG)</small>
          {coverImage && (
            <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#e8f5e8', borderRadius: '4px', fontSize: '14px' }}>
              ✅ Selected: {coverImage.name}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="bookFile">EPUB Book File</label>
          <input
            type="file"
            id="bookFile"
            accept=".epub"
            onChange={(e) => setBookFile(e.target.files[0])}
            required
          />
          <small>Upload the EPUB book file only. Other formats are not supported in the new system.</small>
          {bookFile && (
            <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#e8f5e8', borderRadius: '4px', fontSize: '14px' }}>
              ✅ Selected: {bookFile.name}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="submit-button"
          disabled={uploading}
          style={{
            opacity: uploading ? 0.7 : 1,
            cursor: uploading ? 'not-allowed' : 'pointer'
          }}
        >
          {uploading ? '📤 Uploading...' : '📚 Upload Book'}
        </button>
      </form>
      ) : (
        <div className="unauthorized-message">
          <p>You are not authorized to access this page.</p>
        </div>
      )}
    </div>
  );
};

export default AddProducts;