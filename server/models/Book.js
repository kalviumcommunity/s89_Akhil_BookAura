const mongoose = require('mongoose')

const bookSchema = mongoose.Schema({
    title:{
        type:String,
        required:true,
    },
    author:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    genre:{
        type:String,
        required:true
        // Temporarily removed enum validation for debugging
        // enum: ['Fiction', 'Non-fiction', 'Fantasy', 'Romance', 'Science Fiction', 'Mystery', 'Biography', 'Horror', 'Thriller', 'Self-help', 'History', 'Others']
    },
    categories: {
        type: [String],
        default: []
    },
    isBestSeller: {
        type: Boolean,
        default: false
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    isNewRelease: {
        type: Boolean,
        default: false
    },
    price:{
        type:Number,
        default: 0
    },
    coverimage:{
        type:String,
        required:true
    },
    url:{
        type:String,
        required:true,
    },
    epubUrl:{
        type:String,
        // Not required for backward compatibility
    },
    cloudinaryPublicId: {
        type: String,
        // Store Cloudinary public ID for future reference/deletion
    },
    storageType: {
        type: String,
        enum: ['cloudinary', 'in-memory', 'legacy'],
        default: 'cloudinary'
    },
    publishedDate: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true })

// Check if model already exists to prevent overwrite error
const Book = mongoose.models.Book || mongoose.model('Book', bookSchema);

module.exports = Book;
