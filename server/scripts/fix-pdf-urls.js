// Script to fix PDF URLs in the database
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
  // Fallback connection string (replace with your actual connection string if needed)
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

    console.log(`Updated ${updatedBooks.length} book URLs`);

    // Fix URLs in user purchased books
    const users = await User.find({
      'purchasedBooks.url': { $exists: true, $ne: null }
    });

    console.log(`Found ${users.length} users with purchased books`);

    let totalUserBooksFixed = 0;

    for (const user of users) {
      let userBooksFixed = 0;

      if (user.purchasedBooks && user.purchasedBooks.length > 0) {
        for (const book of user.purchasedBooks) {
          if (book.url && book.url.includes('cloudinary') && book.url.includes('raw') && !book.url.toLowerCase().endsWith('.pdf')) {
            const oldUrl = book.url;
            const newUrl = `${oldUrl}.pdf`;

            console.log(`Updating user purchased book "${book.title}" URL:`);
            console.log(`  Old: ${oldUrl}`);
            console.log(`  New: ${newUrl}`);

            book.url = newUrl;
            userBooksFixed++;
          }
        }

        if (userBooksFixed > 0) {
          await user.save();
          totalUserBooksFixed += userBooksFixed;
        }
      }
    }

    console.log(`Updated ${totalUserBooksFixed} URLs in user purchased books`);

    // Fix URLs in purchase records
    const purchases = await Purchase.find({});

    console.log(`Found ${purchases.length} purchase records`);

    let totalPurchaseBooksFixed = 0;

    for (const purchase of purchases) {
      let purchaseBooksFixed = 0;

      if (purchase.books && purchase.books.length > 0) {
        for (const book of purchase.books) {
          if (book.url && book.url.includes('cloudinary') && book.url.includes('raw') && !book.url.toLowerCase().endsWith('.pdf')) {
            const oldUrl = book.url;
            const newUrl = `${oldUrl}.pdf`;

            console.log(`Updating purchase record book "${book.title}" URL:`);
            console.log(`  Old: ${oldUrl}`);
            console.log(`  New: ${newUrl}`);

            book.url = newUrl;
            purchaseBooksFixed++;
          }
        }

        if (purchaseBooksFixed > 0) {
          await purchase.save();
          totalPurchaseBooksFixed += purchaseBooksFixed;
        }
      }
    }

    console.log(`Updated ${totalPurchaseBooksFixed} URLs in purchase records`);

    console.log('All PDF URLs have been fixed!');

  } catch (error) {
    console.error('Error fixing PDF URLs:', error);
  } finally {
    // Close the MongoDB connection
    mongoose.connection.close();
  }
}

// Run the function
fixBookUrls();
