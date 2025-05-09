const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const auth = require('../middleware/auth');
const FlashcardDeck = require('../model/FlashcardModel');
const mongoose = require('mongoose');
const FormData = require('form-data');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.get('/decks', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const decks = await FlashcardDeck.find({ userId })
      .sort({ createdAt: -1 })
      .select('-flashcards');

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

router.get('/decks/:deckId', auth, async (req, res) => {
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

router.post('/generate', auth, upload.single('pdfFile'), async (req, res) => {
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

    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    const aiResponse = await axios.post('http://localhost:5001/chatbot-file', formData, {
      headers: {
        ...formData.getHeaders()
      },
      timeout: 300000
    });

    if (!aiResponse.data || !Array.isArray(aiResponse.data)) {
      throw new Error('Invalid response from AI service');
    }

    const newDeck = new FlashcardDeck({
      userId,
      title,
      description: description || '',
      flashcards: aiResponse.data.map(card => ({
        question: card.question,
        answer: card.answer
      }))
    });

    await newDeck.save();
    
    res.status(201).json({
      success: true,
      message: 'Flashcards generated and saved successfully',
      data: {
        deckId: newDeck._id,
        flashcardCount: newDeck.flashcards.length
      }
    });
  } catch (error) {
    console.error('Error generating flashcards:', error);

    let errorMessage = 'Error generating flashcards';

    if (error.response) {
      errorMessage = error.response.data.message || errorMessage;
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'AI service is not available. Please try again later.';
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message
    });
  }
});

router.post('/save-generated', auth, express.json(), async (req, res) => {
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

router.delete('/decks/:deckId', auth, async (req, res) => {
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

