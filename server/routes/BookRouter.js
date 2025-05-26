// server/routes/bookRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../cloudnary');
const { loadModel } = require('../utils/modelLoader');
const Book = loadModel('BookModel');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const streamifier = require('streamifier');
const axios = require('axios');

// Load environment variables using our centralized utility
require('../utils/envConfig');

// Memory storage for multer
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'coverImage' && !file.mimetype.startsWith('image/')) {
      return cb(new Error('Cover image must be an image'));
    }
    if (file.fieldname === 'bookFile') {
      const allowed = ['application/pdf', 'application/epub+zip', 'application/x-mobipocket-ebook'];
      if (!allowed.includes(file.mimetype)) {
        return cb(new Error('Book file must be PDF, EPUB, or MOBI'));
      }
    }
    cb(null, true);
  }
});

// Upload helper
const uploadToCloudinary = (fileBuffer, folder, mimetype) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      resource_type: 'raw',
      access_mode: 'public',
      type: 'upload',
      use_filename: false,
      unique_filename: true
    };

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        console.error('Cloudinary upload error:', error);
        reject(error);
        return;
      }
      resolve(result);
    });

    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

// Upload Book
router.post('/uploadBook', verifyToken, verifyAdmin, upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'bookFile', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('Upload request received:');
    console.log('- Body:', req.body);
    console.log('- Files:', req.files ? Object.keys(req.files) : 'No files');

    // Validate files
    if (!req.files?.coverImage || !req.files?.bookFile) {
      return res.status(400).json({ success: false, message: 'Both cover image and book file are required' });
    }

    // Validate required fields
    const { title, author, description, genre, price } = req.body;
    if (!title || !author || !description || !genre || !price) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, author, description, genre, and price are all required',
        received: { title: !!title, author: !!author, description: !!description, genre: !!genre, price: !!price }
      });
    }

    const coverImageResult = await uploadToCloudinary(
      req.files.coverImage[0].buffer,
      'bookstore/coverImages',
      req.files.coverImage[0].mimetype
    );

    const bookFileResult = await uploadToCloudinary(
      req.files.bookFile[0].buffer,
      'ebooks',
      req.files.bookFile[0].mimetype
    );

    // Parse categories if provided
    let parsedCategories = [];
    if (req.body.categories) {
      try {
        parsedCategories = typeof req.body.categories === 'string' ? JSON.parse(req.body.categories) : req.body.categories;
      } catch {
        parsedCategories = req.body.categories.split(',').map(c => c.trim());
      }
    }

    const newBook = new Book({
      title: req.body.title,
      author: req.body.author,
      description: req.body.description,
      genre: req.body.genre,
      price: parseFloat(req.body.price),
      coverimage: coverImageResult.secure_url,
      url: bookFileResult.secure_url,
      categories: parsedCategories,
      isBestSeller: req.body.isBestSeller === 'true' || req.body.isBestSeller === true,
      isFeatured: req.body.isFeatured === 'true' || req.body.isFeatured === true,
      isNewRelease: req.body.isNewRelease === 'true' || req.body.isNewRelease === true
    });

    await newBook.save();
    res.status(201).json({
      success: true,
      message: 'Book uploaded successfully',
      data: newBook
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading book',
      error: error.message
    });
  }
});

// Fetch Books
router.get('/getBooks', async (req, res) => {
  try {
    const books = await Book.find();
    res.status(200).json({
      success: true,
      message: 'Books fetched successfully',
      data: books
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching books',
      error: error.message
    });
  }
});


// Get bestseller books
router.get('/bestsellers', async (req, res) => {
  try {
    const books = await Book.find({ isBestSeller: true });

    res.status(200).json({
      success: true,
      message: 'Bestseller books fetched successfully',
      data: books
    });
  } catch (error) {
    console.error('Error fetching bestseller books:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bestseller books',
      error: error.message
    });
  }
});

// Get featured books
router.get('/featured', async (req, res) => {
  try {
    const books = await Book.find({ isFeatured: true });

    res.status(200).json({
      success: true,
      message: 'Featured books fetched successfully',
      data: books
    });
  } catch (error) {
    console.error('Error fetching featured books:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured books',
      error: error.message
    });
  }
});

// Get new releases
router.get('/newreleases', async (req, res) => {
  try {
    const books = await Book.find({ isNewRelease: true });

    res.status(200).json({
      success: true,
      message: 'New release books fetched successfully',
      data: books
    });
  } catch (error) {
    console.error('Error fetching new release books:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching new release books',
      error: error.message
    });
  }
});

// Fix PDF URLs (for older data)


// Test PDF upload route


module.exports = router;
