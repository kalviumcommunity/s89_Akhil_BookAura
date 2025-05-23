const express = require('express');
const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('../cloudnary');
const { loadModel } = require('../utils/modelLoader');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
require('../utils/envConfig');

const Book = loadModel('BookModel');
const router = express.Router();

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'coverImage' && !file.mimetype.startsWith('image/')) {
      return cb(new Error('Cover image must be an image'));
    }
    if (file.fieldname === 'bookFile' && file.mimetype !== 'application/epub+zip') {
      return cb(new Error('Book file must be an EPUB'));
    }
    cb(null, true);
  }
});

// Cloudinary upload helper
const uploadToCloudinary = (fileBuffer, folder, mimetype) => {
  const isEpub = mimetype === 'application/epub+zip';
  const timestamp = Date.now();
  const uniqueId = `${timestamp}_${Math.floor(Math.random() * 1000)}`;

  const uploadOptions = {
    folder,
    resource_type: isEpub ? 'raw' : 'image',
    public_id: uniqueId,
    use_filename: false,
    unique_filename: true
  };

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });

    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

// Upload route (EPUB only)
router.post(
  '/uploadBook',
  verifyAdmin,
  upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'bookFile', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const {
        title,
        author,
        description,
        genre,
        price,
        categories,
        isBestSeller,
        isFeatured,
        isNewRelease
      } = req.body;

      if (!req.files?.coverImage || !req.files?.bookFile) {
        return res.status(400).json({ success: false, message: 'Both cover image and EPUB file are required' });
      }

      // Upload cover image
      const coverImageResult = await uploadToCloudinary(
        req.files.coverImage[0].buffer,
        'bookstore/coverImages',
        req.files.coverImage[0].mimetype
      );

      // Upload EPUB file
      const bookFileResult = await uploadToCloudinary(
        req.files.bookFile[0].buffer,
        'bookstore/bookFiles',
        req.files.bookFile[0].mimetype
      );

      // Parse categories
      let parsedCategories = [];
      if (categories) {
        try {
          parsedCategories = typeof categories === 'string' ? JSON.parse(categories) : categories;
        } catch {
          parsedCategories = categories.split(',').map(c => c.trim());
        }
      }

      // Save book
      const newBook = new Book({
        title,
        author,
        description,
        genre,
        price,
        coverimage: coverImageResult.secure_url,
        url: bookFileResult.secure_url,
        categories: parsedCategories,
        isBestSeller: isBestSeller === 'true' || isBestSeller === true,
        isFeatured: isFeatured === 'true' || isFeatured === true,
        isNewRelease: isNewRelease === 'true' || isNewRelease === true
      });

      await newBook.save();

      res.status(201).json({
        success: true,
        message: 'Book uploaded successfully',
        data: newBook
      });
    } catch (error) {
      console.error('EPUB Upload Error:', error);
      res.status(500).json({
        success: false,
        message: 'Error uploading book',
        error: error.message
      });
    }
  }
);

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
