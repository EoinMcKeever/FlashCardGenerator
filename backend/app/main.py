from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, decks, flashcards, pdfs
import os

Base.metadata.create_all(bind=engine)

app = FastAPI(title="FlashCard Generator API", version="1.0.0")

# CORS configuration for both local development and production
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
]

# Add production frontend URL if set
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(decks.router)
app.include_router(flashcards.router)
app.include_router(pdfs.router)

@app.get("/")
def read_root():
    return {"message": "FlashCard Generator API", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
