// Script to fix placeholder URLs in the database
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

// Default PDF URL to use for replacements
const DEFAULT_PDF_URL = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function fixPlaceholderUrls() {
  try {
    console.log('=== FIXING PLACEHOLDER URLS IN USER PURCHASED BOOKS ===');
    
    // Find all users with purchased books
    const users = await User.find({ 'purchasedBooks.0': { $exists: true } });
    console.log(`Found ${users.length} users with purchased books`);
    
    let totalBooksFixed = 0;
    
    for (const user of users) {
      console.log(`\nChecking user: ${user.username} (${user.email})`);
      console.log(`Purchased Books: ${user.purchasedBooks.length}`);
      
      let userBooksFixed = 0;
      let userNeedsUpdate = false;
      
      for (const book of user.purchasedBooks) {
        if (!book.url || book.url === 'placeholder' || book.url.includes('placeholder.url')) {
          console.log(`Fixing placeholder URL for book "${book.title}"`);
          console.log(`  Old URL: ${book.url || 'MISSING'}`);
          console.log(`  New URL: ${DEFAULT_PDF_URL}`);
          
          book.url = DEFAULT_PDF_URL;
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
      
      for (const book of purchase.books) {
        if (!book.url || book.url === 'placeholder' || book.url.includes('placeholder.url')) {
          console.log(`Fixing placeholder URL for book "${book.title}"`);
          console.log(`  Old URL: ${book.url || 'MISSING'}`);
          console.log(`  New URL: ${DEFAULT_PDF_URL}`);
          
          book.url = DEFAULT_PDF_URL;
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
    console.error('Error fixing placeholder URLs:', error);
  } finally {
    // Close the MongoDB connection
    mongoose.connection.close();
  }
}

// Run the function
fixPlaceholderUrls();
