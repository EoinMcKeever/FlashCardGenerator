from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, decks, flashcards

Base.metadata.create_all(bind=engine)

app = FastAPI(title="FlashCard Generator API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(decks.router)
app.include_router(flashcards.router)

@app.get("/")
def read_root():
    return {"message": "FlashCard Generator API", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
