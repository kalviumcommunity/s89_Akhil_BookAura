const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const { verifyToken } = require('../middleware/auth');

const FlashcardDeck = require('../model/FlashcardModel');
const mongoose = require('mongoose');
const { generateFlashcardsFromPDF, testGeminiConnection } = require('./FlashcardCreater');


const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Test the Gemini API connection
router.get('/test-gemini', verifyToken, async (_, res) => {
  try {
    const response = await testGeminiConnection();
    res.status(200).json({
      success: true,
      message: 'Gemini API connection successful',
      response
    });
  } catch (error) {
    console.error('Gemini API test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Gemini API connection failed',
      error: error.message
    });
  }
});

// Get all flashcard decks for the current user
router.get('/decks', verifyToken, async (req, res) => {
  try {
    console.log('Fetching flashcard decks for user:', req.user.id);
    console.log('User object:', req.user);

    const userId = req.user.id;

    // Validate userId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error('Invalid user ID format:', userId);
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    console.log('Finding flashcard decks with userId:', userId);

    const decks = await FlashcardDeck.find({ userId })
      .sort({ createdAt: -1 })
      .select('-flashcards'); // Exclude flashcards for better performance

    console.log('Found', decks.length, 'flashcard decks');

    // Log the IDs of found decks
    if (decks.length > 0) {
      console.log('Deck IDs:', decks.map(deck => deck._id));
    }

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

    console.log('Fetching specific flashcard deck:', deckId);
    console.log('For user:', userId);

    // Validate deckId
    if (!mongoose.Types.ObjectId.isValid(deckId)) {
      console.error('Invalid deck ID format:', deckId);
      return res.status(400).json({
        success: false,
        message: 'Invalid deck ID format'
      });
    }

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error('Invalid user ID format:', userId);
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    console.log('Finding deck with ID:', deckId, 'and userId:', userId);
    const deck = await FlashcardDeck.findOne({ _id: deckId, userId });

    if (!deck) {
      console.log('No deck found with ID:', deckId, 'for user:', userId);
      return res.status(404).json({
        success: false,
        message: 'Flashcard deck not found'
      });
    }

    console.log('Found deck:', deck._id, 'with', deck.flashcards.length, 'flashcards');

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

// Generate flashcards from PDF using the local AI function
router.post('/generate', verifyToken, upload.single('pdf'), async (req, res) => {
  try {
    console.log('Flashcard generation request received');
    console.log('User ID:', req.user.id);
    console.log('User object:', req.user);
    console.log('Request body:', req.body);
    console.log('Request file:', req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      fieldname: req.file.fieldname
    } : 'No file');

    // Ensure userId is a valid MongoDB ObjectId
    const userId = req.user.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error('Invalid user ID format:', userId);
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    console.log('Validated user ID:', userId);
    const { title, description } = req.body;

    if (!req.file) {
      console.error('No file uploaded');
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

    console.log('Processing file for flashcard generation:', req.file.originalname, 'Size:', req.file.size);

    // Get file buffer
    let fileBuffer;
    if (req.file.buffer) {
      console.log('Using buffer from memory storage');
      fileBuffer = req.file.buffer;
    } else if (req.file.path) {
      console.log('Using file path from disk storage');
      fileBuffer = fs.readFileSync(req.file.path);
    } else {
      console.error('No file buffer or path available');
      return res.status(400).json({
        success: false,
        message: 'File upload failed - no data available'
      });
    }

    console.log('Generating flashcards using local AI function...');

    // Call the local AI function to generate flashcards
    const flashcards = await generateFlashcardsFromPDF(
      fileBuffer,
      req.file.originalname,
      req.file.mimetype
    );

    console.log('Generated', flashcards.length, 'flashcards');

    // Create a new flashcard deck with the generated flashcards
    console.log('Creating new flashcard deck with userId:', userId);

    // Prepare flashcards data
    const flashcardsData = flashcards.map(card => ({
      question: card.question,
      answer: card.answer
    }));

    console.log('Prepared flashcards data:', flashcardsData.length, 'cards');

    const newDeck = new FlashcardDeck({
      userId,
      title,
      description: description || '',
      sourceDocumentName: req.file.originalname,
      flashcards: flashcardsData
    });

    console.log('New deck object created:', newDeck);

    try {
      await newDeck.save();
      console.log('Saved new flashcard deck with ID:', newDeck._id);
    } catch (saveError) {
      console.error('Error saving flashcard deck to MongoDB:', saveError);
      throw new Error(`Failed to save flashcard deck: ${saveError.message}`);
    }

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
    if (error.message.includes('Only PDF files are supported')) {
      statusCode = 400;
      errorMessage = 'Only PDF files are supported';
    } else if (error.message.includes('too large')) {
      statusCode = 400;
      errorMessage = 'The PDF file is too large to process';
    } else if (error.message.includes('API key error')) {
      statusCode = 403;
      errorMessage = 'API key error: Please check your Gemini API key';
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