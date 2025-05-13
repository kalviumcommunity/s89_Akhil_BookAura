import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { MongoClient } from 'mongodb';
import { GoogleGenerativeAI } from '@google/generative-ai';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

// MongoDB configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const COLLECTION_NAME = 'conversations';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8080;
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Configure Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    // Log the file information for debugging
    console.log('Received file:', file.originalname, file.mimetype, file.size);

    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Middleware setup
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.JWT_SECRET || 'chat-session-secret',
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true },
  name: 'chatbot.sid'
}));

// MongoDB connection function
async function connectToMongoDB() {
  try {
    const client = await MongoClient.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    return client.db('ai_study_assistant');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return null;
  }
}

// Load conversation history from MongoDB
async function loadConversationHistory(userId, db) {
  const collection = db.collection(COLLECTION_NAME);
  const userChat = await collection.findOne({ userId });
  return userChat ? userChat.history : [];
}

// Save conversation history to MongoDB
async function saveConversationHistory(userId, history, db) {
  const collection = db.collection(COLLECTION_NAME);
  await collection.updateOne(
    { userId },
    { $set: { userId, history, updatedAt: new Date() } },
    { upsert: true }
  );
}

// System prompt for the AI assistant
const SYSTEM_PROMPT = `You are an AI Study Assistant, capable of answering questions, explaining topics, and assisting with homework or assignments across various subjects like Math, Science, History, etc. Respond clearly, concisely, and in an encouraging tone. If an image is sent, you should provide feedback based on the image's content.`;

// Chat endpoint - support both /api/chat and /chat routes
app.post(['/api/chat', '/chat'], upload.single('image'), async (req, res) => {
  try {
    // Get userId from body or generate a random one if not provided
    let { userId, message, prompt } = req.body;
    const imageFile = req.file;

    // Support both 'message' and 'prompt' parameters for compatibility
    message = message || prompt || '';

    // Generate a random userId if not provided
    if (!userId) {
      userId = Math.random().toString(36).substring(2, 15);
    }

    if (!message && !imageFile) {
      return res.status(400).json({ error: 'Missing message/prompt or image' });
    }

    const db = await connectToMongoDB();
    let conversationHistory = await loadConversationHistory(userId, db);

    // For Gemini, we need to handle system prompts differently
    // Instead of using 'system' role, we'll prepend it to the user's message
    const hasSystemPrompt = conversationHistory.some(msg =>
      msg.role === 'model' && msg.parts[0]?.text?.includes(SYSTEM_PROMPT.substring(0, 30))
    );

    // If this is a new conversation, add the system prompt as a model message
    if (conversationHistory.length === 0 && !hasSystemPrompt) {
      conversationHistory.push(
        { role: 'user', parts: [{ text: 'Hello, can you introduce yourself?' }] },
        { role: 'model', parts: [{ text: SYSTEM_PROMPT }] }
      );
    }

    // Use gemini-pro-vision for images, otherwise gemini-pro
    const modelName = imageFile ? 'gemini-1.5-flash' : 'gemini-2.0-flash';
    console.log(`Using model: ${modelName}`);

    const model = ai.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 800,
        topK: 40,
        topP: 0.95
      }
    });

    const parts = [];
    if (message) {
      parts.push({ text: message });
    }
    if (imageFile) {
      console.log(`Processing image: ${imageFile.originalname}, type: ${imageFile.mimetype}, size: ${imageFile.size} bytes`);
      try {
        parts.push({
          inlineData: {
            mimeType: imageFile.mimetype,
            data: imageFile.buffer.toString('base64')
          }
        });
      } catch (imageError) {
        console.error('Error processing image:', imageError);
        return res.status(422).json({
          error: 'Image processing failed',
          message: 'Could not process the uploaded image. Please try a different image.'
        });
      }
    }

    let response;

    // Add the current user message to history first
    conversationHistory.push({ role: 'user', parts });

    // For images, we'll use direct generation instead of chat history
    if (imageFile) {
      console.log("Using direct generation for image analysis");
      try {
        // For images, we need to use generateContent directly with the correct format
        // Create a prompt that explains what we want
        const imagePrompt = "Please analyze this image and provide detailed information about what you see.";

        // Create the content with both text and image
        const content = {
          role: 'user',
          parts: [
            { text: imagePrompt },
            {
              inlineData: {
                mimeType: imageFile.mimetype,
                data: imageFile.buffer.toString('base64')
              }
            }
          ]
        };

        console.log("Sending image to Gemini with prompt:", imagePrompt);
        const result = await model.generateContent({
          contents: [content]
        });
        response = result.response.text();
      } catch (imageGenError) {
        console.error("Error generating content for image:", imageGenError);
        return res.status(422).json({
          error: 'Image analysis failed',
          message: 'Could not analyze the uploaded image. Please try a different image.'
        });
      }
    }
    // For text-only messages, try the chat history approach
    else {
      try {
        // Create a chat session with history (excluding the last user message we just added)
        const chat = model.startChat({
          history: conversationHistory.slice(0, -1),
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1000,
            topK: 40,
            topP: 0.95
          }
        });

        // Send the message - need to use the actual text content
        const messageText = message || "Hello";
        const result = await chat.sendMessage(messageText);
        response = result.response.text();
      } catch (chatError) {
        // If chat history approach fails, try the simpler approach
        console.log("Chat history approach fails for text message:", chatError.message);

        try {
          // Prepare a simplified history as context
          const contextMessages = conversationHistory
            .slice(-7, -1) // Take last 3 exchanges (6 messages), excluding the last user message
            .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.parts[0]?.text || ''}`)
            .join('\n');

          // Create a simplified prompt with context
          const contextPrompt = `Previous conversation:\n${contextMessages}\n\nUser: ${message || "Sent an image"}\n\nAssistant:`;

          // Generate response
          const result = await model.generateContent(contextPrompt);
          response = result.response.text();
        }
        catch (fallbackError) {
          // If both approaches fail, use a simple response
          console.error("Both approaches failed:", fallbackError.message);
          response = "I'm sorry, I encountered an error processing your request. Could you please try again with a different question?";
        }
      }
    }

    // Add the AI response to history
    conversationHistory.push({ role: 'model', parts: [{ text: response }] });

    await saveConversationHistory(userId, conversationHistory, db);
    res.json({ response });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Health check endpoint
app.get('/health', (_, res) => {
  res.json({ status: 'ok', message: 'AI Chat server is running' });
});

// Serve static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
