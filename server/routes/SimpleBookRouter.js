const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const Book = require('../models/Book');
const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to upload to Cloudinary with optimized settings
const uploadToCloudinary = (buffer, folder, resourceType = 'auto') => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      resource_type: resourceType,
      folder: folder,
      use_filename: true,
      unique_filename: true,
      access_mode: 'public', // Ensure public access
    };

    // Special settings for EPUB files
    if (resourceType === 'raw') {
      uploadOptions.format = 'epub';
      uploadOptions.flags = 'attachment'; // Helps with direct download if needed
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          console.log('Cloudinary upload success:', result.secure_url);
          console.log('Public ID:', result.public_id);
          resolve(result);
        }
      }
    );
    uploadStream.end(buffer);
  });
};

// Upload book route
router.post('/upload', upload.fields([
  { name: 'epub', maxCount: 1 },
  { name: 'coverimage', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('📤 Simple book upload request received');
    console.log('Files:', req.files);
    console.log('Body:', req.body);

    // Check if files are present
    if (!req.files || !req.files.epub || !req.files.coverimage) {
      return res.status(400).json({
        error: 'Both EPUB file and cover image are required'
      });
    }

    const {
      title,
      author,
      description,
      genre,
      price,
      isBestSeller,
      isFeatured,
      isNewRelease
    } = req.body;

    // Debug: Log what we received
    console.log('📋 Status fields received:', {
      isBestSeller,
      isFeatured,
      isNewRelease
    });

    // Validate required fields
    if (!title || !author || !description || !genre || !price) {
      return res.status(400).json({
        error: 'All fields are required: title, author, description, genre, price'
      });
    }

    const epubFile = req.files.epub[0];
    const coverFile = req.files.coverimage[0];

    console.log('📚 Uploading EPUB:', epubFile.originalname);
    console.log('🖼️ Uploading cover:', coverFile.originalname);

    // Upload EPUB to Cloudinary with specific settings for direct access
    const epubResult = await uploadToCloudinary(
      epubFile.buffer,
      'ebooks',
      'raw'
    );

    // Upload cover image to Cloudinary
    const coverResult = await uploadToCloudinary(
      coverFile.buffer,
      'book-covers',
      'image'
    );

    console.log('📚 EPUB uploaded to Cloudinary:', epubResult.secure_url);
    console.log('🖼️ Cover uploaded to Cloudinary:', coverResult.secure_url);

    // Create book in database with direct Cloudinary URLs and status fields
    const newBook = new Book({
      title,
      author,
      description,
      genre,
      price: parseFloat(price),
      epubUrl: epubResult.secure_url, // Direct Cloudinary URL
      url: epubResult.secure_url, // For backward compatibility
      coverimage: coverResult.secure_url, // Direct Cloudinary URL
      cloudinaryPublicId: epubResult.public_id, // Store for future reference
      storageType: 'cloudinary', // Mark as Cloudinary storage
      isBestSeller: isBestSeller === 'true' || isBestSeller === true,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      isNewRelease: isNewRelease === 'true' || isNewRelease === true,
      createdAt: new Date()
    });

    const savedBook = await newBook.save();

    console.log('✅ Book saved successfully:', savedBook.title);

    res.status(201).json({
      success: true,
      message: 'Book uploaded successfully',
      book: savedBook
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      error: 'Failed to upload book: ' + error.message
    });
  }
});

// Get all books
router.get('/', async (req, res) => {
  try {
    console.log('📚 Fetching all books');
    const books = await Book.find().sort({ createdAt: -1 });
    console.log(`✅ Found ${books.length} books`);
    res.json(books);
  } catch (error) {
    console.error('❌ Error fetching books:', error);
    res.status(500).json({
      error: 'Failed to fetch books: ' + error.message
    });
  }
});

// Serve book files (for backward compatibility with existing books)
router.get('/file/:filename', (req, res) => {
  const { filename } = req.params;
  console.log('📁 File request for:', filename);

  // For now, return a placeholder image for missing files
  // This prevents 404 errors and provides a fallback
  const placeholderSvg = `
    <svg width="300" height="400" viewBox="0 0 300 400" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="400" fill="#F0F0F0"/>
      <text x="150" y="200" text-anchor="middle" fill="#666666" font-family="Arial" font-size="18">Book Cover</text>
      <text x="150" y="230" text-anchor="middle" fill="#999999" font-family="Arial" font-size="12">File: ${filename}</text>
    </svg>
  `;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(placeholderSvg);
});

// Get single book by ID
router.get('/:id', async (req, res) => {
  try {
    console.log('📖 Fetching book with ID:', req.params.id);
    const book = await Book.findById(req.params.id);

    if (!book) {
      console.log('❌ Book not found');
      return res.status(404).json({
        error: 'Book not found'
      });
    }

    console.log('✅ Book found:', book.title);
    res.json(book);
  } catch (error) {
    console.error('❌ Error fetching book:', error);
    res.status(500).json({
      error: 'Failed to fetch book: ' + error.message
    });
  }
});

// Delete book by ID
router.delete('/:id', async (req, res) => {
  try {
    console.log('🗑️ Deleting book with ID:', req.params.id);
    const book = await Book.findByIdAndDelete(req.params.id);

    if (!book) {
      return res.status(404).json({
        error: 'Book not found'
      });
    }

    console.log('✅ Book deleted:', book.title);
    res.json({
      success: true,
      message: 'Book deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting book:', error);
    res.status(500).json({
      error: 'Failed to delete book: ' + error.message
    });
  }
});

module.exports = router;
