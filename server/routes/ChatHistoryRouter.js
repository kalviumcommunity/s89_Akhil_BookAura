const express = require('express');
const router = express.Router();
const { loadModel } = require('../utils/modelLoader');
const ChatHistory = loadModel('ChatHistoryModel');
const { verifyToken } = require('../middleware/auth');

// Get chat history for the authenticated user
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Find chat history for the user
    let chatHistory = await ChatHistory.findOne({ userId });

    // If no chat history exists, return an empty array
    if (!chatHistory) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    res.status(200).json({
      success: true,
      data: chatHistory.messages
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);

    // Check for authentication errors
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed. Please log in again.',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error fetching chat history',
      error: error.message
    });
  }
});

// Save a new message to chat history
router.post('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { text, sender } = req.body;

    if (!text || !sender) {
      return res.status(400).json({
        success: false,
        message: 'Text and sender are required'
      });
    }

    // Find or create chat history for the user
    let chatHistory = await ChatHistory.findOne({ userId });

    if (!chatHistory) {
      chatHistory = new ChatHistory({
        userId,
        messages: []
      });
    }

    // Add the new message
    chatHistory.messages.push({
      text,
      sender,
      timestamp: new Date()
    });

    // Save the updated chat history
    await chatHistory.save();

    res.status(201).json({
      success: true,
      message: 'Message saved to chat history',
      data: chatHistory.messages
    });
  } catch (error) {
    console.error('Error saving message to chat history:', error);

    // Check for authentication errors
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed. Please log in again.',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error saving message to chat history',
      error: error.message
    });
  }
});

// Clear chat history for the authenticated user
router.delete('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Find and remove chat history for the user
    await ChatHistory.findOneAndDelete({ userId });

    res.status(200).json({
      success: true,
      message: 'Chat history cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing chat history:', error);

    // Check for authentication errors
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed. Please log in again.',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error clearing chat history',
      error: error.message
    });
  }
});

module.exports = router;
