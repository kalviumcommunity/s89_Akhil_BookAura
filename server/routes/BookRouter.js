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

    const { title, author, description, genre, price, categories, isBestSeller, isFeatured, isNewRelease, publishedDate } = req.body;

    // Check required fields
    if (!title || !author || !description || !genre || !price) {
      return res.status(400).json({ error: 'Title, author, description, genre, and price are required' });
    }

    // Debug logging
    console.log('Upload request body:', {
      title, author, description, genre, price,
      categories, isBestSeller, isFeatured, isNewRelease, publishedDate
    });

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
    const epubUrl = `https://s89-akhil-bookaura-3.onrender.com/api/books/file/${epubId}`;
    const coverUrl = `https://s89-akhil-bookaura-3.onrender.com/api/books/file/${coverId}`;

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
    console.log('Book saved successfully:', {
      _id: book._id,
      title: book.title,
      author: book.author,
      price: book.price,
      coverimage: book.coverimage,
      url: book.url,
      epubUrl: book.epubUrl
    });
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

  console.log('📁 File request for ID:', fileId);
  console.log('📁 File found in memory:', !!file);
  console.log('📁 Total files in memory:', fileStorage.size);

  if (!file) {
    console.log('❌ File not found in memory, server may have restarted');

    // Return a helpful error response
    return res.status(404).json({
      error: 'File not found in memory',
      message: 'The server may have restarted and cleared the in-memory files. Please upload the book again.',
      fileId: fileId,
      suggestion: 'Upload the book again to restore access'
    });
  }

  console.log('✅ Serving file from memory:', fileId);

  // Set appropriate headers
  res.set({
    'Content-Type': file.mimetype,
    'Content-Length': file.buffer.length,
    'Cache-Control': 'public, max-age=31536000'
  });

  res.send(file.buffer);
});

// Debug endpoint to check memory status
router.get('/debug/memory-status', (req, res) => {
  const memoryFiles = Array.from(fileStorage.keys());
  res.json({
    totalFiles: fileStorage.size,
    fileIds: memoryFiles,
    message: fileStorage.size === 0 ? 'No files in memory - server may have restarted' : 'Files available in memory'
  });
});

// Get single book
router.get('/:id', async (req, res) => {
  try {
    console.log('🔍 Looking for book with ID:', req.params.id);
    const book = await Book.findById(req.params.id);
    if (!book) {
      console.log('❌ Book not found in database:', req.params.id);
      return res.status(404).json({ error: 'Book not found' });
    }
    console.log('✅ Book retrieved from database:', {
      _id: book._id,
      title: book.title,
      coverimage: book.coverimage,
      url: book.url,
      epubUrl: book.epubUrl,
      price: book.price
    });
    res.json(book);
  } catch (err) {
    console.error('💥 Error fetching book:', err);
    res.status(500).json({ error: 'Failed to get book' });
  }
});

module.exports = router;
