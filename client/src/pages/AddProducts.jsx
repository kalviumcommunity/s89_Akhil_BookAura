import React, { useState } from 'react';
import axios from 'axios';

const AddProducts = () => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    genre: '',
    price: ''
  });
  const [coverImage, setCoverImage] = useState(null);
  const [bookFile, setBookFile] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const uploadData = new FormData();
    for (let key in formData) {
      uploadData.append(key, formData[key]);
    }
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
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: 400, gap: 10 }}>
      <input type="text" name="title" placeholder="Title" onChange={handleChange} required />
      <input type="text" name="author" placeholder="Author" onChange={handleChange} required />
      <textarea name="description" placeholder="Description" onChange={handleChange} required />
      <input type="text" name="genre" placeholder="Genre" onChange={handleChange} required />
      <input type="number" name="price" placeholder="Price" onChange={handleChange} required />
      <input type="file" accept="image/*" onChange={(e) => setCoverImage(e.target.files[0])} required />
      <input type="file" accept=".pdf,.epub,.mobi" onChange={(e) => setBookFile(e.target.files[0])} required />
      <button type="submit">Upload Book</button>
    </form>
  );
};

export default AddProducts;