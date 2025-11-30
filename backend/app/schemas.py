from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional

class UserBase(BaseModel):
    email: EmailStr
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class FlashcardBase(BaseModel):
    question: str
    answer: str

class FlashcardCreate(FlashcardBase):
    pass

class Flashcard(FlashcardBase):
    id: int
    deck_id: int
    mastery_level: int
    times_reviewed: int
    created_at: datetime

    class Config:
        from_attributes = True

class FlashcardUpdate(BaseModel):
    mastery_level: Optional[int] = None
    times_reviewed: Optional[int] = None

class DeckBase(BaseModel):
    title: str
    description: Optional[str] = None
    topic: str

class DeckCreate(DeckBase):
    pass

class Deck(DeckBase):
    id: int
    owner_id: int
    created_at: datetime
    flashcards: List[Flashcard] = []

    class Config:
        from_attributes = True
