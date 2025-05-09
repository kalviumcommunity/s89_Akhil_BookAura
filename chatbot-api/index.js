require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5001;

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow all origins during development
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Flashcard Generator API is running' });
});

// Test Gemini API key
app.get('/test-gemini', async (req, res) => {
  try {
    console.log('Testing Gemini API connection...');
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello, can you respond with 'API is working'?");
    const responseText = result.response.text();
    console.log('Gemini API test response:', responseText);
    res.json({
      success: true,
      message: 'Gemini API connection successful',
      response: responseText
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

// Flashcard generation endpoint
app.post('/chatbot-file', upload.single('file'), async (req, res) => {
  try {
    console.log('File upload request received');

    if (!req.file) {
      console.log('No file in request');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('File received:', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // Check if file is a PDF
    if (req.file.mimetype !== 'application/pdf') {
      console.log('Invalid file type:', req.file.mimetype);
      return res.status(400).json({ message: 'Only PDF files are supported' });
    }

    // Convert file to base64 for Gemini API
    const fileData = req.file.buffer;
    const mimeType = req.file.mimetype;

    console.log('Converting file to base64');
    const base64Data = fileData.toString("base64");
    console.log('Base64 conversion complete, length:', base64Data.length);

    const filePart = {
      inlineData: {
        data: base64Data,
        mimeType,
      }
    };

    console.log('Initializing Gemini model');
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    console.log('Sending request to Gemini API');
    const result = await model.generateContent([
      { text: "Create flashcards from this PDF document. Format your response as a JSON array of objects, where each object has 'question' and 'answer' fields. Generate at least 5 flashcards that cover the main concepts in the document. Only return the JSON array, nothing else." },
      filePart
    ]);

    console.log('Received response from Gemini API');
    const response = result.response;
    const responseText = response.text();
    console.log('Response text length:', responseText.length);

    // Extract JSON from response
    let flashcards;
    try {
      console.log('Attempting to parse response as JSON');
      // Try to parse the entire response as JSON
      flashcards = JSON.parse(responseText);
      console.log('Successfully parsed JSON response');
    } catch (e) {
      console.log('Failed to parse entire response as JSON, trying to extract JSON portion');
      // If that fails, try to extract JSON from the text
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        console.log('Found JSON pattern in response');
        flashcards = JSON.parse(jsonMatch[0]);
        console.log('Successfully parsed extracted JSON');
      } else {
        console.log('No JSON pattern found in response');
        console.log('Response preview:', responseText.substring(0, 200) + '...');
        throw new Error('Failed to parse flashcards from AI response');
      }
    }

    // Validate flashcards format
    if (!Array.isArray(flashcards)) {
      console.log('Response is not an array:', typeof flashcards);
      throw new Error('AI did not return an array of flashcards');
    }

    console.log('Generated', flashcards.length, 'flashcards');

    // Return the flashcards
    res.status(200).json(flashcards);
  } catch (error) {
    console.error('Error generating flashcards:', error);

    // Check if it's a Gemini API error
    if (error.message && error.message.includes('INVALID_ARGUMENT')) {
      console.log('Gemini API error - invalid argument');
      return res.status(400).json({
        message: 'The PDF file could not be processed by the AI. It may be too large, corrupted, or contain unsupported content.',
        error: error.message
      });
    }

    if (error.message && error.message.includes('PERMISSION_DENIED')) {
      console.log('Gemini API error - permission denied');
      return res.status(403).json({
        message: 'API key error: Permission denied. Please check your Gemini API key.',
        error: error.message
      });
    }

    res.status(500).json({
      message: 'Failed to generate flashcards',
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Flashcard Generator API running on port ${PORT}`);
});
