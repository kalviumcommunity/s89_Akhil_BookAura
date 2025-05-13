const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../cloudnary');
const Book = require('../model/BookModel');
const verifyToken = require('../middleware/auth');
const streamifier = require('streamifier');
const verifyAdmin = require('../middleware/auth');

// Use in-memory storage (no disk write)
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

// Helper to upload a file buffer to Cloudinary
const uploadToCloudinary = (fileBuffer, folder, mimetype) => {
  const isBook = ['application/pdf', 'application/epub+zip', 'application/x-mobipocket-ebook'].includes(mimetype);

  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      resource_type: isBook ? 'raw' : 'auto'
    };

    // For PDFs, set access mode to public and ensure proper format handling
    if (mimetype === 'application/pdf') {
      // Use public access mode for simplicity
      uploadOptions.access_mode = 'public';
      uploadOptions.type = 'upload';

      // Generate a unique public_id with .pdf extension for better compatibility
      const uniqueId = Date.now().toString();
      uploadOptions.public_id = uniqueId;

      // Set the file extension explicitly
      uploadOptions.format = 'pdf';
    }

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (result) {
        // For PDFs, ensure the URL has the correct format
        if (mimetype === 'application/pdf' && !result.secure_url.toLowerCase().endsWith('.pdf')) {
          // Modify the result to include the .pdf extension
          result.secure_url = `${result.secure_url}.pdf`;
        }
        resolve(result);
      } else {
        reject(error);
      }
    });
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

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

    // Upload to Cloudinary
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

    // Parse categories if provided as a string
    let parsedCategories = [];
    if (categories) {
      try {
        parsedCategories = typeof categories === 'string' ? JSON.parse(categories) : categories;
      } catch (e) {
        console.error('Error parsing categories:', e);
        // If parsing fails, try to split by comma
        parsedCategories = typeof categories === 'string' ? categories.split(',').map(c => c.trim()) : [];
      }
    }

    // Process the book file URL to ensure it has the correct format
    let bookFileUrl = bookFileResult.secure_url;

    // For PDF files, ensure the URL ends with .pdf for better compatibility
    if (req.files.bookFile[0].mimetype === 'application/pdf' && !bookFileUrl.toLowerCase().endsWith('.pdf')) {
      console.log('Adding .pdf extension to Cloudinary URL for better compatibility');
      bookFileUrl = `${bookFileUrl}.pdf`;
    }

    // Save book data
    const newBook = new Book({
      title,
      author,
      description,
      genre,
      price,
      coverimage: coverImageResult.secure_url,
      url: bookFileUrl,
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

router.get('/getBooks',async(req,res)=>{
  try {
    const { category, featured, bestseller, newrelease } = req.query;

    // Build query based on parameters
    const query = {};

    if (category) {
      query.categories = category;
    }

    if (featured === 'true') {
      query.isFeatured = true;
    }

    if (bestseller === 'true') {
      query.isBestSeller = true;
    }

    if (newrelease === 'true') {
      query.isNewRelease = true;
    }

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
})

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

// Fix PDF URLs for existing books
router.get('/fix-pdf-urls', verifyToken, async (req, res) => {
  try {
    // Find all books with URLs that don't end with .pdf
    const books = await Book.find({
      url: { $exists: true, $ne: null },
      $expr: {
        $not: { $regexMatch: { input: "$url", regex: /\.pdf$/i } }
      }
    });

    console.log(`Found ${books.length} books with URLs that need fixing`);

    // Update each book
    const updatedBooks = [];
    for (const book of books) {
      if (book.url && book.url.includes('cloudinary') && book.url.includes('raw')) {
        const oldUrl = book.url;
        const newUrl = `${oldUrl}.pdf`;

        console.log(`Updating book "${book.title}" URL:`);
        console.log(`  Old: ${oldUrl}`);
        console.log(`  New: ${newUrl}`);

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
