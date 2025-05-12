// Script to check and remove duplicate books in user's purchased books
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../model/userModel');

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

async function fixDuplicateBooks() {
  try {
    console.log('=== CHECKING FOR DUPLICATE BOOKS IN USER PURCHASED BOOKS ===');
    
    // Find all users with purchased books
    const users = await User.find({ 'purchasedBooks.0': { $exists: true } });
    console.log(`Found ${users.length} users with purchased books`);
    
    let totalUsersFixed = 0;
    let totalDuplicatesRemoved = 0;
    
    for (const user of users) {
      console.log(`\nChecking user: ${user.username} (${user.email})`);
      console.log(`Purchased Books: ${user.purchasedBooks.length}`);
      
      // Check for duplicates
      const bookMap = new Map();
      const uniqueBooks = [];
      let duplicatesFound = 0;
      
      for (const book of user.purchasedBooks) {
        const bookId = book.bookId.toString();
        
        if (!bookMap.has(bookId)) {
          // First time seeing this book, add it to our map and unique list
          bookMap.set(bookId, book);
          uniqueBooks.push(book);
        } else {
          // This is a duplicate book
          console.log(`Found duplicate book: "${book.title}" (${bookId})`);
          duplicatesFound++;
        }
      }
      
      if (duplicatesFound > 0) {
        console.log(`Found ${duplicatesFound} duplicate books for user ${user.username}`);
        
        // Update user with unique books only
        user.purchasedBooks = uniqueBooks;
        await user.save();
        
        console.log(`Removed ${duplicatesFound} duplicate books for user ${user.username}`);
        totalUsersFixed++;
        totalDuplicatesRemoved += duplicatesFound;
      } else {
        console.log(`No duplicate books found for user ${user.username}`);
      }
    }
    
    console.log(`\nSummary:`);
    console.log(`Total users with duplicates: ${totalUsersFixed}`);
    console.log(`Total duplicate books removed: ${totalDuplicatesRemoved}`);
    
    if (totalDuplicatesRemoved > 0) {
      console.log('\nDuplicate books have been successfully removed!');
    } else {
      console.log('\nNo duplicate books found in any user accounts.');
    }
    
  } catch (error) {
    console.error('Error fixing duplicate books:', error);
  } finally {
    // Close the MongoDB connection
    mongoose.connection.close();
  }
}

// Run the function
fixDuplicateBooks();
