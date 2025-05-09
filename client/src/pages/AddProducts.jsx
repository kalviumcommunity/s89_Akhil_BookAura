import React, { useState } from 'react';
import axios from 'axios';
import './AddProducts.css';

const AddProducts = () => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    genre: '',
    price: '',
    categories: [],
    isBestSeller: false,
    isFeatured: false,
    isNewRelease: false
  });
  const [coverImage, setCoverImage] = useState(null);
  const [bookFile, setBookFile] = useState(null);

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
      const updatedCategories = [...prevData.categories];

      if (updatedCategories.includes(category)) {
        // Remove category if already selected
        return {
          ...prevData,
          categories: updatedCategories.filter(cat => cat !== category)
        };
      } else {
        // Add category if not already selected
        return {
          ...prevData,
          categories: [...updatedCategories, category]
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const uploadData = new FormData();

    // Add basic form fields
    for (let key in formData) {
      if (key === 'categories') {
        // Convert categories array to JSON string
        uploadData.append(key, JSON.stringify(formData[key]));
      } else {
        uploadData.append(key, formData[key]);
      }
    }

    // Add files
    uploadData.append('coverImage', coverImage);
    uploadData.append('bookFile', bookFile);

    try {
      const token = localStorage.getItem('authToken');
      console.log('Token:', token);
      if (!token) {
        alert('No token found. Please log in again.');
        return;
      }

      const res = await axios.post('http://localhost:5000/router/uploadBook', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      console.log(res.data);
      alert('Upload successful!');
    } catch (error) {
      if (error.response) {
        // Server responded with a status other than 2xx
        console.error('Server Error:', error.response.data);
        alert(`Error: ${error.response.data.message || 'Failed to upload book'}\nDetails: ${error.response.data.error || ''}`);
      } else if (error.request) {
        // Request was made but no response received
        console.error('No Response:', error.request);
        alert('No response from server. Please try again later.');
      } else {
        // Something else caused the error
        console.error('Error:', error.message);
        alert('An error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="add-product-container">
      <h2>Add New Book</h2>
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
                  checked={formData.categories.includes(category)}
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
        </div>

        <div className="form-group">
          <label htmlFor="bookFile">Book File</label>
          <input
            type="file"
            id="bookFile"
            accept=".pdf,.epub,.mobi"
            onChange={(e) => setBookFile(e.target.files[0])}
            required
          />
          <small>Upload the book file (PDF, EPUB, or MOBI)</small>
        </div>

        <button type="submit" className="submit-button">Upload Book</button>
      </form>
    </div>
  );
};

export default AddProducts;