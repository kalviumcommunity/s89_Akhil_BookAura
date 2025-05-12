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
    const { url, originalUrl } = req.query;

    console.log('Received signed URL request for:', url);
    if (originalUrl) {
      console.log('Original URL:', originalUrl);
    }

    if (!url) {
      return res.status(400).json({ success: false, message: 'URL parameter is required' });
    }

    // Extract the public ID from the URL
    // Example URL: https://res.cloudinary.com/dg3i8akzq/raw/upload/v1746122082/bookstore/bookFiles/fwwt7lipgzrpfznxebmc.pdf
    // or: https://res.cloudinary.com/dg3i8akzq/raw/upload/v1746792433/bookstore/bookFiles/zspcnbobqoimglk83yz6
    const urlParts = url.split('/');
    const uploadIndex = urlParts.indexOf('upload');

    if (uploadIndex === -1) {
      console.error('Invalid Cloudinary URL format:', url);
      return res.status(400).json({ success: false, message: 'Invalid Cloudinary URL format' });
    }

    // Get the version and folder/filename parts
    const versionPart = urlParts[uploadIndex + 1]; // e.g., v1746122082
    let folderAndFile = urlParts.slice(uploadIndex + 2).join('/'); // e.g., bookstore/bookFiles/fwwt7lipgzrpfznxebmc.pdf

    // Handle URLs with or without file extensions
    let publicId;
    if (folderAndFile.toLowerCase().endsWith('.pdf')) {
      // Remove file extension if present
      publicId = folderAndFile.substring(0, folderAndFile.length - 4);
    } else {
      // No extension, use as is
      publicId = folderAndFile;
    }

    console.log('Generating signed URL for public ID:', publicId);
    console.log('Version part:', versionPart);

    // Verify Cloudinary configuration
    if (!cloudinary.config().cloud_name || !cloudinary.config().api_key || !cloudinary.config().api_secret) {
      console.error('Cloudinary configuration is incomplete');
      return res.status(500).json({
        success: false,
        message: 'Cloudinary configuration is incomplete',
        details: {
          cloud_name: !!cloudinary.config().cloud_name,
          api_key: !!cloudinary.config().api_key,
          api_secret: !!cloudinary.config().api_secret
        }
      });
    }

    // Generate a direct download URL instead of a signed URL
    const downloadUrl = cloudinary.url(publicId, {
      resource_type: 'raw',
      secure: true,
      version: versionPart.replace('v', ''),
      format: 'pdf'
    });

    console.log('Generated download URL:', downloadUrl);

    // Verify the URL is accessible
    try {
      const testResponse = await axios.head(downloadUrl, { timeout: 5000 });
      console.log('URL verification successful, status:', testResponse.status);
    } catch (verifyError) {
      console.error('URL verification failed:', verifyError.message);

      // Try an alternative approach without format
      console.log('Trying alternative URL generation without format');
      const altDownloadUrl = cloudinary.url(publicId, {
        resource_type: 'raw',
        secure: true,
        version: versionPart.replace('v', '')
      });

      console.log('Generated alternative download URL:', altDownloadUrl);

      try {
        const altTestResponse = await axios.head(altDownloadUrl, { timeout: 5000 });
        console.log('Alternative URL verification successful, status:', altTestResponse.status);

        // Use the alternative URL if it works
        res.json({ success: true, signedUrl: altDownloadUrl });
        return;
      } catch (altVerifyError) {
        console.error('Alternative URL verification failed:', altVerifyError.message);
        // Continue with the original URL as a last resort
      }
    }

    res.json({ success: true, signedUrl: downloadUrl });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to generate signed URL',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Simple endpoint to serve a PDF directly - no auth required
