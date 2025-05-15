const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../cloudnary');
const { loadModel } = require('../utils/modelLoader');
const Book = loadModel('BookModel');
const verifyToken = require('../middleware/auth');
const streamifier = require('streamifier');
const verifyAdmin = require('../middleware/auth');
const axios = require('axios');

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
  const isPdf = mimetype === 'application/pdf';

  return new Promise((resolve, reject) => {
    // Create a timestamp-based unique ID for the file
    const timestamp = Date.now();
    const uniqueId = `${timestamp}_${Math.floor(Math.random() * 1000)}`;

    const uploadOptions = {
      folder,
      resource_type: isBook ? 'raw' : 'image',
      access_mode: 'public',
      type: 'upload',
      use_filename: false, // Don't use original filename
      unique_filename: true
    };

    // For PDF files, set a specific public_id without extension
    if (isPdf) {
      // Using timestamp as public_id ensures uniqueness
      uploadOptions.public_id = uniqueId;

      // Log the upload options for debugging
      console.log('PDF upload options:', {
        folder,
        public_id: uploadOptions.public_id,
        resource_type: uploadOptions.resource_type
      });
    }

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        console.error('Cloudinary upload error:', error);
        reject(error);
        return;
      }

      if (result) {
        console.log('Cloudinary upload result:', {
          public_id: result.public_id,
          format: result.format,
          resource_type: result.resource_type,
          url: result.url,
          secure_url: result.secure_url
        });

        // For PDF files, ensure the URL doesn't end with .pdf extension
        // This is important for compatibility with the PDF viewer
        if (isPdf && result.secure_url.toLowerCase().endsWith('.pdf')) {
          // Remove the .pdf extension from the URL
          result.secure_url = result.secure_url.slice(0, -4);
          console.log('Modified PDF URL (removed .pdf extension):', result.secure_url);
        }

        // Double-check the URL format
        if (isPdf && !result.secure_url.includes('raw')) {
          console.warn('WARNING: PDF URL does not contain "raw" segment, which may cause issues');
        }

        resolve(result);
      } else {
        console.error('Cloudinary upload failed with no error and no result');
        reject(new Error('Upload failed with no result'));
      }
    });

    // Create a read stream from the buffer and pipe it to the upload stream
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

