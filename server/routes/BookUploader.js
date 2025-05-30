const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const Book = require('../models/Book');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();
const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Configure multer for multiple files
const uploadFields = upload.fields([
  { name: 'epub', maxCount: 1 },
  { name: 'coverimage', maxCount: 1 }
]);
console.log("Cloud name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("API Key:", process.env.CLOUDINARY_API_KEY);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
router.post('/upload', uploadFields, async (req, res) => {
  try {
    if (!req.files || !req.files.epub || !req.files.coverimage) {
      return res.status(400).json({ error: 'Both EPUB file and cover image are required' });
    }

    // Extract all required fields from request body
    const {
      title,
      author,
      description,
      genre,
      categories,
      isBestSeller,
      isFeatured,
      isNewRelease,
      publishedDate
    } = req.body;

    // Validate required fields
    if (!title || !author || !description || !genre) {
      return res.status(400).json({
        error: 'Missing required fields: title, author, description, genre'
      });
    }

    const epubFile = req.files.epub[0];
    const coverFile = req.files.coverimage[0];

    console.log('Uploading EPUB file:', epubFile.path);
    console.log('Uploading cover image:', coverFile.path);

    // Upload EPUB file to Cloudinary
    const epubResult = await cloudinary.uploader.upload(epubFile.path, {
      resource_type: 'raw',
      folder: 'ebooks'
    });
    console.log('EPUB upload result:', epubResult);

    // Upload cover image to Cloudinary
    const coverResult = await cloudinary.uploader.upload(coverFile.path, {
      resource_type: 'image',
      folder: 'book-covers'
    });
    console.log('Cover image upload result:', coverResult);

    // Clean up temporary files
    fs.unlinkSync(epubFile.path);
    fs.unlinkSync(coverFile.path);

    // Create book with all fields
    const bookData = {
      title,
      author,
      description,
      genre,
      coverimage: coverResult.secure_url,
      url: epubResult.secure_url, // The book URL is the EPUB file URL
      epubUrl: epubResult.secure_url // Keep for backward compatibility
    };

    // Add optional fields if provided
    if (categories) {
      bookData.categories = Array.isArray(categories) ? categories : categories.split(',').map(cat => cat.trim());
    }
    if (isBestSeller !== undefined) {
      bookData.isBestSeller = isBestSeller === 'true' || isBestSeller === true;
    }
    if (isFeatured !== undefined) {
      bookData.isFeatured = isFeatured === 'true' || isFeatured === true;
    }
    if (isNewRelease !== undefined) {
      bookData.isNewRelease = isNewRelease === 'true' || isNewRelease === true;
    }
    if (publishedDate) {
      bookData.publishedDate = new Date(publishedDate);
    }

    const book = new Book(bookData);
    await book.save();
    res.status(201).json(book);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});
// Express route example
// server/routes/bookRoutes.js (or similar)
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json(book);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/', async (req, res) => {
  const books = await Book.find().sort({ createdAt: -1 });
  res.json(books);
});
module.exports = router;
