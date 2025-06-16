const express = require('express');
const router = express.Router();
const { loadModel } = require('../utils/modelLoader');
const ChatHistory = loadModel('ChatHistoryModel');
const { verifyToken } = require('../middleware/auth');

// Load environment variables using our centralized utility
require('../utils/envConfig');

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

    console.log('Saving message to chat history:', {
      userId,
      text: text?.substring(0, 50) + (text?.length > 50 ? '...' : ''),
      sender
    });

    if (!userId) {
      console.error('No userId found in request. User object:', req.user);
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    if (!text || !sender) {
      console.error('Missing required fields:', { text: !!text, sender: !!sender });
      return res.status(400).json({
        success: false,
        message: 'Text and sender are required'
      });
    }

    // Find or create chat history for the user
    console.log('Finding chat history for user:', userId);
    let chatHistory = await ChatHistory.findOne({ userId });

    if (!chatHistory) {
      console.log('No existing chat history found, creating new one');
      chatHistory = new ChatHistory({
        userId,
        messages: []
      });
    } else {
      console.log('Found existing chat history with', chatHistory.messages.length, 'messages');
    }

    // Add the new message
    const timestamp = new Date();
    chatHistory.messages.push({
      text,
      sender,
      timestamp
    });

    console.log('Added new message to chat history, saving...');

    // Save the updated chat history
    await chatHistory.save();
    console.log('Chat history saved successfully');

    res.status(201).json({
      success: true,
      message: 'Message saved to chat history',
      data: chatHistory.messages
    });
  } catch (error) {
    console.error('Error saving message to chat history:', error);

    // Log more detailed error information
    if (error.name === 'ValidationError') {
      console.error('Validation error details:', error.errors);
    } else if (error.name === 'CastError') {
      console.error('Cast error details:', error);
    }

    res.status(500).json({
      success: false,
      message: 'Error saving message to chat history',
      error: error.message,
      errorType: error.name
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
    res.status(500).json({
      success: false,
      message: 'Error clearing chat history',
      error: error.message
    });
  }
});

module.exports = router;
