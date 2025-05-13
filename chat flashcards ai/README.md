# Flashcard Generator API

This is a standalone API service that uses Google's Gemini AI to generate flashcards from PDF documents. It's designed to work with the BookAura application but can be used independently as well.

## Features

- Accepts PDF file uploads
- Uses Gemini AI to analyze PDF content and generate flashcards
- Returns flashcards in JSON format with question/answer pairs
- Simple REST API interface

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file with the following variables:
   ```
   PORT=5001
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Running the API

Start the server:
```
npm start
```

For development with auto-restart:
```
npm run dev
```

## API Endpoints

### Health Check
```
GET /health
```
Returns the status of the API.

### Generate Flashcards
```
POST /chatbot-file
```

**Request:**
- Content-Type: multipart/form-data
- Body: 
  - file: PDF file (required)

**Response:**
```json
[
  {
    "question": "What is the main topic of this document?",
    "answer": "The document discusses artificial intelligence and its applications."
  },
  {
    "question": "What are the three main branches of AI mentioned?",
    "answer": "Machine Learning, Natural Language Processing, and Computer Vision."
  },
  ...
]
```

## Integration with BookAura

This API is designed to be used with the BookAura application. The frontend component in `client/src/pages/studyhub/AiChat.jsx` sends PDF files to this API and displays the generated flashcards.

The server component in `server/routes/FlashcardRouter.js` also uses this API to generate flashcards and store them in the MongoDB database.

## Error Handling

The API includes error handling for:
- Missing files
- Unsupported file types
- AI processing errors
- Parsing errors

## Limitations

- Maximum file size: 10MB
- Only PDF files are supported
- Processing large PDFs may take some time
