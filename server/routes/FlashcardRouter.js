const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const FlashcardDeck = require('../model/FlashcardModel');
const { verifyToken } = require('../middleware/auth');

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Get all decks for a user
router.get('/decks', async (req, res) => {
  try {
    const userId = req.user.id;
    const decks = await FlashcardDeck.find({ userId }, '_id title description sourceDocumentName createdAt updatedAt');
    res.status(200).json(decks);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch flashcard decks', error: err.message });
  }
});

// Get a specific deck
router.get('/decks/:deckId', async (req, res) => {
  try {
    const { deckId } = req.params;
    const deck = await FlashcardDeck.findById(deckId);
    if (!deck) return res.status(404).json({ message: 'Deck not found' });
    res.status(200).json(deck);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch flashcard deck', error: err.message });
  }
});

// Generate flashcards from PDF
router.post('/generate', upload.single('pdf'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description } = req.body;
    const pdfPath = req.file.path;
    const pdfOriginalName = req.file.originalname;

    // Prepare PDF for AI processing
    const formData = new FormData();
    formData.append('pdf', fs.createReadStream(pdfPath));

    // Send to AI service
    const aiResponse = await axios.post(
      'http://localhost:8080/ai/generate-flashcards',
      formData,
      { headers: formData.getHeaders() }
    );

    const generatedFlashcards = aiResponse.data; // Should match your flashcard schema

    // Save to DB
    const newDeck = new FlashcardDeck({
      userId,
      title,
      description,
      sourceDocument: pdfPath,
      sourceDocumentName: pdfOriginalName,
      flashcards: generatedFlashcards
    });

    await newDeck.save();

    // Optionally delete local PDF
    // fs.unlinkSync(pdfPath);

    res.status(201).json({
      success: true,
      message: 'Flashcards generated and deck saved successfully',
      data: {
        deckId: newDeck._id,
        flashcardCount: newDeck.flashcards.length
      }
    });
  } catch (error) {
    console.error('AI error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to generate flashcards',
      error: error.message
    });
  }
});

module.exports = router;
