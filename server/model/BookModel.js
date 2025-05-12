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
        required:true
    },
    coverimage:{
        type:String,
        required:true
    },
    url:{
        type:String,
        required:true,
    },
    publishedDate: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true })

const Book = mongoose.model('Book',bookSchema);

module.exports = Book;