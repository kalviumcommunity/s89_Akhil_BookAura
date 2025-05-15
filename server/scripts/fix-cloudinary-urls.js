// Script to fix Cloudinary URLs in the database by removing .pdf extension
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { loadModel } = require('./modelHelper');
const User = loadModel('userModel');
const Book = loadModel('BookModel');
const Purchase = loadModel('PurchaseModel');




// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Get MongoDB URI from environment variables
let MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is not defined');
  console.log('Using fallback connection string...');
  // Fallback connection string
  MONGODB_URI = 'mongodb://localhost:27017/bookaura';
}

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function fixCloudinaryUrls() {
  try {
    console.log('=== FIXING CLOUDINARY URLS IN BOOKS COLLECTION ===');
    
    // Find all books with Cloudinary URLs that end with .pdf
    const books = await Book.find({
      url: { $regex: /cloudinary.*raw.*\.pdf$/i }
    });
    
    console.log(`Found ${books.length} books with Cloudinary URLs ending with .pdf`);
    
    let booksFixed = 0;
    
    for (const book of books) {
      console.log(`\nProcessing book: ${book.title}`);
      console.log(`  Original URL: ${book.url}`);
      
      // Remove .pdf extension
      const newUrl = book.url.substring(0, book.url.length - 4);
      console.log(`  New URL: ${newUrl}`);
      
      // Update the book
      book.url = newUrl;
      await book.save();
      booksFixed++;
    }
    
    console.log(`\nFixed ${booksFixed} book URLs in Books collection`);
    
    console.log('\n=== FIXING CLOUDINARY URLS IN USER PURCHASED BOOKS ===');
    
    // Find all users with purchased books
    const users = await User.find({ 'purchasedBooks.0': { $exists: true } });
    console.log(`Found ${users.length} users with purchased books`);
    
    let userBooksFixed = 0;
    
    for (const user of users) {
      console.log(`\nChecking user: ${user.username} (${user.email})`);
      console.log(`Purchased Books: ${user.purchasedBooks.length}`);
      
      let userNeedsUpdate = false;
      
      for (const book of user.purchasedBooks) {
        if (book.url && book.url.includes('cloudinary.com') && 
            book.url.includes('raw') && book.url.toLowerCase().endsWith('.pdf')) {
          console.log(`Found book with .pdf extension: "${book.title}"`);
          console.log(`  Original URL: ${book.url}`);
          
          // Remove .pdf extension
          book.url = book.url.substring(0, book.url.length - 4);
          console.log(`  New URL: ${book.url}`);
          
          userNeedsUpdate = true;
          userBooksFixed++;
        }
      }
      
      if (userNeedsUpdate) {
        await user.save();
        console.log(`Updated URLs for user ${user.username}`);
      } else {
        console.log(`No URLs to fix for user ${user.username}`);
      }
    }
    
    console.log(`\nFixed ${userBooksFixed} book URLs in User Purchased Books`);
    
    console.log('\n=== FIXING CLOUDINARY URLS IN PURCHASE RECORDS ===');
    
    // Find all purchases
    const purchases = await Purchase.find({});
    console.log(`Found ${purchases.length} purchase records`);
    
    let purchaseBooksFixed = 0;
    
    for (const purchase of purchases) {
      console.log(`\nChecking purchase: ${purchase._id}`);
      console.log(`Books in purchase: ${purchase.books.length}`);
      
      let purchaseNeedsUpdate = false;
      
      for (const book of purchase.books) {
        if (book.url && book.url.includes('cloudinary.com') && 
            book.url.includes('raw') && book.url.toLowerCase().endsWith('.pdf')) {
          console.log(`Found book with .pdf extension: "${book.title}"`);
          console.log(`  Original URL: ${book.url}`);
          
          // Remove .pdf extension
          book.url = book.url.substring(0, book.url.length - 4);
          console.log(`  New URL: ${book.url}`);
          
          purchaseNeedsUpdate = true;
          purchaseBooksFixed++;
        }
      }
      
      if (purchaseNeedsUpdate) {
        await purchase.save();
        console.log(`Updated URLs for purchase ${purchase._id}`);
      } else {
        console.log(`No URLs to fix for purchase ${purchase._id}`);
      }
    }
    
    console.log(`\nFixed ${purchaseBooksFixed} book URLs in Purchase Records`);
    
    console.log(`\nTotal URLs fixed: ${booksFixed + userBooksFixed + purchaseBooksFixed}`);
    
  } catch (error) {
    console.error('Error fixing Cloudinary URLs:', error);
  } finally {
    // Close the MongoDB connection
    mongoose.connection.close();
  }
}

// Run the function
fixCloudinaryUrls();
