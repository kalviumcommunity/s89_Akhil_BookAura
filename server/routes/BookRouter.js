const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../cloudnary');
const Book = require('../model/BookModel');
const verifyToken = require('../middleware/auth');
const streamifier = require('streamifier');
const verifyAdmin = require('../middleware/auth');

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
  const isBook = ['application/pdf', 'application/epub+zip', 'application/x-mobipocket-ebook'].includes(mimetype);

  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      resource_type: isBook ? 'raw' : 'image',
      access_mode: 'public',
      type: 'upload',
      use_filename: true,
      unique_filename: true
    };

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (result) {
        resolve(result);
      } else {
        reject(error);
      }
    });

    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

// Upload Book
router.post('/uploadBook', verifyAdmin, upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'bookFile', maxCount: 1 }
]), async (req, res) => {
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
      return res.status(400).json({ success: false, message: 'Both cover image and book file are required' });
    }

    const coverImageResult = await uploadToCloudinary(
      req.files.coverImage[0].buffer,
      'bookstore/coverImages',
      req.files.coverImage[0].mimetype
    );

    const bookFileResult = await uploadToCloudinary(
      req.files.bookFile[0].buffer,
      'bookstore/bookFiles',
      req.files.bookFile[0].mimetype
    );

    let parsedCategories = [];
    if (categories) {
      try {
        parsedCategories = typeof categories === 'string' ? JSON.parse(categories) : categories;
      } catch (e) {
        parsedCategories = typeof categories === 'string' ? categories.split(',').map(c => c.trim()) : [];
      }
    }

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
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading book',
      error: error.message
    });
  }
});

// Get all books (with filters)
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
      return res.status(404).json({
        success: false,
        message: 'No books found'
      });
    }

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
router.get('/fix-pdf-urls', verifyToken, async (req, res) => {
  try {
    const books = await Book.find({
      url: { $exists: true, $ne: null },
      $expr: {
        $not: { $regexMatch: { input: "$url", regex: /\.pdf$/i } }
      }
    });

    const updatedBooks = [];

    for (const book of books) {
      if (book.url && book.url.includes('cloudinary') && book.url.includes('raw')) {
        const oldUrl = book.url;
        const newUrl = `${oldUrl}.pdf`;

        book.url = newUrl;
        await book.save();

        updatedBooks.push({ id: book._id, title: book.title });
      }
    }

    res.status(200).json({
      success: true,
      message: `Updated ${updatedBooks.length} book URLs`,
      updatedBooks
    });
  } catch (error) {
    console.error('Error fixing PDF URLs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fixing PDF URLs',
      error: error.message
    });
  }
});

module.exports = router;
