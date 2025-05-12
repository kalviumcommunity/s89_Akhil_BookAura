import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight, Plus, Upload, FileText, Trash, Trash2 } from 'lucide-react';
import StudyHubNavbar from '../../components/StudyHubNavbar';
import './Flashcards.css';

const Flashcards = () => {
  const [decks, setDecks] = useState([]);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [deckTitle, setDeckTitle] = useState('');
  const [deckDescription, setDeckDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deckToDelete, setDeckToDelete] = useState(null);

  useEffect(() => {
    fetchDecks();
  }, []);

  const fetchDecks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/flashcards/decks', {
        withCredentials: true
      });
      setDecks(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching flashcard decks:', err);
      setError('Failed to load flashcard decks. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDeckDetails = async (deckId) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/flashcards/decks/${deckId}`, {
        withCredentials: true
      });
      setSelectedDeck(response.data.data);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setError(null);
    } catch (err) {
      console.error('Error fetching deck details:', err);
      setError('Failed to load flashcard deck. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadFile || !deckTitle) return;
    
    try {
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append('pdfFile', uploadFile);
      formData.append('title', deckTitle);
      formData.append('description', deckDescription);
      
      const response = await axios.post(
        'http://localhost:5000/api/flashcards/generate',
        formData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          }
        }
      );
      
      // Reset form and close modal
      setUploadFile(null);
      setDeckTitle('');
      setDeckDescription('');
      setUploadModalOpen(false);
      
      // Refresh the decks list
      await fetchDecks();
      
      // Show success message or notification
      alert('Flashcards generated successfully!');
      
    } catch (err) {
      console.error('Error generating flashcards:', err);
      alert('Failed to generate flashcards. Please try again later.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
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

  const handleDeleteDeck = async () => {
    if (!deckToDelete) return;
  
    try {
      await axios.delete(`http://localhost:5000/api/flashcards/decks/${deckToDelete._id}`, {
        withCredentials: true
      });
  
      // Refresh the decks list
      await fetchDecks();
  
      // Close the delete modal
      setDeleteModalOpen(false);
      setDeckToDelete(null);
    } catch (err) {
      console.error('Error deleting deck:', err);
      alert('Failed to delete deck. Please try again later.');
    }
  };

  const openDeleteModal = (deck) => {
    setDeckToDelete(deck);
    setDeleteModalOpen(true);
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

  // Render the delete confirmation modal
  const renderDeleteModal = () => {
    if (!deleteModalOpen) return null;

    return (
      <div className="delete-modal-overlay">
        <div className="delete-modal">
          <h2>Delete Flashcard Deck</h2>
          <p>Are you sure you want to delete "{deckToDelete?.title}"?</p>
          <p className="delete-warning">This action cannot be undone.</p>
          
          <div className="modal-actions">
            <button 
              className="cancel-button"
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancel
            </button>
            <button 
              className="delete-confirm-button"
              onClick={handleDeleteDeck}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
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

    if (decks.length === 0) {
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
          {decks.map(deck => (
            <div key={deck._id} className="deck-card">
              <div className="deck-card-content">
                <h3>{deck.title}</h3>
                <button
                  onClick={() => openDeleteModal(deck)}
                  className="delete-button"
                >
                  <Trash2 size={16} /> Delete
                </button>
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
      <StudyHubNavbar />

      <div className="flashcards-content">
        <div className="flashcards-header">
          <h1>Flashcards</h1>
          <p>Create and review flashcards to reinforce your learning</p>
        </div>

        {selectedDeck ? renderFlashcardStudy() : renderDeckList()}
        {renderUploadModal()}
        {renderDeleteModal()}
      </div>
    </div>
  );
};

export default Flashcards;


