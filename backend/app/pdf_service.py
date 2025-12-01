import os
import base64
from io import BytesIO
from typing import List, Dict, Optional
from pathlib import Path

try:
    from PyPDF2 import PdfReader
    from pdf2image import convert_from_path
    from PIL import Image
except ImportError as e:
    raise ImportError(f"PDF processing dependencies not installed: {e}")

from openai import OpenAI
from .config import settings


class PDFProcessingError(Exception):
    """Custom exception for PDF processing errors"""
    pass


def extract_text_from_pdf(pdf_path: str) -> Dict[int, str]:
    """
    Extract text from PDF using PyPDF2.

    Args:
        pdf_path: Path to the PDF file

    Returns:
        Dictionary mapping page number to extracted text
    """
    try:
        reader = PdfReader(pdf_path)
        page_texts = {}

        for page_num, page in enumerate(reader.pages, start=1):
            text = page.extract_text()
            page_texts[page_num] = text if text else ""

        return page_texts
    except Exception as e:
        raise PDFProcessingError(f"Failed to extract text from PDF: {str(e)}")


def is_text_extraction_sufficient(text: str, min_chars: int = 50) -> bool:
    """
    Determine if text extraction was successful.

    Args:
        text: Extracted text from a PDF page
        min_chars: Minimum number of characters to consider extraction successful

    Returns:
        True if extraction appears successful, False otherwise
    """
    if not text:
        return False

    # Remove whitespace and count meaningful characters
    meaningful_text = ''.join(text.split())
    return len(meaningful_text) >= min_chars


def convert_pdf_page_to_base64_image(pdf_path: str, page_num: int) -> str:
    """
    Convert a specific PDF page to a base64-encoded image.

    Args:
        pdf_path: Path to the PDF file
        page_num: Page number to convert (1-indexed)

    Returns:
        Base64-encoded image string
    """
    try:
        # Convert specific page to image
        images = convert_from_path(
            pdf_path,
            first_page=page_num,
            last_page=page_num,
            dpi=200
        )

        if not images:
            raise PDFProcessingError(f"Failed to convert page {page_num} to image")

        # Convert to base64
        img = images[0]
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

        return img_base64
    except Exception as e:
        raise PDFProcessingError(f"Failed to convert PDF page to image: {str(e)}")


def extract_text_from_image_with_vision(image_base64: str, page_num: int) -> str:
    """
    Extract text from an image using OpenAI's Vision API.

    Args:
        image_base64: Base64-encoded image
        page_num: Page number for context

    Returns:
        Extracted text from the image
    """
    if not settings.OPENAI_API_KEY:
        raise PDFProcessingError("OpenAI API key not configured")

    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert at extracting text and understanding content from document images. Extract all text, equations, diagrams, and meaningful content from the image. Preserve mathematical notation and formatting."
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": f"This is page {page_num} of a document. Please extract and describe all content, including text, equations, diagrams, and any visual elements that convey information."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{image_base64}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=4096
        )

        return response.choices[0].message.content
    except Exception as e:
        raise PDFProcessingError(f"Failed to extract text using Vision API: {str(e)}")


def process_pdf_hybrid(pdf_path: str) -> str:
    """
    Process a PDF using hybrid approach: text extraction + vision API fallback.

    Args:
        pdf_path: Path to the PDF file

    Returns:
        Combined text from all pages
    """
    print(f"Processing PDF: {pdf_path}")

    # First, try text extraction for all pages
    page_texts = extract_text_from_pdf(pdf_path)

    combined_content = []

    for page_num, text in page_texts.items():
        print(f"Processing page {page_num}...")

        # Check if text extraction was sufficient
        if is_text_extraction_sufficient(text):
            print(f"  Using text extraction for page {page_num}")
            combined_content.append(f"=== Page {page_num} ===\n{text}")
        else:
            # Fall back to vision API
            print(f"  Using Vision API for page {page_num} (insufficient text extraction)")
            try:
                image_base64 = convert_pdf_page_to_base64_image(pdf_path, page_num)
                vision_text = extract_text_from_image_with_vision(image_base64, page_num)
                combined_content.append(f"=== Page {page_num} (Vision API) ===\n{vision_text}")
            except Exception as e:
                print(f"  Warning: Failed to process page {page_num} with Vision API: {e}")
                combined_content.append(f"=== Page {page_num} ===\n[Error processing page]")

    return "\n\n".join(combined_content)


def process_multiple_pdfs(pdf_paths: List[str]) -> str:
    """
    Process multiple PDFs and combine their content.

    Args:
        pdf_paths: List of paths to PDF files

    Returns:
        Combined text from all PDFs
    """
    all_content = []

    for idx, pdf_path in enumerate(pdf_paths, start=1):
        print(f"\nProcessing PDF {idx}/{len(pdf_paths)}: {Path(pdf_path).name}")
        try:
            content = process_pdf_hybrid(pdf_path)
            filename = Path(pdf_path).name
            all_content.append(f"{'=' * 80}\nDocument: {filename}\n{'=' * 80}\n\n{content}")
        except Exception as e:
            print(f"Error processing {pdf_path}: {e}")
            all_content.append(f"{'=' * 80}\nDocument: {Path(pdf_path).name}\n{'=' * 80}\n\n[Error: {str(e)}]")

    return "\n\n".join(all_content)


def get_pdf_metadata(pdf_path: str) -> Dict:
    """
    Get metadata about a PDF file.

    Args:
        pdf_path: Path to the PDF file

    Returns:
        Dictionary with metadata (page_count, file_size, etc.)
    """
    try:
        reader = PdfReader(pdf_path)
        file_size = os.path.getsize(pdf_path)

        return {
            "page_count": len(reader.pages),
            "file_size": file_size,
            "file_size_mb": round(file_size / (1024 * 1024), 2)
        }
    except Exception as e:
        raise PDFProcessingError(f"Failed to get PDF metadata: {str(e)}")
