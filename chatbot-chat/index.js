
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const multer = require('multer');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize the Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const upload = multer({storage: multer.memoryStorage() });

// Simple endpoint to get AI response
app.post('/api/chat',upload.single('file'), async (req, res) => {
  try {
    const { message } = req.body;
    const file = req.file;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (file) {
      // Handle image files
      const supportedImages = ['image/jpeg', 'image/png', 'image/webp'];
      if (supportedImages.includes(file.mimetype)) {
        inputParts.push({
          inlineData: {
            mimeType: file.mimetype,
            data: file.buffer.toString('base64'),
          }
        });
      } else {
        return res.status(400).json({ error: 'Only image files are supported currently (jpg/png/webp)' });
      }
    }

    // Get AI response
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const result = await model.generateContent(message);
    const response = result.response.text();

    res.json({ response });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to get response', details: error.message });
  }
});

// Simple HTML interface
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>AI Chat</title>
      <style>
        body { font-family: Arial; max-width: 800px; margin: 0 auto; padding: 20px; }
        #chat { height: 300px; border: 1px solid #ccc; overflow-y: auto; padding: 10px; margin-bottom: 10px; }
        #input { width: 80%; padding: 8px; }
        button { padding: 8px 15px; background: #4CAF50; color: white; border: none; cursor: pointer; }
        .user { text-align: right; margin: 5px 0; }
        .ai { text-align: left; margin: 5px 0; }
      </style>
    </head>
    <body>
      <h1>StudyHub AI Chat</h1>
      <div id="chat"></div>
      <input id="input" placeholder="Type your question...">
      <button onclick="sendMessage()">Send</button>

      <script>
        const chatDiv = document.getElementById('chat');
        const inputField = document.getElementById('input');

        async function sendMessage() {
          const message = inputField.value.trim();
          if (!message) return;

          // Display user message
          chatDiv.innerHTML += '<div class="user"><strong>You:</strong> ' + message + '</div>';
          inputField.value = '';

          // Show loading
          chatDiv.innerHTML += '<div id="loading" class="ai"><em>Thinking...</em></div>';
          chatDiv.scrollTop = chatDiv.scrollHeight;

          try {
            // Get AI response
            const response = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message })
            });

            const data = await response.json();

            // Remove loading and display AI response
            document.getElementById('loading').remove();
            chatDiv.innerHTML += '<div class="ai"><strong>AI:</strong> ' + data.response + '</div>';
          } catch (error) {
            document.getElementById('loading').remove();
            chatDiv.innerHTML += '<div class="ai"><strong>Error:</strong> Failed to get response</div>';
          }

          chatDiv.scrollTop = chatDiv.scrollHeight;
        }

        // Allow Enter key to send message
        inputField.addEventListener('keypress', function(e) {
          if (e.key === 'Enter') sendMessage();
        });
      </script>
    </body>
    </html>
  `);
});

// Start the server
app.listen(PORT, () => {
  console.log(`AI Chat server running on http://localhost:${PORT}`);
});
