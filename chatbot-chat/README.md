# StudyHub AI Chat Assistant

A web-based chat interface for interacting with Google's Gemini AI as a study assistant.

## Features

- Web-based chat interface accessible via browser
- Maintains conversation history for context
- Real-time responses
- Customized as a study assistant for students
- Runs on port 8080 by default

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file with your Gemini API key:
   ```
   cp .env.example .env
   ```
   Then edit the `.env` file to add your Gemini API key. You can get a key from [Google AI Studio](https://makersuite.google.com/app/apikey).

## Usage

1. Start the server:
   ```
   npm start
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:8080
   ```

3. Start chatting with the AI assistant through the web interface.

## Configuration

You can change the port by setting the `PORT` environment variable in your `.env` file:
```
PORT=3000
```

## Example Questions

- "Can you explain the concept of photosynthesis?"
- "Help me create a study plan for my calculus exam next week."
- "Create 5 flashcards about the American Civil War."
- "What are some effective study techniques for memorizing vocabulary?"
- "Can you break down the steps to solve quadratic equations?"

## Integration with BookAura

This chat assistant is part of the BookAura application's StudyHub feature, providing students with AI-powered study assistance.

## API Endpoints

The server exposes the following API endpoints:

- `POST /api/chat/session` - Create a new chat session
- `POST /api/chat/message` - Send a message to the AI and get a response
