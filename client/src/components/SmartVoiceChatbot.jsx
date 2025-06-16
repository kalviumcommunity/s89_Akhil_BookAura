// SmartVoiceChatbot.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './FloatingVoiceChatbot.css';

const SmartVoiceChatbot = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [messages, setMessages] = useState([]);
  const navigate = useNavigate();
  const recognitionRef = useRef(null);
  const synth = window.speechSynthesis;

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    synth.cancel();
    synth.speak(utterance);
  };

  const getNavigationTarget = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('study') || lower.includes('studyhub')) return '/studyhub';
    if (lower.includes('home') || lower.includes('main page')) return '/';
    if (lower.includes('library') || lower.includes('books')) return '/books';
    if (lower.includes('marketplace')) return '/marketplace';
    if (lower.includes('cart')) return '/cart';
    if (lower.includes('flashcard')) return '/flashcards';
    if (lower.includes('pomodoro') || lower.includes('timer')) return '/pomodoro';
    if (lower.includes('login')) return '/login';
    if (lower.includes('signup') || lower.includes('register')) return '/signup';
    return null;
  };

  const processVoiceCommand = (text) => {
    const path = getNavigationTarget(text);
    if (path) {
      navigate(path);
      speak(`Navigating to ${path.replace('/', '') || 'home'}`);
    } else {
      speak("I couldn't understand. Try saying: go to StudyHub, Library, Marketplace, Cart, or Home.");
    }
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim();
      console.log('Transcript:', transcript);

      if (!chatOpen && transcript.toLowerCase().includes('hey chatbot')) {
        setChatOpen(true);
        speak("Hi! I'm listening.");
        return;
      }

      setMessages((prev) => [...prev, { role: 'user', text: transcript }]);
      processVoiceCommand(transcript);
    };

    recognition.onend = () => {
      if (listening) recognition.start();
    };

    recognitionRef.current = recognition;
  }, [chatOpen, listening, navigate]);

  useEffect(() => {
    const handleShortcut = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'm') {
        setChatOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  };

  return (
    <>
      <div className="floating-icon" onClick={() => setChatOpen(true)}>💬</div>
      {chatOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <span>Voice Assistant</span>
            <button onClick={() => setChatOpen(false)}>×</button>
          </div>
          <div className="chat-body">
            {messages.map((msg, i) => (
              <div key={i} className={`msg ${msg.role}`}>{msg.text}</div>
            ))}
          </div>
          <div className="chat-footer">
            <button onClick={toggleListening}>
              {listening ? '🎤 Stop Listening' : '🎙️ Start Listening'}
            </button>
            <small>Say "Hey chatbot" or press Ctrl + M</small>
          </div>
        </div>
      )}
    </>
  );
};

export default SmartVoiceChatbot;
