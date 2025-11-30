import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { decksAPI } from '../utils/api';

function Dashboard() {
  const [decks, setDecks] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [error, setError] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDecks();
  }, []);

  const fetchDecks = async () => {
    try {
      const response = await decksAPI.getDecks();
      setDecks(response.data);
    } catch (err) {
      setError('Failed to fetch decks');
    }
  };

  const handleCreateDeck = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await decksAPI.createDeck({ title, description, topic });
      setTitle('');
      setDescription('');
      setTopic('');
      setShowCreateForm(false);
      fetchDecks();
    } catch (err) {
      setError('Failed to create deck');
    }
  };

  const handleDeleteDeck = async (deckId) => {
    if (window.confirm('Are you sure you want to delete this deck?')) {
      try {
        await decksAPI.deleteDeck(deckId);
        fetchDecks();
      } catch (err) {
        setError('Failed to delete deck');
      }
    }
  };

  return (
    <div>
      <div className="nav">
        <h1>FlashCard Generator</h1>
        <div>
          <span style={{ marginRight: '20px' }}>Welcome, {user?.username}!</span>
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      <div className="container">
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>My Decks</h2>
          <button onClick={() => setShowCreateForm(!showCreateForm)} style={{ width: 'auto', padding: '10px 20px' }}>
            {showCreateForm ? 'Cancel' : 'Create New Deck'}
          </button>
        </div>

        {error && <p className="error">{error}</p>}

        {showCreateForm && (
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
            <h3>Create New Deck</h3>
            <form onSubmit={handleCreateDeck}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description (optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <button type="submit">Create Deck</button>
            </form>
          </div>
        )}

        {decks.length === 0 ? (
          <p>No decks yet. Create your first deck to get started!</p>
        ) : (
          <div className="deck-grid">
            {decks.map(deck => (
              <div key={deck.id} className="deck-card">
                <h3>{deck.title}</h3>
                <p><strong>Topic:</strong> {deck.topic}</p>
                {deck.description && <p>{deck.description}</p>}
                <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                  {deck.flashcards?.length || 0} flashcards
                </p>
                <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                  <button onClick={() => navigate(`/deck/${deck.id}`)} style={{ width: 'auto', flex: 1 }}>
                    View Deck
                  </button>
                  <button
                    onClick={() => handleDeleteDeck(deck.id)}
                    style={{ width: 'auto', flex: 1, backgroundColor: '#f44336' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
