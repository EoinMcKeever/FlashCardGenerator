import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { flashcardsAPI, decksAPI } from '../utils/api';

function StudyMode() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const [deck, setDeck] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [cardQueue, setCardQueue] = useState([]);
  const [currentCard, setCurrentCard] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showHint, setShowHint] = useState(false);
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
      const sortedCards = flashcardsResponse.data.sort((a, b) => a.mastery_level - b.mastery_level);
      setFlashcards(sortedCards);
      return sortedCards;
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  // Initialize queue when flashcards are loaded
  useEffect(() => {
    if (flashcards.length > 0) {
      const queue = flashcards.map(card => card.id);
      setCardQueue(queue);
      setCurrentCard(flashcards.find(c => c.id === queue[0]));
    }
  }, [flashcards]);

  const handleKnow = async () => {
    if (!currentCard) return;

    const newMasteryLevel = currentCard.mastery_level + 1;

    try {
      // Update DB: increment mastery level
      await flashcardsAPI.updateFlashcard(deckId, currentCard.id, {
        mastery_level: newMasteryLevel,
        times_reviewed: currentCard.times_reviewed + 1
      });

      let newQueue;

      if (newMasteryLevel >= 5) {
        // Card is mastered - remove from queue
        newQueue = cardQueue.slice(1);
      } else {
        // Card not yet mastered - move to back of queue
        newQueue = [...cardQueue.slice(1), currentCard.id];
      }

      if (newQueue.length === 0) {
        // All cards are mastered! Reset everything
        await decksAPI.resetMastery(deckId);
        alert('🎉 All cards mastered! Resetting deck to start fresh.');
        // Reload and restart
        await fetchDeckAndFlashcards();
      } else {
        // Fetch updated flashcards
        const response = await flashcardsAPI.getFlashcards(deckId);
        const updatedFlashcards = response.data;
        setFlashcards(updatedFlashcards);

        // Move to next card
        setCardQueue(newQueue);
        setCurrentCard(updatedFlashcards.find(c => c.id === newQueue[0]));
      }

      setShowAnswer(false);
      setShowHint(false);
    } catch (err) {
      console.error('Failed to update flashcard', err);
    }
  };

  const handleDontKnow = async () => {
    if (!currentCard) return;

    try {
      // Update DB: decrement mastery level (minimum 0)
      await flashcardsAPI.updateFlashcard(deckId, currentCard.id, {
        mastery_level: Math.max(0, currentCard.mastery_level - 1),
        times_reviewed: currentCard.times_reviewed + 1
      });

      // Always move to end of queue (card needs more practice)
      const newQueue = [...cardQueue.slice(1), currentCard.id];

      // Fetch updated flashcards
      const response = await flashcardsAPI.getFlashcards(deckId);
      const updatedFlashcards = response.data;
      setFlashcards(updatedFlashcards);

      // Move to next card in queue
      setCardQueue(newQueue);
      setCurrentCard(updatedFlashcards.find(c => c.id === newQueue[0]));

      setShowAnswer(false);
      setShowHint(false);
    } catch (err) {
      console.error('Failed to update flashcard', err);
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

  if (!currentCard) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="nav">
        <h1>{deck?.title} - Study Mode</h1>
        <button onClick={() => navigate(`/deck/${deckId}`)}>Exit Study Mode</button>
      </div>

      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <p>{cardQueue.length} cards remaining (Mastery: {currentCard.mastery_level}/5)</p>
          <div style={{ width: '100%', backgroundColor: '#ddd', height: '10px', borderRadius: '5px', marginTop: '10px' }}>
            <div
              style={{
                width: `${((flashcards.length - cardQueue.length) / flashcards.length) * 100}%`,
                backgroundColor: '#4CAF50',
                height: '100%',
                borderRadius: '5px',
                transition: 'width 0.3s'
              }}
            />
          </div>
        </div>

        <div className="flashcard">
          <h2>{showAnswer ? 'Answer' : 'Question'}</h2>
          <p>{showAnswer ? currentCard.answer : currentCard.question}</p>

          {!showAnswer && showHint && currentCard.hint && (
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '5px', border: '1px solid #ffc107' }}>
              <strong>Hint:</strong> {currentCard.hint}
            </div>
          )}

          {!showAnswer && !showHint && currentCard.hint && (
            <button
              onClick={() => setShowHint(true)}
              style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#ffc107', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
            >
              Show Hint
            </button>
          )}

          <button
            onClick={() => setShowAnswer(!showAnswer)}
            style={{ marginTop: '20px', padding: '10px 20px', width: '100%', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            {showAnswer ? 'Show Question' : 'Show Answer'}
          </button>
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
