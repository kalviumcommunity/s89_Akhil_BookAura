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

// Helper function to upload to Cloudinary
const uploadToCloudinary = (buffer, folder, resourceType = 'auto') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder: folder,
        use_filename: true,
        unique_filename: true
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          console.log('Cloudinary upload success:', result.secure_url);
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

    const { title, author, description, genre, price } = req.body;

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

    // Upload EPUB to Cloudinary
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

    // Create book in database
    const newBook = new Book({
      title,
      author,
      description,
      genre,
      price: parseFloat(price),
      epubUrl: epubResult.secure_url,
      url: epubResult.secure_url, // For backward compatibility
      coverimage: coverResult.secure_url,
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
