// Script to check and log all book URLs in the database
const mongoose = require('mongoose');
const { loadModel } = require('./modelHelper');
const { connectToMongoDB, closeMongoDB } = require('./scriptHelper');
const User = loadModel('userModel');
const Book = loadModel('BookModel');
const Purchase = loadModel('PurchaseModel');

// Default PDF URL to use for replacements
const DEFAULT_PDF_URL = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

async function checkAndFixBookUrls() {
  try {
    // Connect to MongoDB
    await connectToMongoDB();

    console.log('=== CHECKING BOOK COLLECTION ===');
    // Find all books
    const books = await Book.find({});
    console.log(`Found ${books.length} books in total`);

    // Count books by URL pattern
    let cloudinaryCount = 0;
    let placeholderCount = 0;
    let otherCount = 0;
    let missingCount = 0;
    let fixedCount = 0;

    for (const book of books) {
      console.log(`Book: ${book.title}`);
      console.log(`  URL: ${book.url || 'MISSING'}`);

      if (!book.url) {
        missingCount++;
        console.log('  Status: MISSING URL - Fixing with default PDF');
        book.url = DEFAULT_PDF_URL;
        await book.save();
        fixedCount++;
      } else if (book.url.includes('placeholder.url')) {
        placeholderCount++;
        console.log('  Status: PLACEHOLDER URL - Fixing with default PDF');
        book.url = DEFAULT_PDF_URL;
        await book.save();
        fixedCount++;
      } else if (book.url.includes('cloudinary.com') && book.url.includes('raw')) {
        cloudinaryCount++;
        if (!book.url.toLowerCase().endsWith('.pdf')) {
          console.log('  Status: CLOUDINARY URL WITHOUT .PDF - Adding extension');
          book.url = `${book.url}.pdf`;
          await book.save();
          fixedCount++;
        } else {
          console.log('  Status: VALID CLOUDINARY URL');
        }
      } else {
        otherCount++;
        console.log('  Status: OTHER URL TYPE');
      }
    }

    console.log('\nBook URL Summary:');
    console.log(`Total Books: ${books.length}`);
    console.log(`Cloudinary URLs: ${cloudinaryCount}`);
    console.log(`Placeholder URLs: ${placeholderCount}`);
    console.log(`Other URLs: ${otherCount}`);
    console.log(`Missing URLs: ${missingCount}`);
    console.log(`Fixed URLs: ${fixedCount}`);

    console.log('\n=== CHECKING USER PURCHASED BOOKS ===');
    // Find all users with purchased books
    const users = await User.find({ 'purchasedBooks.0': { $exists: true } });
    console.log(`Found ${users.length} users with purchased books`);

    let userBooksTotal = 0;
    let userBooksFixed = 0;

    for (const user of users) {
      console.log(`\nUser: ${user.username} (${user.email})`);
      console.log(`Purchased Books: ${user.purchasedBooks.length}`);

      userBooksTotal += user.purchasedBooks.length;
      let userNeedsUpdate = false;

      for (const book of user.purchasedBooks) {
        console.log(`  Book: ${book.title}`);
        console.log(`    URL: ${book.url || 'MISSING'}`);

        if (!book.url) {
          console.log('    Status: MISSING URL - Fixing with default PDF');
          book.url = DEFAULT_PDF_URL;
          userNeedsUpdate = true;
          userBooksFixed++;
        } else if (book.url.includes('placeholder.url')) {
          console.log('    Status: PLACEHOLDER URL - Fixing with default PDF');
          book.url = DEFAULT_PDF_URL;
          userNeedsUpdate = true;
          userBooksFixed++;
        } else if (book.url.includes('cloudinary.com') && book.url.includes('raw')) {
          if (!book.url.toLowerCase().endsWith('.pdf')) {
            console.log('    Status: CLOUDINARY URL WITHOUT .PDF - Adding extension');
            book.url = `${book.url}.pdf`;
            userNeedsUpdate = true;
            userBooksFixed++;
          } else {
            console.log('    Status: VALID CLOUDINARY URL');
          }
        } else {
          console.log('    Status: OTHER URL TYPE');
        }
      }

      if (userNeedsUpdate) {
        await user.save();
        console.log(`  Updated user's purchased books`);
      }
    }

    console.log('\nUser Purchased Books Summary:');
    console.log(`Total Users with Books: ${users.length}`);
    console.log(`Total Purchased Books: ${userBooksTotal}`);
    console.log(`Fixed Book URLs: ${userBooksFixed}`);

    console.log('\nAll book URLs have been checked and fixed!');

  } catch (error) {
    console.error('Error checking book URLs:', error);
  } finally {
    // Close the MongoDB connection
    await closeMongoDB();
  }
}

// Run the function
checkAndFixBookUrls();
