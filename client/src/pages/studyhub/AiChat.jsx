import React, { useState, useRef, useEffect } from 'react';
import './AiChat.css';
import Navbar from '../../components/StudyHubNavbar';
import { Send, Loader2, Image, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const AiChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChatHistoryLoading, setIsChatHistoryLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const mobileTextareaRef = useRef(null);
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

        // Set the selected image and create a preview URL
        setSelectedImage(file);
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);

        // Focus the textarea for the user to add a message
        if (window.innerWidth > 768) {
          textareaRef.current?.focus();
        } else {
          mobileTextareaRef.current?.focus();
        }
      }
    };
    fileInput.click();
  };

  // Function to remove the selected image
  const removeSelectedImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview); // Clean up the URL object
    }
    setSelectedImage(null);
    setImagePreview('');
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadChatHistory();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-resize textarea based on content
  const autoResizeTextarea = (textarea) => {
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Set the height to scrollHeight to fit the content
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  // Handle input change with auto-resize
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    autoResizeTextarea(e.target);
  };

  const loadChatHistory = async () => {
    try {
      setIsChatHistoryLoading(true);

      // Get auth token from localStorage
      const authToken = localStorage.getItem('authToken');

      const response = await axios.get('https://s89-akhil-bookaura-2.onrender.com/api/chat-history', {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${authToken || ''}`
        }
      });

      if (response.data.success) {
        setMessages(response.data.data);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setIsChatHistoryLoading(false);
    }
  };

  const saveToChatHistory = async (text, sender) => {
    if (!isLoggedIn) return;

    try {
      // Get auth token from localStorage
      const authToken = localStorage.getItem('authToken');

      await axios.post('https://s89-akhil-bookaura-2.onrender.com/api/chat-history',
        { text, sender },
        {
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${authToken || ''}`
          }
        }
      );
    } catch (error) {
      console.error('Error saving message to chat history:', error);
    }
  };

  const clearChatHistory = async () => {
    if (!isLoggedIn) return;

    try {
      // Get auth token from localStorage
      const authToken = localStorage.getItem('authToken');

      const response = await axios.delete('https://s89-akhil-bookaura-2.onrender.com/api/chat-history', {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${authToken || ''}`
        }
      });

      if (response.data.success) setMessages([]);
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  };

  const handleKeyDown = (e) => {
    // If Shift+Enter is pressed, add a new line
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault(); // Prevent form submission
      setInputMessage(prev => prev + '\n');
    }
    // If only Enter is pressed (without Shift), submit the form
    else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent default textarea behavior
      handleSendMessage(e);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    // If there's no message and no image, don't do anything
    if (!inputMessage.trim() && !selectedImage) return;

    // Reset textarea height after sending message
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    if (mobileTextareaRef.current) mobileTextareaRef.current.style.height = 'auto';

    // If there's an image, send the message with the image
    if (selectedImage) {
      // Create message text - use input message if provided, otherwise use a default
      const messageText = inputMessage.trim()
        ? inputMessage
        : "Please analyze this image.";

      // Create a message object with image preview for display
      const userMessage = {
        text: messageText,
        sender: 'user',
        image: imagePreview,
        imageName: selectedImage.name
      };

      setMessages(prev => [...prev, userMessage]);
      setInputMessage('');
      setIsLoading(true);

      if (isLoggedIn) {
        saveToChatHistory(`[Image: ${selectedImage.name}] ${messageText}`, 'user');
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
      formData.append('image', selectedImage);
      formData.append('message', messageText);
      formData.append('userId', userId);

      try {
        // Get auth token from localStorage
        const authToken = localStorage.getItem('authToken');

        // Use fetch instead of axios for better compatibility with FormData
        const response = await fetch('https://s89-akhil-bookaura-1.onrender.com/api/chat', {
          method: 'POST',
          body: formData, // Don't set Content-Type header, browser will set it with boundary
          headers: {
            'Authorization': `Bearer ${authToken || ''}`
          }
        });

        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }

        const data = await response.json();
        const aiMessage = { text: data.response, sender: 'ai' };

        setMessages(prev => [...prev, aiMessage]);

        if (isLoggedIn) {
          saveToChatHistory(aiMessage.text, 'ai');
        }
      } catch (error) {
        console.error('Error sending message with image:', error);

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
        // Clean up the image preview URL and reset states
        if (imagePreview) {
          URL.revokeObjectURL(imagePreview);
        }
        setSelectedImage(null);
        setImagePreview('');
      }
      return;
    }

    // If there's no image, just send the text message
    const userMessage = { text: inputMessage, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    if (isLoggedIn) {
      saveToChatHistory(userMessage.text, 'user');
    }

    try {
      // Generate a random userId if not available
      const userId = localStorage.getItem('chatUserId') ||
                    (() => {
                      const id = Math.random().toString(36).substring(2, 15);
                      localStorage.setItem('chatUserId', id);
                      return id;
                    })();

      // Get auth token from localStorage
      const authToken = localStorage.getItem('authToken');

      const response = await fetch('https://s89-akhil-bookaura-1.onrender.com/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken || ''}`
        },
        body: JSON.stringify({
          userId: userId,
          message: inputMessage,
          prompt: inputMessage // Include both for compatibility
        }),
      });

      const data = await response.json();
      const aiMessage = { text: data.response, sender: 'ai' };
      setMessages(prev => [...prev, aiMessage]);

      if (isLoggedIn) {
        saveToChatHistory(aiMessage.text, 'ai');
      }
    } catch (error) {
      console.error('Error sending message:', error);

      const errorMessage = { text: 'Sorry, I encountered an error. Please try again.', sender: 'ai' };
      setMessages(prev => [...prev, errorMessage]);

      if (isLoggedIn) {
        saveToChatHistory(errorMessage.text, 'ai');
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
                      <div className="user-message-content">
                        {message.image && (
                          <div className="message-image-container">
                            <img
                              src={message.image}
                              alt={message.imageName || "Uploaded image"}
                              className="message-image"
                            />
                          </div>
                        )}
                        <p style={{ whiteSpace: 'pre-wrap' }}>{message.text}</p>
                      </div>
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
            {imagePreview && (
              <div className="image-preview-container">
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <button
                    className="remove-image-btn"
                    onClick={removeSelectedImage}
                    title="Remove image"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="image-preview-hint">Add a message to send with this image (optional)</p>
              </div>
            )}
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
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={selectedImage ? "Add a message to send with your image (optional)" : "Type your question here... (Shift+Enter for new line)"}
                disabled={isLoading}
                rows={1}
                className="chat-textarea"
              />
              <button
                type="submit"
                disabled={isLoading || (!selectedImage && !inputMessage.trim())}
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
          {imagePreview && (
            <div className="image-preview-container mobile">
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" />
                <button
                  className="remove-image-btn"
                  onClick={removeSelectedImage}
                  title="Remove image"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="image-preview-hint">Add a message to send with this image (optional)</p>
            </div>
          )}
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
            <textarea
              ref={mobileTextareaRef}
              value={inputMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={selectedImage ? "Add a message to send with your image (optional)" : "Type your question here... (Shift+Enter for new line)"}
              disabled={isLoading}
              rows={1}
              className="chat-textarea"
            />
            <button
              type="submit"
              disabled={isLoading || (!selectedImage && !inputMessage.trim())}
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
