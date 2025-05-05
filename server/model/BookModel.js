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
    }
})

const Book = mongoose.model('Book',bookSchema);

module.exports = Book;