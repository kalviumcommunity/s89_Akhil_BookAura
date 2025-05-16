require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate flashcards from a PDF file using Google's Gemini AI
 * 
 * @param {Buffer} fileBuffer - The PDF file buffer
 * @param {string} fileName - The name of the file
 * @param {string} mimeType - The MIME type of the file
 * @returns {Promise<Array>} - Array of flashcard objects with question and answer fields
 */
async function generateFlashcardsFromPDF(fileBuffer, fileName, mimeType) {
  try {
    console.log('Generating flashcards from PDF:', fileName);
    
    // Check if file is a PDF
    if (mimeType !== 'application/pdf') {
      console.log('Invalid file type:', mimeType);
      throw new Error('Only PDF files are supported');
    }

    // Convert file to base64 for Gemini API
    console.log('Converting file to base64');
    const base64Data = fileBuffer.toString("base64");
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
    return flashcards;
  } catch (error) {
    console.error('Error in flashcard generation service:', error);
    
    // Enhance error message for common issues
    if (error.message && error.message.includes('INVALID_ARGUMENT')) {
      throw new Error('The PDF file could not be processed by the AI. It may be too large, corrupted, or contain unsupported content.');
    }

    if (error.message && error.message.includes('PERMISSION_DENIED')) {
      throw new Error('API key error: Permission denied. Please check your Gemini API key.');
    }
    
    throw error;
  }
}

/**
 * Test the Gemini API connection
 * 
 * @returns {Promise<string>} - The response from the Gemini API
 */
async function testGeminiConnection() {
  try {
    console.log('Testing Gemini API connection...');
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello, can you respond with 'API is working'?");
    const responseText = result.response.text();
    console.log('Gemini API test response:', responseText);
    return responseText;
  } catch (error) {
    console.error('Gemini API test failed:', error);
    throw error;
  }
}

module.exports = {
  generateFlashcardsFromPDF,
  testGeminiConnection
};
