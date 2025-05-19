import React, { useState, useEffect } from 'react';
import LeftNavbar from '../../components/StudyHubNavbar';
import './Flashcards.css';
import { Upload, Plus, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../services/api';

const Flashcards = () => {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [deckTitle, setDeckTitle] = useState('');
  const [deckDescription, setDeckDescription] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Fetch flashcard decks on component mount
  useEffect(() => {
    fetchDecks();
  }, []);

  const fetchDecks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/flashcards/decks');

      // Ensure we're working with an array
      const decksData = Array.isArray(response.data) ? response.data : [];
      console.log('Fetched decks:', decksData);

      setDecks(decksData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching flashcard decks:', err);
      setError('Failed to load flashcard decks. Please try again later.');
      setLoading(false);
    }
  };

  const fetchDeckDetails = async (deckId) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/flashcards/decks/${deckId}`);

      // Ensure we have a valid deck object with flashcards array
      const deckData = response.data;
      console.log('Fetched deck details:', deckData);

      if (deckData && !deckData.flashcards) {
        // If flashcards is missing, initialize it as an empty array
        deckData.flashcards = [];
      }

      setSelectedDeck(deckData);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching deck details:', err);
      setError('Failed to load flashcard deck. Please try again later.');
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setUploadFile(file);
    } else {
      alert('Please select a PDF file');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setUploadFile(file);
    } else {
      alert('Please drop a PDF file');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!uploadFile) {
      alert('Please select a PDF file');
      return;
    }

    if (!deckTitle.trim()) {
      alert('Please enter a title for the flashcard deck');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Create form data
      const formData = new FormData();
      formData.append('pdf', uploadFile); // Changed from 'pdfFile' to 'pdf' to match server expectation
      formData.append('title', deckTitle);
      formData.append('description', deckDescription);

      // Show initial progress for file upload
      setUploadProgress(10);

      // First phase: Upload the file
      const response = await api.post('/api/flashcards/generate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          // Calculate upload progress (up to 50%)
          const percentCompleted = Math.round((progressEvent.loaded * 40) / progressEvent.total);
          setUploadProgress(10 + percentCompleted); // Start at 10%, go up to 50%
        }
      });

      // Second phase: Processing by AI (simulated progress)
      // Since we can't track actual AI processing progress, we'll simulate it
      setUploadProgress(50); // File is uploaded, now processing

      // Simulate progress updates during AI processing
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 5;
        });
      }, 1000);

      // Success! Clear the interval and set to 100%
      clearInterval(interval);
      setUploadProgress(100);

      // Reset form and state
      setIsUploading(false);
      setUploadModalOpen(false);
      setUploadFile(null);
      setDeckTitle('');
      setDeckDescription('');

      // Refresh the decks list
      await fetchDecks();

      // Show success message with the number of flashcards generated
      const responseData = response.data;
      const flashcardCount = responseData && responseData.data && responseData.data.flashcardCount
        ? responseData.data.flashcardCount
        : 'multiple';
      alert(`Success! Generated ${flashcardCount} flashcards from your PDF.`);

    } catch (err) {
      console.error('Error uploading PDF:', err);
      setIsUploading(false);

      // Extract error message from response if available
      const errorMessage = err.response && err.response.data && err.response.data.message
        ? err.response.data.message
        : 'Failed to generate flashcards. Please try again.';

      alert(errorMessage);
    } finally {
      // Ensure progress is reset if there was an error
      if (isUploading) {
        setUploadProgress(0);
      }
    }
  };

  const handleNextCard = () => {
    if (selectedDeck && currentCardIndex < selectedDeck.flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevCard = () => {
    if (selectedDeck && currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleFlipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const handleBackToDeckList = () => {
    setSelectedDeck(null);
  };

  // Render the upload modal
  const renderUploadModal = () => {
    if (!uploadModalOpen) return null;

    return (
      <div className="upload-modal-overlay">
        <div className="upload-modal">
          <h2>Upload PDF for Flashcards</h2>
          <form onSubmit={handleUpload}>
            <div className="form-group">
              <label htmlFor="deckTitle">Deck Title (required)</label>
              <input
                type="text"
                id="deckTitle"
                value={deckTitle}
                onChange={(e) => setDeckTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="deckDescription">Description (optional)</label>
              <textarea
                id="deckDescription"
                value={deckDescription}
                onChange={(e) => setDeckDescription(e.target.value)}
              />
            </div>

            <div
              className={`file-drop-area ${dragActive ? 'active' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {uploadFile ? (
                <div className="selected-file">
                  <FileText size={24} />
                  <span>{uploadFile.name}</span>
                </div>
              ) : (
                <>
                  <Upload size={32} />
                  <p>Drag & drop a PDF file here, or click to browse</p>
                </>
              )}
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="file-input"
              />
            </div>

            {isUploading && (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <span>{uploadProgress}%</span>
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => setUploadModalOpen(false)}
                disabled={isUploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="upload-button"
                disabled={!uploadFile || !deckTitle || isUploading}
              >
                {isUploading ? 'Processing...' : 'Generate Flashcards'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Render the flashcard study interface
  const renderFlashcardStudy = () => {
    if (!selectedDeck || !selectedDeck.flashcards || selectedDeck.flashcards.length === 0) {
      return (
        <div className="no-flashcards">
          <p>This deck has no flashcards.</p>
          <button onClick={handleBackToDeckList}>Back to Decks</button>
        </div>
      );
    }

    const currentCard = selectedDeck.flashcards[currentCardIndex];

    return (
      <div className="flashcard-study">
        <div className="study-header">
          <button onClick={handleBackToDeckList} className="back-button">
            <ChevronLeft size={16} /> Back to Decks
          </button>
          <h2>{selectedDeck.title}</h2>
          <p>Card {currentCardIndex + 1} of {selectedDeck.flashcards.length}</p>
        </div>

        <div
          className={`flashcard ${isFlipped ? 'flipped' : ''}`}
          onClick={handleFlipCard}
        >
          <div className="flashcard-inner">
            <div className="flashcard-front">
              <p>{currentCard.question}</p>
              <div className="flip-hint">Click to flip</div>
            </div>
            <div className="flashcard-back">
              <p>{currentCard.answer}</p>
              <div className="flip-hint">Click to flip</div>
            </div>
          </div>
        </div>

        <div className="study-controls">
          <button
            onClick={handlePrevCard}
            disabled={currentCardIndex === 0}
            className="nav-button"
          >
            <ChevronLeft size={20} /> Previous
          </button>
          <button
            onClick={handleNextCard}
            disabled={currentCardIndex === selectedDeck.flashcards.length - 1}
            className="nav-button"
          >
            Next <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  };

  // Render the deck list
  const renderDeckList = () => {
    if (loading) {
      return <div className="loading">Loading flashcard decks...</div>;
    }

    if (error) {
      return <div className="error">{error}</div>;
    }

    if (!decks || decks.length === 0) {
      return (
        <div className="no-decks">
          <p>You don't have any flashcard decks yet.</p>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="create-deck-button"
          >
            <Plus size={16} /> Create Your First Deck
          </button>
        </div>
      );
    }

    return (
      <div className="deck-list">
        <div className="deck-list-header">
          <h2>Your Flashcard Decks</h2>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="create-deck-button"
          >
            <Plus size={16} /> Create New Deck
          </button>
        </div>

        <div className="deck-grid">
          {Array.isArray(decks) && decks.map(deck => (
            <div key={deck._id} className="deck-card">
              <div className="deck-card-content">
                <h3>{deck.title}</h3>
                <p className="deck-description">{deck.description || 'No description'}</p>
                <p className="deck-date">Created: {new Date(deck.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="deck-card-actions">
                <button
                  onClick={() => fetchDeckDetails(deck._id)}
                  className="study-button"
                >
                  Study
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flashcards-container">
      <LeftNavbar />

      <div className="flashcards-content">
        <div className="flashcards-header">
          <h1>Flashcards</h1>
          <p>Create and review flashcards to reinforce your learning</p>
        </div>

        {selectedDeck ? renderFlashcardStudy() : renderDeckList()}
        {renderUploadModal()}
      </div>
    </div>
  );
};

export default Flashcards;