import React, { useState, useRef, useEffect } from 'react';
import './AiChat.css';
import Navbar from '../../components/StudyHubNavbar';
import { Send, Loader2, Image, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const AiChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChatHistoryLoading, setIsChatHistoryLoading] = useState(false);
  const chatContainerRef = useRef(null);
  const { isLoggedIn } = useAuth();

  // Function to format AI responses with better styling
  const formatAIResponse = (text) => {
    if (!text) return '';

    // Replace markdown-style formatting with HTML classes
    let formattedText = text
      // Replace headers
      .replace(/^### (.*$)/gim, '<h3 class="ai-heading-3">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="ai-heading-2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="ai-heading-1">$1</h1>')
      // Replace bold and italic
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      // Replace bullet lists
      .replace(/^\s*[\*\-] (.+)$/gim, '<li>$1</li>')
      // Replace numbered lists
      .replace(/^\s*(\d+)\. (.+)$/gim, '<li>$1. $2</li>')
      // Add paragraph tags
      .replace(/^([^<].+)$/gim, '<p>$1</p>')
      // Fix multiple line breaks
      .replace(/<\/p>\s*<p>/gim, '</p><p>')
      // Group list items
      .replace(/(<li>.*<\/li>)/gis, '<ul class="ai-list">$1</ul>')
      // Fix nested lists
      .replace(/<\/ul>\s*<ul class="ai-list">/gim, '')
      // Add line breaks
      .replace(/\n/gim, '<br>');
    return formattedText;
  };

  const handleImageUpload = (e) => {
    e.preventDefault(); // Prevent form submission

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        console.log("Selected file:", file.name, file.type, file.size);
        handleSendMessageWithImage(file);
      }
    };
    fileInput.click();
  };

  const handleSendMessageWithImage = async (file) => {
    // Check file size
    if (file.size > 5 * 1024 * 1024) {
      const errorMessage = {
        text: 'The image is too large. Please use an image smaller than 5MB.',
        sender: 'ai'
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      const errorMessage = {
        text: 'Please upload an image file (JPG, PNG, GIF, etc).',
        sender: 'ai'
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    const imageMessage = "Analyze this image and provide information about it.";
    const userMessage = {
      text: `[Image uploaded: ${file.name}] ${imageMessage}`,
      sender: 'user'
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    if (isLoggedIn) {
      saveToChatHistory(userMessage.text, 'user');
    }

    // Generate a random userId if not available
    const userId = localStorage.getItem('chatUserId') ||
                  (() => {
                    const id = Math.random().toString(36).substring(2, 15);
                    localStorage.setItem('chatUserId', id);
                    return id;
                  })();

    // Create FormData object for file upload
    const formData = new FormData();
    formData.append('image', file); // 'image' must match the field name expected by multer
    formData.append('message', imageMessage);
    formData.append('userId', userId);

    console.log("Sending image:", file.name, file.type, `${(file.size/1024).toFixed(2)}KB`, "with userId:", userId);

    try {
      // Use the base URL from our API service but make a direct fetch call
      // This is because the chat API is a separate service
      const baseUrl = api.defaults.baseURL;
      const chatUrl = `${baseUrl}/api/chat`;

      console.log('Sending image to:', chatUrl);

      // Use fetch instead of axios for better compatibility with FormData
      const response = await fetch(chatUrl, {
        method: 'POST',
        headers: {
          // Include auth token if available
          ...(localStorage.getItem('authToken') ? {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          } : {})
          // Don't set Content-Type header, browser will set it with boundary for FormData
        },
        credentials: 'include', // Include cookies
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();
      console.log('AI response received for image:', data);

      const aiMessage = { text: data.response, sender: 'ai' };
      setMessages(prev => [...prev, aiMessage]);

      if (isLoggedIn) {
        await saveToChatHistory(aiMessage.text, 'ai');
      }
    } catch (error) {
      console.error('Error sending message with image:', error);

      // Log more detailed error information
      if (error.response) {
        console.error('Server response:', error.response.status, error.response.data);
      }

      let errorMessage;
      if (error.message.includes('413')) {
        errorMessage = { text: 'The image is too large. Please try with a smaller image (under 5MB).', sender: 'ai' };
      } else if (error.message.includes('415')) {
        errorMessage = { text: 'This file type is not supported. Please upload a JPG, PNG, or GIF image.', sender: 'ai' };
      } else {
        errorMessage = { text: 'Sorry, I encountered an error processing your image. Please try again.', sender: 'ai' };
      }

      setMessages(prev => [...prev, errorMessage]);

      if (isLoggedIn) {
        saveToChatHistory(errorMessage.text, 'ai');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      console.log('User is logged in, loading chat history...');
      loadChatHistory();
    } else {
      console.log('User is not logged in, skipping chat history load');
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      setIsChatHistoryLoading(true);
      console.log('Loading chat history...');
      const response = await api.get('/api/chat-history');

      if (response.data.success) {
        console.log('Chat history loaded successfully:', response.data.data.length, 'messages');
        setMessages(response.data.data);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    } finally {
      setIsChatHistoryLoading(false);
    }
  };

  const saveToChatHistory = async (text, sender) => {
    if (!isLoggedIn) {
      console.log('Not saving message to history - user not logged in');
      return;
    }

    try {
      console.log('Saving message to chat history:', { text, sender });
      const response = await api.post('/api/chat-history', { text, sender });
      console.log('Message saved successfully:', response.data);
    } catch (error) {
      console.error('Error saving message to chat history:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    }
  };

  const clearChatHistory = async () => {
    if (!isLoggedIn) {
      console.log('Not clearing history - user not logged in');
      return;
    }

    try {
      console.log('Clearing chat history...');
      const response = await api.delete('/api/chat-history');
      if (response.data.success) {
        console.log('Chat history cleared successfully');
        setMessages([]);
      }
    } catch (error) {
      console.error('Error clearing chat history:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!inputMessage.trim()) return;

    const userMessage = { text: inputMessage, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Save user message to chat history
    if (isLoggedIn) {
      await saveToChatHistory(userMessage.text, 'user');
    }

    try {
      // Generate a random userId if not available
      const userId = localStorage.getItem('chatUserId') ||
                    (() => {
                      const id = Math.random().toString(36).substring(2, 15);
                      localStorage.setItem('chatUserId', id);
                      return id;
                    })();

      console.log('Sending message to AI chat service with userId:', userId);

      // Use the base URL from our API service but make a direct fetch call
      // This is because the chat API is a separate service
      const baseUrl = api.defaults.baseURL;
      const chatUrl = `${baseUrl}/api/chat`;

      console.log('Sending request to:', chatUrl);

      const response = await fetch(chatUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include auth token if available
          ...(localStorage.getItem('authToken') ? {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          } : {})
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify({
          userId: userId,
          message: inputMessage,
          prompt: inputMessage // Include both for compatibility
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();
      console.log('AI response received:', data);

      const aiMessage = { text: data.response, sender: 'ai' };
      setMessages(prev => [...prev, aiMessage]);

      // Save AI response to chat history
      if (isLoggedIn) {
        await saveToChatHistory(aiMessage.text, 'ai');
      }
    } catch (error) {
      console.error('Error sending message:', error);

      // Log detailed error information
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }

      const errorMessage = {
        text: 'Sorry, I encountered an error. Please try again. ' +
              (error.message ? `(${error.message})` : ''),
        sender: 'ai'
      };
      setMessages(prev => [...prev, errorMessage]);

      if (isLoggedIn) {
        await saveToChatHistory(errorMessage.text, 'ai');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="aichat-container">
      <Navbar />
      <div className="aichat-content">
        <div className="aichat-header">
          <div className="aichat-header-top">
            <h1>AI Study Assistant</h1>
            {isLoggedIn && messages.length > 0 && (
              <button onClick={clearChatHistory} className="clear-history-button" title="Clear chat history">
                <Trash2 size={16} />
                <span>Clear History</span>
              </button>
            )}
          </div>
          <p>Ask me anything about your studies, and I'll help you understand concepts, create study plans, or answer questions about your course materials.</p>
        </div>

        <div className="chat-container">
          <div className="chat-messages" ref={chatContainerRef}>
            {messages.length === 0 ? (
              <div className="welcome-message">
                <h2>Hello! How can I help with your studies today?</h2>
                <div className="suggestion-chips">
                  <button onClick={() => setInputMessage("Can you explain the concept of photosynthesis?")} className="suggestion-chip">Explain photosynthesis</button>
                  <button onClick={() => setInputMessage("Help me create a study plan for my exam next week.")} className="suggestion-chip">Create a study plan</button>
                  <button onClick={() => setInputMessage("What are some effective study techniques?")} className="suggestion-chip">Study techniques</button>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={index} className={`message ${message.sender === 'user' ? 'user-message' : 'ai-message'}`}>
                  <div className="message-content">
                    <span className="message-sender">{message.sender === 'user' ? 'You' : 'AI Assistant'}</span>
                    {message.sender === 'user' ? (
                      <p>{message.text}</p>
                    ) : (
                      <div className="ai-formatted-response" dangerouslySetInnerHTML={{ __html: formatAIResponse(message.text) }} />
                    )}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="message ai-message">
                <div className="message-content">
                  <span className="message-sender">AI Assistant</span>
                  <div className="typing-indicator">
                    <Loader2 className="animate-spin" size={16} />
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Desktop input (part of chat container) */}
          <div className="desktop-input">
            <form className="chat-input" onSubmit={handleSendMessage}>
              <button
                onClick={handleImageUpload}
                className="border-none"
                disabled={isLoading}
                title="Upload an image for analysis"
                type="button"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={26} />
                ) : (
                  <Image size={26} />
                )}
              </button>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your question here..."
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="send-button"
                title="Send message"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Mobile input (fixed at bottom) */}
        <div className="mobile-input-container">
          <form className="chat-input" onSubmit={handleSendMessage}>
            <button
              onClick={handleImageUpload}
              className="border-none"
              disabled={isLoading}
              title="Upload an image for analysis"
              type="button"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={26} />
              ) : (
                <Image size={26} />
              )}
            </button>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your question here..."
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="send-button"
              title="Send message"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Send size={18} />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AiChat;
