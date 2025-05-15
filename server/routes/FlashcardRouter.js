const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyToken } = require('../middleware/auth');
const { loadModel } = require('../utils/modelLoader');
const FlashcardDeck = loadModel('FlashcardModel');
const mongoose = require('mongoose');
const { generateFlashcardsFromPDF } = require('../services/flashcardGenerator');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Get all flashcard decks for the current user
router.get('/decks', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const decks = await FlashcardDeck.find({ userId })
      .sort({ createdAt: -1 })
      .select('-flashcards'); // Exclude flashcards for better performance

    res.status(200).json({
      success: true,
      message: 'Flashcard decks retrieved successfully',
      data: decks
    });
  } catch (error) {
    console.error('Error fetching flashcard decks:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching flashcard decks',
      error: error.message
    });
  }
});

// Get a specific flashcard deck by ID
router.get('/decks/:deckId', verifyToken, async (req, res) => {
  try {
    const { deckId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(deckId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid deck ID format'
      });
    }

    const deck = await FlashcardDeck.findOne({ _id: deckId, userId });

    if (!deck) {
      return res.status(404).json({
        success: false,
        message: 'Flashcard deck not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Flashcard deck retrieved successfully',
      data: deck
    });
  } catch (error) {
    console.error('Error fetching flashcard deck:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching flashcard deck',
      error: error.message
    });
  }
});

// Generate flashcards from PDF using the external AI API
router.post('/generate', verifyToken, upload.single('pdfFile'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No PDF file uploaded'
      });
    }

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    console.log('Preparing to generate flashcards from PDF:', req.file.originalname, 'Size:', req.file.size);

    // Use our local flashcard generator service
    console.log('Calling flashcard generator service...');
    const flashcards = await generateFlashcardsFromPDF(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    console.log('Generated', flashcards.length, 'flashcards');

    // Create a new flashcard deck with the generated flashcards
    const newDeck = new FlashcardDeck({
      userId,
      title,
      description: description || '',
      sourceDocumentName: req.file.originalname,
      flashcards: flashcards.map(card => ({
        question: card.question,
        answer: card.answer
      }))
    });

    await newDeck.save();
    console.log('Saved new flashcard deck with ID:', newDeck._id);

    res.status(201).json({
      success: true,
      message: 'Flashcards generated successfully',
      data: {
        deckId: newDeck._id,
        flashcardCount: newDeck.flashcards.length
      }
    });
  } catch (error) {
    console.error('Error generating flashcards:', error);

    let errorMessage = 'Error generating flashcards';
    let statusCode = 500;

    // Check for specific error types
    if (error.message.includes('PDF file could not be processed')) {
      statusCode = 400;
      errorMessage = error.message;
    } else if (error.message.includes('API key error')) {
      statusCode = 403;
      errorMessage = error.message;
    } else if (error.message.includes('Only PDF files are supported')) {
      statusCode = 400;
      errorMessage = error.message;
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: error.message
    });
  }
});

// Save pre-generated flashcards (alternative approach)
router.post('/save-generated', verifyToken, express.json(), async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, flashcards } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    if (!flashcards || !Array.isArray(flashcards)) {
      return res.status(400).json({
        success: false,
        message: 'Valid flashcards array is required'
      });
    }

    console.log('Saving pre-generated flashcards, count:', flashcards.length);

    // Create a new flashcard deck with the provided flashcards
    const newDeck = new FlashcardDeck({
      userId,
      title,
      description: description || '',
      flashcards: flashcards.map(card => ({
        question: card.question,
        answer: card.answer
      }))
    });

    await newDeck.save();
    console.log('Saved new flashcard deck with ID:', newDeck._id);

    res.status(201).json({
      success: true,
      message: 'Flashcards saved successfully',
      data: {
        deckId: newDeck._id,
        flashcardCount: newDeck.flashcards.length
      }
    });
  } catch (error) {
    console.error('Error saving flashcards:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving flashcards',
      error: error.message
    });
  }
});

// Test Gemini API connection
router.get('/test-gemini', verifyToken, async (req, res) => {
  try {
    const { testGeminiConnection } = require('../services/flashcardGenerator');
    const response = await testGeminiConnection();

    res.status(200).json({
      success: true,
      message: 'Gemini API connection successful',
      response
    });
  } catch (error) {
    console.error('Error testing Gemini API:', error);
    res.status(500).json({
      success: false,
      message: 'Gemini API connection failed',
      error: error.message
    });
  }
});

// Delete a flashcard deck
router.delete('/decks/:deckId', verifyToken, async (req, res) => {
  try {
    const { deckId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(deckId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid deck ID format'
      });
    }

    const result = await FlashcardDeck.findOneAndDelete({ _id: deckId, userId });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Flashcard deck not found or you do not have permission to delete it'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Flashcard deck deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting flashcard deck:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting flashcard deck',
      error: error.message
    });
  }
});

module.exports = router;