from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import models, schemas, auth
from ..database import get_db
from ..ai_service import generate_flashcards

router = APIRouter(prefix="/api/decks", tags=["decks"])

@router.post("/", response_model=schemas.Deck, status_code=status.HTTP_201_CREATED)
def create_deck(
    deck: schemas.DeckCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_deck = models.Deck(**deck.model_dump(), owner_id=current_user.id)
    db.add(db_deck)
    db.commit()
    db.refresh(db_deck)
    return db_deck

@router.get("/", response_model=List[schemas.Deck])
def read_decks(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    decks = db.query(models.Deck).filter(models.Deck.owner_id == current_user.id).offset(skip).limit(limit).all()
    return decks

@router.get("/{deck_id}", response_model=schemas.Deck)
def read_deck(
    deck_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    deck = db.query(models.Deck).filter(
        models.Deck.id == deck_id,
        models.Deck.owner_id == current_user.id
    ).first()
    if deck is None:
        raise HTTPException(status_code=404, detail="Deck not found")
    return deck

@router.delete("/{deck_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_deck(
    deck_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    deck = db.query(models.Deck).filter(
        models.Deck.id == deck_id,
        models.Deck.owner_id == current_user.id
    ).first()
    if deck is None:
        raise HTTPException(status_code=404, detail="Deck not found")
    db.delete(deck)
    db.commit()
    return None

@router.post("/{deck_id}/generate", response_model=dict)
def generate_deck_flashcards(
    deck_id: int,
    count: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Generate flashcards for a deck using AI based on the deck's topic.
    """
    # Verify deck ownership
    deck = db.query(models.Deck).filter(
        models.Deck.id == deck_id,
        models.Deck.owner_id == current_user.id
    ).first()
    if deck is None:
        raise HTTPException(status_code=404, detail="Deck not found")

    try:
        # Generate flashcards using AI
        flashcards_data = generate_flashcards(deck.topic, count)

        # Create flashcard records in database
        created_count = 0
        for card_data in flashcards_data:
            flashcard = models.Flashcard(
                question=card_data['question'],
                answer=card_data['answer'],
                hint=card_data.get('hint'),
                deck_id=deck_id
            )
            db.add(flashcard)
            created_count += 1

        db.commit()

        return {
            "message": f"Successfully generated {created_count} flashcards",
            "count": created_count
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate flashcards: {str(e)}")

@router.post("/{deck_id}/reset-mastery", status_code=status.HTTP_200_OK)
def reset_deck_mastery(
    deck_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Reset mastery levels of all flashcards in a deck to 0.
    """
    # Verify deck ownership
    deck = db.query(models.Deck).filter(
        models.Deck.id == deck_id,
        models.Deck.owner_id == current_user.id
    ).first()
    if deck is None:
        raise HTTPException(status_code=404, detail="Deck not found")

    # Reset all flashcards
    db.query(models.Flashcard).filter(
        models.Flashcard.deck_id == deck_id
    ).update({
        "mastery_level": 0
    })

    db.commit()

    return {"message": "Mastery levels reset successfully"}
