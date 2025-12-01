# PDF-Based Flashcard Generation - Setup Guide

## Overview
This feature allows you to upload PDFs to your flashcard decks and generate AI-powered flashcards based on the PDF content with custom learning instructions.

### Key Features
- Upload multiple PDFs per deck (max 50 MB each)
- Hybrid PDF processing (text extraction + Vision API for complex content)
- AI-generated flashcards with custom learning instructions
- PDF viewer with zoom and page navigation
- Support for prerequisite knowledge generation

## Setup Instructions

### 1. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

New dependencies added:
- `PyPDF2==3.0.1` - PDF text extraction
- `pdf2image==1.16.3` - Convert PDF pages to images
- `Pillow==10.1.0` - Image processing
- `pypdf==3.17.4` - Additional PDF utilities

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

New dependencies added:
- `react-pdf@^7.7.0` - PDF viewer component
- `pdfjs-dist@^3.11.174` - PDF.js library

### 3. System Dependencies (for pdf2image)

**Ubuntu/Debian:**
```bash
sudo apt-get install poppler-utils
```

**macOS:**
```bash
brew install poppler
```

**Windows:**
Download and install poppler from: https://github.com/oschwartz10612/poppler-windows/releases

### 4. Database Migration

The new `pdf_documents` table will be created automatically when you restart the backend server, thanks to:
```python
Base.metadata.create_all(bind=engine)  # in backend/app/main.py
```

### 5. Start the Application

**Backend:**
```bash
cd backend
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm run dev
```

## Usage Guide

### 1. Upload a PDF

1. Navigate to a deck
2. In the "PDF Documents" section, click "Upload PDF"
3. Select a PDF file (max 50 MB)
4. Wait for upload to complete

### 2. View PDF

- Click the "View" button next to any uploaded PDF
- Use the zoom and page navigation controls
- Close the viewer by clicking the X or outside the modal

### 3. Generate Flashcards from PDFs

1. Upload at least one PDF to your deck
2. Click "Generate Flashcards from PDFs"
3. Enter your learning instructions, for example:
   - "Teach me all the relevant mathematics required to understand this material"
   - "Create flashcards covering the key concepts and include prerequisite knowledge"
   - "Focus on the mathematical foundations needed for machine learning"
4. Click "Generate 100 Flashcards"
5. Wait for the AI to process the PDFs and generate flashcards

### 4. Hybrid PDF Processing

The system automatically:
- Tries text extraction first (fast, cost-effective)
- Falls back to Vision API for pages with:
  - Complex mathematical equations
  - Diagrams and images
  - Poor text extraction quality
  - Scanned documents

## API Endpoints

### PDF Management
- `POST /api/decks/{deck_id}/pdfs/` - Upload PDF
- `GET /api/decks/{deck_id}/pdfs/` - List PDFs
- `GET /api/decks/{deck_id}/pdfs/{pdf_id}/file` - Get PDF file
- `DELETE /api/decks/{deck_id}/pdfs/{pdf_id}` - Delete PDF

### Flashcard Generation
- `POST /api/decks/{deck_id}/generate-from-pdfs` - Generate from PDFs
  - Body: `{ "instructions": "...", "count": 100 }`

## Example Instructions

Here are some example instructions you can use when generating flashcards from PDFs:

1. **Math Prerequisites:**
   ```
   Teach me all the relevant mathematics that is required to understand the topics in these PDFs. Include foundational concepts even if they're not explicitly covered.
   ```

2. **Comprehensive Learning:**
   ```
   Create comprehensive flashcards covering both the main concepts in the documents and any prerequisite knowledge I need to understand them fully.
   ```

3. **Specific Focus:**
   ```
   Focus on the statistical methods and their mathematical foundations. Include prerequisite knowledge about probability theory and linear algebra.
   ```

4. **Progressive Learning:**
   ```
   Create flashcards that progress from basic concepts to advanced topics, including all necessary prerequisite knowledge for a beginner.
   ```

## Troubleshooting

### PDF Upload Fails
- Check file size (must be < 50 MB)
- Ensure file is a valid PDF
- Check backend logs for errors

### Vision API Errors
- Verify OpenAI API key is configured
- Check API quota and billing
- Ensure GPT-4 Vision access is enabled

### PDF Viewer Not Loading
- Check browser console for errors
- Verify PDF file is accessible
- Ensure react-pdf dependencies are installed

### Poppler Not Found (pdf2image)
- Install system dependencies (see Setup Instructions #3)
- Restart backend after installation

## File Structure

```
backend/
├── app/
│   ├── models.py           # Added PDFDocument model
│   ├── schemas.py          # Added PDFDocument schemas
│   ├── pdf_service.py      # NEW: PDF processing service
│   ├── ai_service.py       # Enhanced with PDF generation
│   └── routers/
│       ├── pdfs.py         # NEW: PDF management endpoints
│       └── decks.py        # Added generate-from-pdfs endpoint
├── uploads/
│   └── pdfs/               # NEW: PDF storage directory
└── requirements.txt        # Updated with PDF dependencies

frontend/
├── src/
│   ├── components/
│   │   ├── PDFViewer.jsx   # NEW: PDF viewer component
│   │   └── DeckView.jsx    # Enhanced with PDF features
│   └── utils/
│       └── api.js          # Added pdfsAPI
└── package.json            # Updated with react-pdf
```

## Cost Considerations

- **Text extraction:** No additional cost
- **Vision API:** ~$0.01 per page with complex content
- **Flashcard generation:** Standard GPT-4o-mini pricing
- Optimize costs by using high-quality, text-based PDFs when possible

## Security Notes

- PDFs are stored in `backend/uploads/pdfs/` with UUID filenames
- Access is restricted by deck ownership
- Maximum file size is enforced (50 MB)
- Only PDF files are accepted
