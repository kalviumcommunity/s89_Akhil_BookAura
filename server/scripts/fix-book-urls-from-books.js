// Script to fix placeholder URLs in user's purchased books by fetching correct URLs from Book collection
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../model/userModel');
const Book = require('../model/BookModel');
const Purchase = require('../model/PurchaseModel');

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

async function fixBookUrls() {
  try {
    console.log('=== FIXING PLACEHOLDER URLS IN USER PURCHASED BOOKS ===');
    
    // Find all users with purchased books
    const users = await User.find({ 'purchasedBooks.0': { $exists: true } });
    console.log(`Found ${users.length} users with purchased books`);
    
    // Get all books from the Book collection for quick lookup
    const books = await Book.find({});
    console.log(`Found ${books.length} books in the Book collection`);
    
    // Create a map of book IDs to their URLs for quick lookup
    const bookUrlMap = new Map();
    for (const book of books) {
      // Store the direct Cloudinary URL without .pdf extension
      let url = book.url;
      if (url && url.includes('cloudinary.com') && url.includes('raw') && url.toLowerCase().endsWith('.pdf')) {
        url = url.substring(0, url.length - 4);
      }
      bookUrlMap.set(book._id.toString(), {
        url: url,
        title: book.title
      });
    }
    
    let totalBooksFixed = 0;
    
    for (const user of users) {
      console.log(`\nChecking user: ${user.username} (${user.email})`);
      console.log(`Purchased Books: ${user.purchasedBooks.length}`);
      
      let userBooksFixed = 0;
      let userNeedsUpdate = false;
      
      for (const purchasedBook of user.purchasedBooks) {
        const bookId = purchasedBook.bookId.toString();
        const bookInfo = bookUrlMap.get(bookId);
        
        // Check if this book has a placeholder URL
        if ((!purchasedBook.url || 
             purchasedBook.url === 'placeholder' || 
             purchasedBook.url.includes('placeholder.url')) && 
            bookInfo) {
          
          console.log(`Fixing placeholder URL for book "${purchasedBook.title}" (${bookId})`);
          console.log(`  Old URL: ${purchasedBook.url || 'MISSING'}`);
          console.log(`  New URL: ${bookInfo.url}`);
          
          // Update the URL
          purchasedBook.url = bookInfo.url;
          userBooksFixed++;
          userNeedsUpdate = true;
        }
      }
      
      if (userNeedsUpdate) {
        await user.save();
        console.log(`Updated ${userBooksFixed} book URLs for user ${user.username}`);
        totalBooksFixed += userBooksFixed;
      } else {
        console.log(`No placeholder URLs found for user ${user.username}`);
      }
    }
    
    console.log(`\nTotal books fixed: ${totalBooksFixed}`);
    
    console.log('\n=== FIXING PLACEHOLDER URLS IN PURCHASE RECORDS ===');
    
    // Find all purchases
    const purchases = await Purchase.find({});
    console.log(`Found ${purchases.length} purchase records`);
    
    let totalPurchaseBooksFixed = 0;
    
    for (const purchase of purchases) {
      console.log(`\nChecking purchase: ${purchase._id}`);
      console.log(`Books in purchase: ${purchase.books.length}`);
      
      let purchaseBooksFixed = 0;
      let purchaseNeedsUpdate = false;
      
      for (const purchasedBook of purchase.books) {
        const bookId = purchasedBook.bookId.toString();
        const bookInfo = bookUrlMap.get(bookId);
        
        // Check if this book has a placeholder URL
        if ((!purchasedBook.url || 
             purchasedBook.url === 'placeholder' || 
             purchasedBook.url.includes('placeholder.url')) && 
            bookInfo) {
          
          console.log(`Fixing placeholder URL for book "${purchasedBook.title}" (${bookId})`);
          console.log(`  Old URL: ${purchasedBook.url || 'MISSING'}`);
          console.log(`  New URL: ${bookInfo.url}`);
          
          // Update the URL
          purchasedBook.url = bookInfo.url;
          purchaseBooksFixed++;
          purchaseNeedsUpdate = true;
        }
      }
      
      if (purchaseNeedsUpdate) {
        await purchase.save();
        console.log(`Updated ${purchaseBooksFixed} book URLs for purchase ${purchase._id}`);
        totalPurchaseBooksFixed += purchaseBooksFixed;
      } else {
        console.log(`No placeholder URLs found for purchase ${purchase._id}`);
      }
    }
    
    console.log(`\nTotal purchase books fixed: ${totalPurchaseBooksFixed}`);
    console.log(`\nTotal books fixed across all collections: ${totalBooksFixed + totalPurchaseBooksFixed}`);
    
    console.log('\nAll placeholder URLs have been fixed!');
    
  } catch (error) {
    console.error('Error fixing book URLs:', error);
  } finally {
    // Close the MongoDB connection
    mongoose.connection.close();
  }
}

// Run the function
fixBookUrls();
