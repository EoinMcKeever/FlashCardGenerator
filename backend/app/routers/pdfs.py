import os
import uuid
from typing import List
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db
from ..pdf_service import get_pdf_metadata

router = APIRouter(prefix="/api/decks", tags=["pdfs"])

# Configuration
UPLOAD_DIR = Path(__file__).parent.parent.parent / "uploads" / "pdfs"
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB
ALLOWED_EXTENSIONS = {".pdf"}


def verify_deck_ownership(deck_id: int, user_id: int, db: Session) -> models.Deck:
    """Helper function to verify deck ownership"""
    deck = db.query(models.Deck).filter(
        models.Deck.id == deck_id,
        models.Deck.owner_id == user_id
    ).first()
    if deck is None:
        raise HTTPException(status_code=404, detail="Deck not found")
    return deck


@router.post("/{deck_id}/pdfs/", response_model=schemas.PDFDocument, status_code=status.HTTP_201_CREATED)
async def upload_pdf(
    deck_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Upload a PDF file to a deck.
    """
    # Verify deck ownership
    deck = verify_deck_ownership(deck_id, current_user.id, db)

    # Validate file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Only PDF files are allowed."
        )

    # Read file content and check size
    file_content = await file.read()
    file_size = len(file_content)

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE / (1024 * 1024):.0f} MB"
        )

    if file_size == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = UPLOAD_DIR / unique_filename

    # Ensure upload directory exists
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    # Save file
    try:
        with open(file_path, "wb") as f:
            f.write(file_content)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save file: {str(e)}"
        )

    # Verify PDF is valid and get metadata
    try:
        metadata = get_pdf_metadata(str(file_path))
    except Exception as e:
        # Clean up file if validation fails
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(
            status_code=400,
            detail=f"Invalid or corrupted PDF file: {str(e)}"
        )

    # Create database record
    pdf_document = models.PDFDocument(
        deck_id=deck_id,
        filename=file.filename,
        file_path=str(file_path),
        file_size=file_size
    )
    db.add(pdf_document)
    db.commit()
    db.refresh(pdf_document)

    return pdf_document


@router.get("/{deck_id}/pdfs/", response_model=List[schemas.PDFDocument])
def list_pdfs(
    deck_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    List all PDFs associated with a deck.
    """
    # Verify deck ownership
    verify_deck_ownership(deck_id, current_user.id, db)

    # Get all PDFs for this deck
    pdfs = db.query(models.PDFDocument).filter(
        models.PDFDocument.deck_id == deck_id
    ).order_by(models.PDFDocument.created_at.desc()).all()

    return pdfs


@router.delete("/{deck_id}/pdfs/{pdf_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pdf(
    deck_id: int,
    pdf_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Delete a PDF file from a deck.
    """
    # Verify deck ownership
    verify_deck_ownership(deck_id, current_user.id, db)

    # Get PDF document
    pdf_document = db.query(models.PDFDocument).filter(
        models.PDFDocument.id == pdf_id,
        models.PDFDocument.deck_id == deck_id
    ).first()

    if pdf_document is None:
        raise HTTPException(status_code=404, detail="PDF not found")

    # Delete physical file
    file_path = Path(pdf_document.file_path)
    if file_path.exists():
        try:
            file_path.unlink()
        except Exception as e:
            # Log error but continue with database deletion
            print(f"Warning: Failed to delete file {file_path}: {e}")

    # Delete database record
    db.delete(pdf_document)
    db.commit()

    return None


@router.get("/{deck_id}/pdfs/{pdf_id}/file")
def get_pdf_file(
    deck_id: int,
    pdf_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """
    Serve a PDF file for viewing/download.
    """
    # Verify deck ownership
    verify_deck_ownership(deck_id, current_user.id, db)

    # Get PDF document
    pdf_document = db.query(models.PDFDocument).filter(
        models.PDFDocument.id == pdf_id,
        models.PDFDocument.deck_id == deck_id
    ).first()

    if pdf_document is None:
        raise HTTPException(status_code=404, detail="PDF not found")

    # Check if file exists
    file_path = Path(pdf_document.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="PDF file not found on server")

    # Return file
    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=pdf_document.filename
    )
