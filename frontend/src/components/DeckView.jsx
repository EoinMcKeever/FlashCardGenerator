import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { decksAPI, flashcardsAPI } from '../utils/api';

function DeckView() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const [deck, setDeck] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchDeck();
    fetchFlashcards();
  }, [deckId]);

  const fetchDeck = async () => {
    try {
      const response = await decksAPI.getDeck(deckId);
      setDeck(response.data);
    } catch (err) {
      setError('Failed to fetch deck');
    }
  };

  const fetchFlashcards = async () => {
    try {
      const response = await flashcardsAPI.getFlashcards(deckId);
      setFlashcards(response.data);
    } catch (err) {
      setError('Failed to fetch flashcards');
    }
  };

  const handleCreateFlashcard = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await flashcardsAPI.createFlashcard(deckId, { question, answer });
      setQuestion('');
      setAnswer('');
      setShowCreateForm(false);
      fetchFlashcards();
    } catch (err) {
      setError('Failed to create flashcard');
    }
  };

  const handleDeleteFlashcard = async (flashcardId) => {
    if (window.confirm('Are you sure you want to delete this flashcard?')) {
      try {
        await flashcardsAPI.deleteFlashcard(deckId, flashcardId);
        fetchFlashcards();
      } catch (err) {
        setError('Failed to delete flashcard');
      }
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!window.confirm('Generate 10 AI-powered flashcards based on the deck topic?')) {
      return;
    }

    setGenerating(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await decksAPI.generateFlashcards(deckId, 10);
      setSuccessMessage(response.data.message);
      fetchFlashcards();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate flashcards. Make sure OpenAI API key is configured.');
    } finally {
      setGenerating(false);
    }
  };

  if (!deck) return <div>Loading...</div>;

  return (
    <div>
      <div className="nav">
        <h1>{deck.title}</h1>
        <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>

      <div className="container">
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <p><strong>Topic:</strong> {deck.topic}</p>
          {deck.description && <p><strong>Description:</strong> {deck.description}</p>}
          <p><strong>Total Flashcards:</strong> {flashcards.length}</p>
        </div>

        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => setShowCreateForm(!showCreateForm)} style={{ width: 'auto', padding: '10px 20px' }}>
            {showCreateForm ? 'Cancel' : 'Add Flashcard'}
          </button>
          <button
            onClick={handleGenerateFlashcards}
            disabled={generating}
            style={{ width: 'auto', padding: '10px 20px', backgroundColor: '#9C27B0' }}
          >
            {generating ? 'Generating...' : 'Generate with AI'}
          </button>
          {flashcards.length > 0 && (
            <button
              onClick={() => navigate(`/deck/${deckId}/study`)}
              style={{ width: 'auto', padding: '10px 20px', backgroundColor: '#2196F3' }}
            >
              Start Studying
            </button>
          )}
        </div>

        {error && <p className="error">{error}</p>}
        {successMessage && <p className="success">{successMessage}</p>}

        {showCreateForm && (
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
            <h3>Add Flashcard</h3>
            <form onSubmit={handleCreateFlashcard}>
              <div className="form-group">
                <label>Question</label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Answer</label>
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  required
                />
              </div>
              <button type="submit">Add Flashcard</button>
            </form>
          </div>
        )}

        <h2>Flashcards</h2>
        {flashcards.length === 0 ? (
          <p>No flashcards yet. Add your first flashcard to start studying!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {flashcards.map(flashcard => (
              <div key={flashcard.id} style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
                <p><strong>Q:</strong> {flashcard.question}</p>
                <p><strong>A:</strong> {flashcard.answer}</p>
                <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                  Mastery Level: {flashcard.mastery_level} | Times Reviewed: {flashcard.times_reviewed}
                </p>
                <button
                  onClick={() => handleDeleteFlashcard(flashcard.id)}
                  style={{ width: 'auto', padding: '8px 16px', backgroundColor: '#f44336', marginTop: '10px' }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DeckView;
