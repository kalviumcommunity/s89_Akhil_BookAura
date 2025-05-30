const express = require('express');
const multer = require('multer');
const Book = require('../models/Book');

const router = express.Router();

// Memory storage for files
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// In-memory storage for files
const fileStorage = new Map();

// Get all books
router.get('/', async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get books' });
  }
});

// Upload book
router.post('/upload', upload.fields([
  { name: 'epub', maxCount: 1 },
  { name: 'coverimage', maxCount: 1 }
]), async (req, res) => {
  try {
    // Check files
    if (!req.files || !req.files.epub || !req.files.coverimage) {
      return res.status(400).json({ error: 'Please upload both EPUB and cover image' });
    }

    const { title, author, description, genre, categories, isBestSeller, isFeatured, isNewRelease, publishedDate } = req.body;

    // Check required fields
    if (!title || !author || !description || !genre) {
      return res.status(400).json({ error: 'Title, author, description, and genre are required' });
    }

    // Generate unique IDs for files
    const epubId = Date.now() + '_epub';
    const coverId = Date.now() + '_cover';

    // Store files in memory
    fileStorage.set(epubId, {
      buffer: req.files.epub[0].buffer,
      mimetype: req.files.epub[0].mimetype,
      originalname: req.files.epub[0].originalname
    });

    fileStorage.set(coverId, {
      buffer: req.files.coverimage[0].buffer,
      mimetype: req.files.coverimage[0].mimetype,
      originalname: req.files.coverimage[0].originalname
    });

    // Create URLs for the files
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://s89-akhil-bookaura-3.onrender.com'
      : 'http://localhost:5000';
    const epubUrl = `${baseUrl}/api/books/file/${epubId}`;
    const coverUrl = `${baseUrl}/api/books/file/${coverId}`;

    // Save book to database
    const book = new Book({
      title,
      author,
      description,
      genre,
      price: req.body.price ? parseFloat(req.body.price) : 0,
      categories: categories ? categories.split(',').map(cat => cat.trim()) : [],
      isBestSeller: isBestSeller === 'true',
      isFeatured: isFeatured === 'true',
      isNewRelease: isNewRelease === 'true',
      publishedDate: publishedDate ? new Date(publishedDate) : new Date(),
      coverimage: coverUrl,
      url: epubUrl, // This is the main URL field that the model expects
      epubUrl: epubUrl // Keep this for backward compatibility
    });

    await book.save();
    res.json(book);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Serve files from memory
router.get('/file/:id', (req, res) => {
  const fileId = req.params.id;
  const file = fileStorage.get(fileId);

  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Set appropriate headers
  res.set({
    'Content-Type': file.mimetype,
    'Content-Length': file.buffer.length,
    'Cache-Control': 'public, max-age=31536000'
  });

  res.send(file.buffer);
});

// Get single book
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get book' });
  }
});

module.exports = router;
