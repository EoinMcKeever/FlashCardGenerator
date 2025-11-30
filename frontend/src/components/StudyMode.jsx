import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { flashcardsAPI, decksAPI } from '../utils/api';

function StudyMode() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const [deck, setDeck] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeckAndFlashcards();
  }, [deckId]);

  const fetchDeckAndFlashcards = async () => {
    try {
      const [deckResponse, flashcardsResponse] = await Promise.all([
        decksAPI.getDeck(deckId),
        flashcardsAPI.getFlashcards(deckId)
      ]);
      setDeck(deckResponse.data);
      setFlashcards(flashcardsResponse.data.sort((a, b) => a.mastery_level - b.mastery_level));
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKnow = async () => {
    const currentCard = flashcards[currentIndex];
    try {
      await flashcardsAPI.updateFlashcard(deckId, currentCard.id, {
        mastery_level: currentCard.mastery_level + 1,
        times_reviewed: currentCard.times_reviewed + 1
      });
      moveToNext();
    } catch (err) {
      console.error('Failed to update flashcard', err);
    }
  };

  const handleDontKnow = async () => {
    const currentCard = flashcards[currentIndex];
    try {
      await flashcardsAPI.updateFlashcard(deckId, currentCard.id, {
        mastery_level: Math.max(0, currentCard.mastery_level - 1),
        times_reviewed: currentCard.times_reviewed + 1
      });
      moveToNext();
    } catch (err) {
      console.error('Failed to update flashcard', err);
    }
  };

  const moveToNext = () => {
    setShowAnswer(false);
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      if (window.confirm('You have completed all flashcards! Would you like to restart?')) {
        setCurrentIndex(0);
        fetchDeckAndFlashcards();
      } else {
        navigate(`/deck/${deckId}`);
      }
    }
  };

  if (loading) return <div>Loading...</div>;

  if (!flashcards || flashcards.length === 0) {
    return (
      <div>
        <div className="nav">
          <h1>Study Mode</h1>
          <button onClick={() => navigate(`/deck/${deckId}`)}>Back to Deck</button>
        </div>
        <div className="container">
          <p>No flashcards to study!</p>
        </div>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <div>
      <div className="nav">
        <h1>{deck?.title} - Study Mode</h1>
        <button onClick={() => navigate(`/deck/${deckId}`)}>Exit Study Mode</button>
      </div>

      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <p>Card {currentIndex + 1} of {flashcards.length}</p>
          <div style={{ width: '100%', backgroundColor: '#ddd', height: '10px', borderRadius: '5px', marginTop: '10px' }}>
            <div
              style={{
                width: `${((currentIndex + 1) / flashcards.length) * 100}%`,
                backgroundColor: '#4CAF50',
                height: '100%',
                borderRadius: '5px',
                transition: 'width 0.3s'
              }}
            />
          </div>
        </div>

        <div className="flashcard" onClick={() => setShowAnswer(!showAnswer)}>
          <h2>{showAnswer ? 'Answer' : 'Question'}</h2>
          <p>{showAnswer ? currentCard.answer : currentCard.question}</p>
          <p style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
            {showAnswer ? 'Click to show question' : 'Click to reveal answer'}
          </p>
        </div>

        {showAnswer && (
          <div className="flashcard-controls">
            <button
              onClick={handleDontKnow}
              style={{ backgroundColor: '#f44336' }}
            >
              Don't Know
            </button>
            <button
              onClick={handleKnow}
              style={{ backgroundColor: '#4CAF50' }}
            >
              Know
            </button>
          </div>
        )}

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Mastery Level: {currentCard.mastery_level} | Times Reviewed: {currentCard.times_reviewed}
          </p>
        </div>
      </div>
    </div>
  );
}

export default StudyMode;
