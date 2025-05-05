const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../cloudnary');
const Book = require('../model/BookModel');
const verifyToken = require('../middleware/auth');
const streamifier = require('streamifier');

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
    const stream = cloudinary.uploader.upload_stream({
      folder,
      resource_type: isBook ? 'raw' : 'auto'
    }, (error, result) => {
      if (result) resolve(result);
      else reject(error);
    });
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

router.post('/uploadBook', upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'bookFile', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, author, description, genre, price } = req.body;

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

    // Save book data
    const newBook = new Book({
      title,
      author,
      description,
      genre,
      price,
      coverimage: coverImageResult.secure_url,
      url: bookFileResult.secure_url
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
    const books = await Book.find();
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

module.exports = router;
