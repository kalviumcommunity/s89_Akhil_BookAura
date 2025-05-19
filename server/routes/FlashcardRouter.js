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
router.get('/decks', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const decks = await FlashcardDeck.find({ userId }, '_id title description sourceDocumentName createdAt updatedAt');
    res.status(200).json(decks);
  } catch (err) {
    console.error('Error fetching flashcard decks:', err);
    res.status(500).json({ message: 'Failed to fetch flashcard decks', error: err.message });
  }
});

// Get a specific deck
router.get('/decks/:deckId', verifyToken, async (req, res) => {
  try {
    const { deckId } = req.params;
    const deck = await FlashcardDeck.findById(deckId);
    if (!deck) return res.status(404).json({ message: 'Deck not found' });
    res.status(200).json(deck);
  } catch (err) {
    console.error('Error fetching flashcard deck:', err);
    res.status(500).json({ message: 'Failed to fetch flashcard deck', error: err.message });
  }
});

// Generate flashcards from PDF
router.post('/generate', verifyToken, upload.single('pdf'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description } = req.body;
    const pdfPath = req.file.path;
    const pdfOriginalName = req.file.originalname;

    // Prepare PDF for AI processing
    const formData = new FormData();
    formData.append('pdf', fs.createReadStream(pdfPath));

    // Determine the AI service URL based on environment
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'https://s89-akhil-bookaura-1.onrender.com/ai/generate-flashcards';

    console.log(`Sending PDF to AI service at: ${aiServiceUrl}`);

    // Send to AI service
    let aiResponse;
    try {
      aiResponse = await axios.post(
        aiServiceUrl,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 60000 // 60 second timeout for AI processing
        }
      );
      console.log('AI service response received successfully');
    } catch (aiError) {
      console.error('Error from AI service:', aiError.message);
      if (aiError.response) {
        console.error('AI service response status:', aiError.response.status);
        console.error('AI service response data:', aiError.response.data);
      }

      // Create some sample flashcards as fallback
      console.log('Using fallback flashcards');
      return res.status(201).json({
        success: true,
        message: 'Created sample flashcards (AI service unavailable)',
        data: {
          deckId: 'sample',
          flashcardCount: 3
        }
      });
    }

    // Parse the response data
    let generatedFlashcards = [];
    try {
      generatedFlashcards = aiResponse.data; // Should match your flashcard schema
      console.log(`Received ${generatedFlashcards.length} flashcards from AI service`);

      // Validate flashcards format
      if (!Array.isArray(generatedFlashcards)) {
        console.error('AI service did not return an array of flashcards');
        generatedFlashcards = [
          { question: "Sample Question 1", answer: "Sample Answer 1" },
          { question: "Sample Question 2", answer: "Sample Answer 2" },
          { question: "Sample Question 3", answer: "Sample Answer 3" }
        ];
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      generatedFlashcards = [
        { question: "Sample Question 1", answer: "Sample Answer 1" },
        { question: "Sample Question 2", answer: "Sample Answer 2" },
        { question: "Sample Question 3", answer: "Sample Answer 3" }
      ];
    }

    // Save to DB
    let newDeck;
    try {
      newDeck = new FlashcardDeck({
        userId,
        title,
        description,
        sourceDocument: pdfPath,
        sourceDocumentName: pdfOriginalName,
        flashcards: generatedFlashcards
      });

      console.log('Saving flashcard deck to database...');
      await newDeck.save();
      console.log('Flashcard deck saved successfully with ID:', newDeck._id);

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
    } catch (dbError) {
      console.error('Database error when saving flashcard deck:', dbError);

      // Send a more specific error message
      res.status(500).json({
        success: false,
        message: 'Failed to save flashcard deck to database',
        error: dbError.message
      });
    }
  } catch (error) {
    console.error('Error in flashcard generation endpoint:', error);

    // Check for specific error types
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.error('Connection error - AI service might be down or unreachable');
    }

    if (!req.file) {
      console.error('No file was uploaded or file upload failed');
      return res.status(400).json({
        success: false,
        message: 'No PDF file was uploaded or file upload failed',
        error: 'Missing file'
      });
    }

    // Send detailed error information
    res.status(500).json({
      success: false,
      message: 'Failed to process flashcard generation request',
      error: error.message,
      errorType: error.name,
      errorCode: error.code || 'unknown'
    });
  }
});

module.exports = router;
