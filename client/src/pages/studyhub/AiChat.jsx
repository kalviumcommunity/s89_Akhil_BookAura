import React, { useState, useRef, useEffect } from 'react';
import './AiChat.css';
import Navbar from '../../components/StudyHubNavbar';
import { Send, Loader2 } from 'lucide-react';

const AiChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef(null);

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

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!inputMessage.trim()) return;

    // Add user message to chat
    const userMessage = {
      text: inputMessage,
      sender: 'user'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Send message to API
      const response = await fetch('http://localhost:8080/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputMessage }),
      });

      const data = await response.json();

      // Add AI response to chat
      setMessages(prev => [
        ...prev,
        { text: data.response, sender: 'ai' }
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message to chat
      setMessages(prev => [
        ...prev,
        { text: 'Sorry, I encountered an error. Please try again.', sender: 'ai' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="aichat-container">
      <Navbar />
      <div className="aichat-content">
        <div className="aichat-header">
          <h1>AI Study Assistant</h1>
          <p>
            Ask me anything about your studies, and I'll help you understand concepts,
            create study plans, or answer questions about your course materials.
          </p>
        </div>

        <div className="chat-container">
          <div className="chat-messages" ref={chatContainerRef}>
            {messages.length === 0 ? (
              <div className="welcome-message">
                <h2>Hello! How can I help with your studies today?</h2>
                <div className="suggestion-chips">
                  <button
                    onClick={() => setInputMessage("Can you explain the concept of photosynthesis?")}
                    className="suggestion-chip"
                  >
                    Explain photosynthesis
                  </button>
                  <button
                    onClick={() => setInputMessage("Help me create a study plan for my exam next week.")}
                    className="suggestion-chip"
                  >
                    Create a study plan
                  </button>
                  <button
                    onClick={() => setInputMessage("What are some effective study techniques?")}
                    className="suggestion-chip"
                  >
                    Study techniques
                  </button>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`message ${message.sender === 'user' ? 'user-message' : 'ai-message'}`}
                >
                  <div className="message-content">
                    <span className="message-sender">
                      {message.sender === 'user' ? 'You' : 'AI Assistant'}
                    </span>
                    {message.sender === 'user' ? (
                      <p>{message.text}</p>
                    ) : (
                      <div
                        className="ai-formatted-response"
                        dangerouslySetInnerHTML={{
                          __html: formatAIResponse(message.text)
                        }}
                      />
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

          <form className="chat-input" onSubmit={handleSendMessage}>
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
