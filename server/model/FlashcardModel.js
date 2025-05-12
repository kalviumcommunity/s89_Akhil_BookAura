const mongoose = require('mongoose');

// Define the schema for a single flashcard
const flashcardSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    answer: {
        type: String,
        required: true
    },
    tags: {
        type: [String],
        default: []
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    lastReviewed: {
        type: Date
    },
    reviewCount: {
        type: Number,
        default: 0
    },
    knowledgeLevel: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    }
});

// Define the schema for a flashcard deck
const flashcardDeckSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    sourceDocument: {
        type: String  // URL to the source document (e.g., PDF file)
    },
    sourceDocumentName: {
        type: String  // Original filename of the source document
    },
    flashcards: [flashcardSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Create indexes for faster queries
flashcardDeckSchema.index({ userId: 1, createdAt: -1 });

const FlashcardDeck = mongoose.model('FlashcardDeck', flashcardDeckSchema);

module.exports = FlashcardDeck;