router.get('/serve-pdf', async (req, res) => {
  // Set CORS headers to allow any origin
  const origin = req.headers.origin || 'http://localhost:5173';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  console.log('Serve PDF Request:');
  console.log('- URL:', req.url);
  console.log('- Headers:', req.headers);

  try {
    // Use the better placeholder PDF with more information
    const placeholderPath = path.join(__dirname, '../assets/better-placeholder.pdf');
    const fallbackPath = path.join(__dirname, '../assets/placeholder.pdf');
    const defaultPath = path.join(__dirname, '../assets/default.pdf');

    console.log('Checking for PDF files:');
    console.log('- Better placeholder exists:', fs.existsSync(placeholderPath));
    console.log('- Fallback placeholder exists:', fs.existsSync(fallbackPath));
    console.log('- Default PDF exists:', fs.existsSync(defaultPath));

    // Try to find an available PDF
    let pdfPath = null;
    if (fs.existsSync(placeholderPath)) {
      console.log('Using better placeholder PDF');
      pdfPath = placeholderPath;
    } else if (fs.existsSync(fallbackPath)) {
      console.log('Using fallback placeholder PDF');
      pdfPath = fallbackPath;
    } else if (fs.existsSync(defaultPath)) {
      console.log('Using default PDF');
      pdfPath = defaultPath;
    } else {
      console.log('No PDF files found, creating a simple one');
      // If no PDFs are found, create a simple one
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      pdfPath = path.join(tempDir, 'temp-placeholder.pdf');

      // Create a simple text file as a last resort
      fs.writeFileSync(pdfPath, 'Placeholder PDF content');
      console.log('Created temporary PDF at:', pdfPath);
    }

    // Read the PDF file
    const pdfData = fs.readFileSync(pdfPath);

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day

    // Send the PDF data
    return res.send(pdfData);
  } catch (error) {
    console.error('Error serving PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to serve PDF',
      error: error.message
    });
  }
});

