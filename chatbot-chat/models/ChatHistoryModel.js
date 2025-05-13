import mongoose from "mongoose";

// Simple message schema for individual messages
const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Main chat history schema
const chatHistorySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true // Add index for faster queries
  },
  messages: [messageSchema], // Store conversation as an array of messages
  file: {
    filename: String,
    originalname: String,
    mimetype: String,
    size: Number,
    path: String,
  },
}, {
  timestamps: true // Automatically add createdAt and updatedAt
});

export default mongoose.model("ChatHistory", chatHistorySchema);
