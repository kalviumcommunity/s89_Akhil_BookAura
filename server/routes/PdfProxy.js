const express = require('express');
const router = express.Router();
const axios = require('axios');
const cloudinary = require('../cloudnary');
const auth = require('../middleware/auth');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Generate a signed URL for Cloudinary resources
router.get('/signed-url', auth, async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ success: false, message: 'URL parameter is required' });
    }

    // Extract the public ID from the URL
    // Example URL: https://res.cloudinary.com/dg3i8akzq/raw/upload/v1746122082/bookstore/bookFiles/fwwt7lipgzrpfznxebmc.pdf
    const urlParts = url.split('/');
    const uploadIndex = urlParts.indexOf('upload');

    if (uploadIndex === -1) {
      return res.status(400).json({ success: false, message: 'Invalid Cloudinary URL format' });
    }

    // Get the version and folder/filename parts
    const versionPart = urlParts[uploadIndex + 1]; // e.g., v1746122082
    const folderAndFile = urlParts.slice(uploadIndex + 2).join('/'); // e.g., bookstore/bookFiles/fwwt7lipgzrpfznxebmc.pdf

    // Remove file extension if present
    const publicId = folderAndFile.split('.')[0]; // e.g., bookstore/bookFiles/fwwt7lipgzrpfznxebmc

    console.log('Generating signed URL for public ID:', publicId);

    // Generate a direct download URL instead of a signed URL
    const downloadUrl = cloudinary.url(publicId, {
      resource_type: 'raw',
      secure: true,
      version: versionPart.replace('v', ''),
      format: 'pdf'
    });

    res.json({ success: true, signedUrl: downloadUrl });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    res.status(500).json({ success: false, message: 'Failed to generate signed URL', error: error.message });
  }
});

// Proxy endpoint to fetch PDF content
router.get('/fetch-pdf', auth, async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ success: false, message: 'URL parameter is required' });
    }

    // Extract the public ID from the URL
    const urlParts = url.split('/');
    const uploadIndex = urlParts.indexOf('upload');

    if (uploadIndex === -1) {
      return res.status(400).json({ success: false, message: 'Invalid Cloudinary URL format' });
    }

    // Get the version and folder/filename parts
    const versionPart = urlParts[uploadIndex + 1]; // e.g., v1746122082
    const folderAndFile = urlParts.slice(uploadIndex + 2).join('/'); // e.g., bookstore/bookFiles/fwwt7lipgzrpfznxebmc.pdf

    // Remove file extension if present
    const publicId = folderAndFile.split('.')[0]; // e.g., bookstore/bookFiles/fwwt7lipgzrpfznxebmc

    console.log('Generating download URL for public ID:', publicId);

    // Generate a direct download URL
    const downloadUrl = cloudinary.url(publicId, {
      resource_type: 'raw',
      secure: true,
      version: versionPart.replace('v', ''),
      format: 'pdf'
    });

    // Fetch the PDF using the download URL
    const response = await axios.get(downloadUrl, {
      responseType: 'arraybuffer'
    });

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');

    // Send the PDF data
    res.send(response.data);
  } catch (error) {
    console.error('Error fetching PDF:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch PDF', error: error.message });
  }
});

// Create a directory for cached images if it doesn't exist
const cacheDir = path.join(__dirname, '../cache/images');
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

// Image proxy endpoint - no auth required for better performance
router.get('/image-proxy', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ success: false, message: 'URL parameter is required' });
    }

    // Create a unique filename based on the URL
    const urlHash = Buffer.from(url).toString('base64').replace(/[/+=]/g, '_');
    const cachedImagePath = path.join(cacheDir, `${urlHash}.jpg`);

    // Check if the image is already cached
    if (fs.existsSync(cachedImagePath)) {
      console.log('Serving cached image for:', url);
      const imageStream = fs.createReadStream(cachedImagePath);
      res.setHeader('Content-Type', 'image/jpeg');
      return imageStream.pipe(res);
    }

    console.log('Fetching image from:', url);

    // Fetch the image
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.goodreads.com/'
      }
    });

    // Cache the image
    fs.writeFileSync(cachedImagePath, response.data);

    // Set appropriate headers
    res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    // Send the image data
    res.send(response.data);
  } catch (error) {
    console.error('Error proxying image:', error);

    // Serve a default image if the fetch fails
    try {
      const defaultImagePath = path.join(__dirname, '../assets/default-book-cover.jpg');
      if (fs.existsSync(defaultImagePath)) {
        const imageStream = fs.createReadStream(defaultImagePath);
        res.setHeader('Content-Type', 'image/jpeg');
        return imageStream.pipe(res);
      }
    } catch (fallbackError) {
      console.error('Error serving default image:', fallbackError);
    }

    res.status(500).json({ success: false, message: 'Failed to fetch image', error: error.message });
  }
});

// Upload an image to Cloudinary
router.post('/upload-image', auth, async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'Image URL is required' });
    }

    // Fetch the image
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.goodreads.com/'
      }
    });

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'bookstore/covers',
          public_id: `cover_${uuidv4()}`,
          resource_type: 'image'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(response.data);
    });

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: result.secure_url
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ success: false, message: 'Failed to upload image', error: error.message });
  }
});

module.exports = router;
