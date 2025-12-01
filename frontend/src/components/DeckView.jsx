import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { decksAPI, flashcardsAPI, pdfsAPI } from '../utils/api';
import PDFViewer from './PDFViewer';

function DeckView() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const [deck, setDeck] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [hint, setHint] = useState('');
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // PDF-related state
  const [pdfs, setPdfs] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [pdfInstructions, setPdfInstructions] = useState('');
  const [showPdfGenerateForm, setShowPdfGenerateForm] = useState(false);

  useEffect(() => {
    fetchDeck();
    fetchFlashcards();
    fetchPdfs();
  }, [deckId]);

  const fetchDeck = async () => {
    try {
      const response = await decksAPI.getDeck(deckId);
      setDeck(response.data);
    } catch (err) {
      setError('Failed to fetch deck');
    }
  };

  const fetchFlashcards = async () => {
    try {
      const response = await flashcardsAPI.getFlashcards(deckId);
      setFlashcards(response.data);
    } catch (err) {
      setError('Failed to fetch flashcards');
    }
  };

  const handleCreateFlashcard = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await flashcardsAPI.createFlashcard(deckId, { question, answer, hint });
      setQuestion('');
      setAnswer('');
      setHint('');
      setShowCreateForm(false);
      fetchFlashcards();
    } catch (err) {
      setError('Failed to create flashcard');
    }
  };

  const handleDeleteFlashcard = async (flashcardId) => {
    if (window.confirm('Are you sure you want to delete this flashcard?')) {
      try {
        await flashcardsAPI.deleteFlashcard(deckId, flashcardId);
        fetchFlashcards();
      } catch (err) {
        setError('Failed to delete flashcard');
      }
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!window.confirm('Generate 100 AI-powered flashcards with hints based on the deck topic?')) {
      return;
    }

    setGenerating(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await decksAPI.generateFlashcards(deckId, 100);
      setSuccessMessage(response.data.message);
      fetchFlashcards();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate flashcards. Make sure OpenAI API key is configured.');
    } finally {
      setGenerating(false);
    }
  };

  // PDF Functions
  const fetchPdfs = async () => {
    try {
      const response = await pdfsAPI.getPDFs(deckId);
      setPdfs(response.data);
    } catch (err) {
      console.error('Failed to fetch PDFs:', err);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      await uploadPdf(file);
    }
  };

  const uploadPdf = async (file) => {
    // Validate file
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are allowed');
      return;
    }

    const maxSize = 50 * 1024 * 1024; // 50 MB
    if (file.size > maxSize) {
      setError('File size exceeds 50 MB limit');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      await pdfsAPI.uploadPDF(deckId, file, (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress(percentCompleted);
      });
      setSuccessMessage('PDF uploaded successfully!');
      fetchPdfs();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload PDF');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeletePdf = async (pdfId) => {
    if (window.confirm('Are you sure you want to delete this PDF?')) {
      try {
        await pdfsAPI.deletePDF(deckId, pdfId);
        setSuccessMessage('PDF deleted successfully');
        fetchPdfs();
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        setError('Failed to delete PDF');
      }
    }
  };

  const handleViewPdf = (pdf) => {
    setSelectedPdf(pdf);
    setShowPdfViewer(true);
  };

  const handleGenerateFromPdfs = async (e) => {
    e.preventDefault();

    if (pdfs.length === 0) {
      setError('Please upload at least one PDF first');
      return;
    }

    if (!pdfInstructions.trim()) {
      setError('Please provide instructions for flashcard generation');
      return;
    }

    setGenerating(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await decksAPI.generateFlashcardsFromPDFs(
        deckId,
        pdfInstructions,
        100
      );
      setSuccessMessage(response.data.message);
      setPdfInstructions('');
      setShowPdfGenerateForm(false);
      fetchFlashcards();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate flashcards from PDFs');
    } finally {
      setGenerating(false);
    }
  };

  if (!deck) return <div>Loading...</div>;

  return (
    <div>
      <div className="nav">
        <h1>{deck.title}</h1>
        <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>

      <div className="container">
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <p><strong>Topic:</strong> {deck.topic}</p>
          {deck.description && <p><strong>Description:</strong> {deck.description}</p>}
          <p><strong>Total Flashcards:</strong> {flashcards.length}</p>
          <p><strong>PDFs Uploaded:</strong> {pdfs.length}</p>
        </div>

        {/* PDF Upload Section */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3 style={{ marginTop: 0 }}>PDF Documents</h3>

          {/* Upload Button */}
          <div style={{ marginBottom: '15px' }}>
            <input
              type="file"
              id="pdf-upload"
              accept=".pdf"
              onChange={handleFileSelect}
              disabled={uploading}
              style={{ display: 'none' }}
            />
            <label
              htmlFor="pdf-upload"
              style={{
                display: 'inline-block',
                padding: '10px 20px',
                backgroundColor: uploading ? '#ccc' : '#4CAF50',
                color: 'white',
                borderRadius: '4px',
                cursor: uploading ? 'not-allowed' : 'pointer',
              }}
            >
              {uploading ? `Uploading... ${uploadProgress}%` : 'Upload PDF'}
            </label>
            <span style={{ marginLeft: '10px', fontSize: '14px', color: '#666' }}>
              (Max 50 MB, PDF files only)
            </span>
          </div>

          {/* PDF List */}
          {pdfs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pdfs.map((pdf) => (
                <div
                  key={pdf.id}
                  style={{
                    border: '1px solid #ddd',
                    padding: '15px',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <strong>{pdf.filename}</strong>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                      Size: {(pdf.file_size / 1024 / 1024).toFixed(2)} MB |
                      Uploaded: {new Date(pdf.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleViewPdf(pdf)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#2196F3',
                        width: 'auto',
                      }}
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDeletePdf(pdf.id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#f44336',
                        width: 'auto',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#666', fontStyle: 'italic' }}>
              No PDFs uploaded yet. Upload a PDF to generate flashcards from it.
            </p>
          )}

          {/* Generate from PDFs button */}
          {pdfs.length > 0 && (
            <div style={{ marginTop: '15px' }}>
              <button
                onClick={() => setShowPdfGenerateForm(!showPdfGenerateForm)}
                style={{
                  width: 'auto',
                  padding: '10px 20px',
                  backgroundColor: '#FF9800',
                }}
              >
                {showPdfGenerateForm ? 'Cancel' : 'Generate Flashcards from PDFs'}
              </button>
            </div>
          )}

          {/* PDF Generation Form */}
          {showPdfGenerateForm && (
            <div style={{ marginTop: '15px', padding: '15px', border: '1px solid #ddd', borderRadius: '4px' }}>
              <form onSubmit={handleGenerateFromPdfs}>
                <div className="form-group">
                  <label>
                    <strong>Instructions for AI:</strong>
                    <br />
                    <span style={{ fontSize: '14px', color: '#666' }}>
                      Tell the AI what you want to learn from these PDFs
                      (e.g., "Teach me all the prerequisite math needed to understand this material")
                    </span>
                  </label>
                  <textarea
                    value={pdfInstructions}
                    onChange={(e) => setPdfInstructions(e.target.value)}
                    placeholder="Example: Teach me all the relevant mathematics that is required to understand the topics in these PDFs. Include foundational concepts even if they're not explicitly covered."
                    required
                    rows="4"
                    style={{ width: '100%', padding: '10px', fontSize: '14px' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={generating}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: generating ? '#ccc' : '#FF9800',
                  }}
                >
                  {generating ? 'Generating...' : 'Generate 100 Flashcards'}
                </button>
              </form>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => setShowCreateForm(!showCreateForm)} style={{ width: 'auto', padding: '10px 20px' }}>
            {showCreateForm ? 'Cancel' : 'Add Flashcard'}
          </button>
          <button
            onClick={handleGenerateFlashcards}
            disabled={generating}
            style={{ width: 'auto', padding: '10px 20px', backgroundColor: '#9C27B0' }}
          >
            {generating ? 'Generating...' : 'Generate with AI'}
          </button>
          {flashcards.length > 0 && (
            <button
              onClick={() => navigate(`/deck/${deckId}/study`)}
              style={{ width: 'auto', padding: '10px 20px', backgroundColor: '#2196F3' }}
            >
              Start Studying
            </button>
          )}
        </div>

        {error && <p className="error">{error}</p>}
        {successMessage && <p className="success">{successMessage}</p>}

        {showCreateForm && (
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
            <h3>Add Flashcard</h3>
            <form onSubmit={handleCreateFlashcard}>
              <div className="form-group">
                <label>Question</label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Answer</label>
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Hint (optional)</label>
                <input
                  type="text"
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  placeholder="Provide a helpful hint"
                />
              </div>
              <button type="submit">Add Flashcard</button>
            </form>
          </div>
        )}

        <h2>Flashcards</h2>
        {flashcards.length === 0 ? (
          <p>No flashcards yet. Add your first flashcard to start studying!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {flashcards.map(flashcard => (
              <div key={flashcard.id} style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
                <p><strong>Q:</strong> {flashcard.question}</p>
                <p><strong>A:</strong> {flashcard.answer}</p>
                {flashcard.hint && (
                  <p style={{ color: '#666', fontStyle: 'italic' }}>
                    <strong>Hint:</strong> {flashcard.hint}
                  </p>
                )}
                <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                  Mastery Level: {flashcard.mastery_level} | Times Reviewed: {flashcard.times_reviewed}
                </p>
                <button
                  onClick={() => handleDeleteFlashcard(flashcard.id)}
                  style={{ width: 'auto', padding: '8px 16px', backgroundColor: '#f44336', marginTop: '10px' }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        {/* PDF Viewer Modal */}
        {showPdfViewer && selectedPdf && (
          <PDFViewer
            pdfUrl={pdfsAPI.getPDFFile(deckId, selectedPdf.id)}
            filename={selectedPdf.filename}
            onClose={() => {
              setShowPdfViewer(false);
              setSelectedPdf(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

export default DeckView;
