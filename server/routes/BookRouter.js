const express = require('express');
const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('../cloudnary');
const { loadModel } = require('../utils/modelLoader');
const { verifyAdmin } = require('../middleware/auth');
require('../utils/envConfig');
const { verifyToken } = require('../middleware/auth');
const cors = require('cors');

app.use(cors({
  origin: ['http://localhost:5173', 'https://s89-akhil-bookaura-3.onrender.com'], // update this
  credentials: true, // only if you're using cookies/sessions
}));


const Book = loadModel('BookModel');
const router = express.Router();

// Multer memory storage
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer setup
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload route
router.post('/upload', verifyAdmin, upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'bookFile', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!req.files?.coverImage || !req.files?.bookFile) {
      return res.status(400).json({ error: 'Cover image and EPUB file are required' });
    }

    const { title, author, description, genre, price, categories } = req.body;

    // Helper to upload buffer to Cloudinary
    const uploadBufferToCloudinary = (buffer, folder, resource_type) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder, resource_type }, (error, result) => {
          if (error) return reject(error);
          resolve(result);
        });
        streamifier.createReadStream(buffer).pipe(stream);
      });
    };

    // Upload both files
    const coverImageResult = await uploadBufferToCloudinary(req.files.coverImage[0].buffer, 'bookstore/coverImages', 'image');
    const bookFileResult = await uploadBufferToCloudinary(req.files.bookFile[0].buffer, 'bookstore/bookFiles', 'raw');

    // Parse categories
    const parsedCategories = categories
      ? typeof categories === 'string'
        ? categories.split(',').map(c => c.trim())
        : categories
      : [];

    // Save book to DB
    const newBook = new Book({
      title,
      author,
      description,
      genre,
      price,
      coverimage: coverImageResult.secure_url,
      url: bookFileResult.secure_url,
      categories: parsedCategories,
    });

    await newBook.save();
    res.status(201).json(newBook);

  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Fetch books
router.get('/getBooks', async (req, res) => {
  try {
    const { category, featured, bestseller, newrelease } = req.query;
    const query = {};
    if (category) query.categories = category;
    if (featured === 'true') query.isFeatured = true;
    if (bestseller === 'true') query.isBestSeller = true;
    if (newrelease === 'true') query.isNewRelease = true;

    const books = await Book.find(query);

    if (!books || books.length === 0) {
      return res.status(404).json({ success: false, message: 'No books found' });
    }

    res.status(200).json({ success: true, data: books });
  } catch (error) {
    console.error('Fetch books error:', error);
    res.status(500).json({ success: false, message: 'Error fetching books', error: error.message });
  }
});

// Fetch book by ID
router.get('/getBook/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    res.status(200).json({ success: true, data: book });
  } catch (error) {
    console.error('Fetch book error:', error);
    res.status(500).json({ success: false, message: 'Error fetching book', error: error.message });
  }
});

app.get('/read/:bookId', async (req, res) => {
  const book = await Book.findById(req.params.bookId);
  const response = await fetch(book.url); // Cloudinary URL
  const buffer = await response.buffer();

  res.set('Content-Type', 'application/epub+zip');
  res.send(buffer);
});



// Additional filters
router.get('/bestsellers', async (_, res) => {
  try {
    const books = await Book.find({ isBestSeller: true });
    res.status(200).json({ success: true, data: books });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error', error: error.message });
  }
});

router.get('/featured', async (_, res) => {
  try {
    const books = await Book.find({ isFeatured: true });
    res.status(200).json({ success: true, data: books });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error', error: error.message });
  }
});

router.get('/newreleases', async (_, res) => {
  try {
    const books = await Book.find({ isNewRelease: true });
    res.status(200).json({ success: true, data: books });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error', error: error.message });
  }
});

module.exports = router;