// Proxy endpoint to fetch PDF content - no auth required for better compatibility
router.get('/fetch-pdf', async (req, res) => {
  // Set CORS headers to allow specific origin with credentials
  const origin = req.headers.origin || 'http://localhost:5173';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'false'); // Changed to false to avoid CORS issues

  // Add detailed logging
  console.log('PDF Proxy Request:');
  console.log('- URL:', req.url);
  console.log('- Query:', req.query);
  console.log('- Headers:', req.headers);
  try {
    const { url, originalUrl } = req.query;

    console.log('Received fetch PDF request for:', url);
    if (originalUrl) {
      console.log('Original URL:', originalUrl);
    }

    if (!url) {
      return res.status(400).json({ success: false, message: 'URL parameter is required' });
    }

    // Handle direct URLs (non-Cloudinary)
    if (!url.includes('cloudinary') || !url.includes('upload')) {
      console.log('Fetching PDF from direct URL:', url);
      try {
        const response = await axios.get(url, {
          responseType: 'arraybuffer',
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        // Set appropriate headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day

        // Send the PDF data
        return res.send(response.data);
      } catch (directError) {
        console.error('Error fetching PDF from direct URL:', directError);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch PDF from direct URL',
          error: directError.message
        });
      }
    }

    // Extract the public ID from the URL for Cloudinary resources
    const urlParts = url.split('/');
    const uploadIndex = urlParts.indexOf('upload');

    if (uploadIndex === -1) {
      console.error('Invalid Cloudinary URL format:', url);
      return res.status(400).json({ success: false, message: 'Invalid Cloudinary URL format' });
    }

    // Get the version and folder/filename parts
    const versionPart = urlParts[uploadIndex + 1]; // e.g., v1746122082
    let folderAndFile = urlParts.slice(uploadIndex + 2).join('/'); // e.g., bookstore/bookFiles/fwwt7lipgzrpfznxebmc.pdf

    // Handle URLs with or without file extensions
    let publicId;
    if (folderAndFile.toLowerCase().endsWith('.pdf')) {
      // Remove file extension if present
      publicId = folderAndFile.substring(0, folderAndFile.length - 4);
    } else {
      // No extension, use as is
      publicId = folderAndFile;
    }

    console.log('Generating download URL for public ID:', publicId);
    console.log('Version part:', versionPart);

    // Verify Cloudinary configuration
    if (!cloudinary.config().cloud_name || !cloudinary.config().api_key || !cloudinary.config().api_secret) {
      console.error('Cloudinary configuration is incomplete');
      return res.status(500).json({
        success: false,
        message: 'Cloudinary configuration is incomplete'
      });
    }

    // Generate a direct download URL
    const downloadUrl = cloudinary.url(publicId, {
      resource_type: 'raw',
      secure: true,
      version: versionPart.replace('v', ''),
      format: 'pdf'
    });

    console.log('Generated Cloudinary download URL:', downloadUrl);

    // Fetch the PDF using the download URL
    try {
      const response = await axios.get(downloadUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {
          'Accept': 'application/pdf',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      // Set appropriate headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day

      // Send the PDF data
      res.send(response.data);
    } catch (fetchError) {
      console.error('Error fetching PDF from Cloudinary with format:', fetchError);

      // Try an alternative approach without format
      console.log('Trying alternative URL generation without format');
      const altDownloadUrl = cloudinary.url(publicId, {
        resource_type: 'raw',
        secure: true,
        version: versionPart.replace('v', '')
      });

      console.log('Generated alternative download URL:', altDownloadUrl);

      try {
        const altResponse = await axios.get(altDownloadUrl, {
          responseType: 'arraybuffer',
          timeout: 30000,
          headers: {
            'Accept': 'application/pdf',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        // Set appropriate headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day

        // Send the PDF data
        res.send(altResponse.data);
      } catch (altFetchError) {
        console.error('Error fetching PDF from Cloudinary without format:', altFetchError);

        // Try an alternative approach - direct fetch from original URL
        console.log('Trying direct fetch from original URL as fallback');
        try {
          // Use the original URL if provided, otherwise use the current URL
          const directUrl = originalUrl || url;
          const directResponse = await axios.get(directUrl, {
            responseType: 'arraybuffer',
            timeout: 10000
          });

          // Set appropriate headers
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'inline');

          // Send the PDF data
          res.send(directResponse.data);
        } catch (directError) {
          console.error('Fallback direct fetch also failed:', directError);
          return res.status(500).json({
            success: false,
            message: 'Failed to fetch PDF from all attempted methods',
            cloudinaryError: fetchError.message,
            altCloudinaryError: altFetchError.message,
            directError: directError.message
          });
        }
      }
    }
  } catch (error) {
    console.error('Error in fetch-pdf endpoint:', error);
    console.error('Error stack:', error.stack);

    // Log more detailed information for debugging
    console.error('Request URL:', req.originalUrl);
    console.error('Request query:', req.query);
    console.error('Request headers:', req.headers);

    // Send a more detailed error response
    res.status(500).json({
      success: false,
      message: 'Failed to fetch PDF',
      error: error.message,
      details: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
      } : 'No response details available',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Create a directory for cached images if it doesn't exist
const cacheDir = path.join(__dirname, '../cache/images');
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

// Endpoint to serve a placeholder PDF when the actual PDF is not available
router.get('/placeholder-pdf', async (req, res) => {
  try {
    // Use the better placeholder PDF with more information
    const placeholderPath = path.join(__dirname, '../assets/better-placeholder.pdf');
    const fallbackPath = path.join(__dirname, '../assets/placeholder.pdf');

    let pdfPath = placeholderPath;

    // If the better placeholder doesn't exist, fall back to the original
    if (!fs.existsSync(placeholderPath)) {
      console.log('Better placeholder PDF not found, using fallback');
      pdfPath = fallbackPath;

      if (!fs.existsSync(fallbackPath)) {
        console.error('No placeholder PDFs found');
        return res.status(404).json({
          success: false,
          message: 'Placeholder PDF not found'
        });
      }
    }

    const pdfData = fs.readFileSync(pdfPath);

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    // Send the PDF data
    return res.send(pdfData);
  } catch (error) {
    console.error('Error serving placeholder PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to serve placeholder PDF',
      error: error.message
    });
  }
});

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