// Upload Book
router.post('/uploadBook', verifyAdmin, upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'bookFile', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('Processing book upload request');

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

    // Validate required files
    if (!req.files?.coverImage || !req.files?.bookFile) {
      return res.status(400).json({ success: false, message: 'Both cover image and book file are required' });
    }

    // Log file information
    console.log('Cover image:', req.files.coverImage[0].originalname, req.files.coverImage[0].mimetype, req.files.coverImage[0].size);
    console.log('Book file:', req.files.bookFile[0].originalname, req.files.bookFile[0].mimetype, req.files.bookFile[0].size);

    // Check if book file is a PDF
    const isPdf = req.files.bookFile[0].mimetype === 'application/pdf';
    if (isPdf) {
      console.log('Processing PDF file upload to Cloudinary');
    } else {
      console.log('Processing non-PDF book file upload');
    }

    // Upload cover image to Cloudinary
    console.log('Uploading cover image to Cloudinary...');
    const coverImageResult = await uploadToCloudinary(
      req.files.coverImage[0].buffer,
      'bookstore/coverImages',
      req.files.coverImage[0].mimetype
    );
    console.log('Cover image uploaded successfully:', coverImageResult.secure_url);

    // Upload book file to Cloudinary
    console.log('Uploading book file to Cloudinary...');
    const bookFileResult = await uploadToCloudinary(
      req.files.bookFile[0].buffer,
      'bookstore/bookFiles',
      req.files.bookFile[0].mimetype
    );
    console.log('Book file uploaded successfully:', bookFileResult.secure_url);

    // Process categories
    let parsedCategories = [];
    if (categories) {
      try {
        parsedCategories = typeof categories === 'string' ? JSON.parse(categories) : categories;
      } catch (e) {
        parsedCategories = typeof categories === 'string' ? categories.split(',').map(c => c.trim()) : [];
      }
    }
    console.log('Processed categories:', parsedCategories);

    // Create new book document
    const newBook = new Book({
      title,
      author,
      description,
      genre,
      price,
      coverimage: coverImageResult.secure_url,
      url: bookFileResult.secure_url, // This URL should not have .pdf extension for PDFs
      categories: parsedCategories,
      isBestSeller: isBestSeller === 'true' || isBestSeller === true,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      isNewRelease: isNewRelease === 'true' || isNewRelease === true
    });

    // Verify the URL format for PDF files
    if (isPdf) {
      // Double-check that the URL doesn't end with .pdf
      if (newBook.url.toLowerCase().endsWith('.pdf')) {
        console.warn('PDF URL still has .pdf extension, removing it');
        newBook.url = newBook.url.slice(0, -4);
      }
      console.log('Final PDF URL (without .pdf extension):', newBook.url);
    }

    // Save the book to the database
    await newBook.save();
    console.log('Book saved to database with ID:', newBook._id);

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

// Test PDF upload route
router.post('/test-pdf-upload', verifyAdmin, upload.single('pdfFile'), async (req, res) => {
  try {
    console.log('Testing PDF upload to Cloudinary');
    console.log('Request body:', req.body);

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'PDF file is required' });
    }

    // Log file information
    console.log('PDF file details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      encoding: req.file.encoding
    });

    // Check if file is a PDF
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ success: false, message: 'File must be a PDF' });
    }

    // Upload PDF to Cloudinary
    console.log('Uploading PDF to Cloudinary...');
    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      'bookstore/test-pdfs',
      req.file.mimetype
    );

    console.log('PDF uploaded successfully');
    console.log('Original Cloudinary URL:', uploadResult.secure_url);

    // Verify the URL format
    if (uploadResult.secure_url.toLowerCase().endsWith('.pdf')) {
      console.warn('WARNING: URL still has .pdf extension, this should have been removed');
    } else {
      console.log('URL format is correct (no .pdf extension)');
    }

    // Test the URL with the PDF viewer
    console.log('Testing URL with PDF viewer...');

    // Create test URLs for different formats
    const urlWithoutExtension = uploadResult.secure_url;
    const urlWithExtension = `${uploadResult.secure_url}.pdf`;

    // Test both URLs with a HEAD request to see which one works
    let urlWithoutExtensionWorks = false;
    let urlWithExtensionWorks = false;

    try {
      const testWithoutExt = await axios.head(urlWithoutExtension, { timeout: 5000 });
      urlWithoutExtensionWorks = testWithoutExt.status >= 200 && testWithoutExt.status < 300;
      console.log(`URL without extension (${urlWithoutExtension}) test result:`, urlWithoutExtensionWorks ? 'SUCCESS' : 'FAILED');
    } catch (err) {
      console.log(`URL without extension (${urlWithoutExtension}) test failed:`, err.message);
    }

    try {
      const testWithExt = await axios.head(urlWithExtension, { timeout: 5000 });
      urlWithExtensionWorks = testWithExt.status >= 200 && testWithExt.status < 300;
      console.log(`URL with extension (${urlWithExtension}) test result:`, urlWithExtensionWorks ? 'SUCCESS' : 'FAILED');
    } catch (err) {
      console.log(`URL with extension (${urlWithExtension}) test failed:`, err.message);
    }

    // Return both URLs and test results
    res.status(200).json({
      success: true,
      message: 'PDF uploaded successfully',
      url: uploadResult.secure_url,
      urlWithPdfExtension: `${uploadResult.secure_url}.pdf`,
      testResults: {
        urlWithoutExtensionWorks,
        urlWithExtensionWorks,
        recommendedUrl: urlWithoutExtensionWorks ? uploadResult.secure_url : `${uploadResult.secure_url}.pdf`
      },
      cloudinaryData: {
        publicId: uploadResult.public_id,
        format: uploadResult.format,
        resourceType: uploadResult.resource_type,
        secureUrl: uploadResult.secure_url
      }
    });
  } catch (error) {
    console.error('Test PDF upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading test PDF',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
