const express = require('express');
const router = express.Router();
const ChatHistory = require('../model/ChatHistoryModel');
const auth = require('../middleware/auth');

// Get chat history for the authenticated user
router.get('/', auth, async (req, res) => {
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
router.post('/', auth, async (req, res) => {
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
    res.status(500).json({
      success: false,
      message: 'Error saving message to chat history',
      error: error.message
    });
  }
});

// Clear chat history for the authenticated user
router.delete('/', auth, async (req, res) => {
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
