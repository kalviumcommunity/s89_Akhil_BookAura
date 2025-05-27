// Script to add epubUrl field to existing books and purchased books
const mongoose = require('mongoose');
const { loadModel } = require('./modelHelper');
const { connectToMongoDB, closeMongoDB } = require('./scriptHelper');

const User = loadModel('userModel');
const Book = loadModel('BookModel');
const Purchase = loadModel('PurchaseModel');

async function addEpubUrls() {
  try {
    await connectToMongoDB();
    console.log('🚀 Starting to add epubUrl fields...');

    // 1. Update Book collection
    console.log('\n📚 Updating Book collection...');
    const books = await Book.find({});
    let booksUpdated = 0;

    for (const book of books) {
      if (!book.epubUrl && book.url) {
        book.epubUrl = book.url;
        await book.save();
        booksUpdated++;
        console.log(`✅ Updated book: ${book.title} - ${book.epubUrl}`);
      }
    }
    console.log(`📚 Updated ${booksUpdated} books with epubUrl`);

    // 2. Update User purchased books
    console.log('\n👥 Updating User purchased books...');
    const users = await User.find({ 'purchasedBooks.0': { $exists: true } });
    let userBooksUpdated = 0;

    for (const user of users) {
      let userNeedsUpdate = false;
      
      for (const purchasedBook of user.purchasedBooks) {
        if (!purchasedBook.epubUrl && purchasedBook.url) {
          purchasedBook.epubUrl = purchasedBook.url;
          userNeedsUpdate = true;
          userBooksUpdated++;
        }
      }
      
      if (userNeedsUpdate) {
        await user.save();
        console.log(`✅ Updated user: ${user.username} - ${user.purchasedBooks.length} books`);
      }
    }
    console.log(`👥 Updated ${userBooksUpdated} user purchased books with epubUrl`);

    // 3. Update Purchase collection
    console.log('\n🛒 Updating Purchase collection...');
    const purchases = await Purchase.find({});
    let purchaseBooksUpdated = 0;

    for (const purchase of purchases) {
      let purchaseNeedsUpdate = false;
      
      for (const book of purchase.books) {
        if (!book.epubUrl && book.url) {
          book.epubUrl = book.url;
          purchaseNeedsUpdate = true;
          purchaseBooksUpdated++;
        }
      }
      
      if (purchaseNeedsUpdate) {
        await purchase.save();
        console.log(`✅ Updated purchase: ${purchase._id} - ${purchase.books.length} books`);
      }
    }
    console.log(`🛒 Updated ${purchaseBooksUpdated} purchase books with epubUrl`);

    console.log('\n🎉 Successfully added epubUrl fields to all collections!');
    console.log(`📊 Summary:`);
    console.log(`   - Books: ${booksUpdated}`);
    console.log(`   - User purchased books: ${userBooksUpdated}`);
    console.log(`   - Purchase books: ${purchaseBooksUpdated}`);

  } catch (error) {
    console.error('❌ Error adding epubUrl fields:', error);
  } finally {
    await closeMongoDB();
  }
}

// Run the script
addEpubUrls();
