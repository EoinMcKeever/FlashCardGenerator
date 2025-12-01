import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (userData) => api.post('/api/auth/register', userData),
  login: (credentials) => api.post('/api/auth/login', credentials, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }),
  getCurrentUser: () => api.get('/api/auth/me'),
};

export const decksAPI = {
  getDecks: () => api.get('/api/decks/'),
  getDeck: (deckId) => api.get(`/api/decks/${deckId}`),
  createDeck: (deckData) => api.post('/api/decks/', deckData),
  deleteDeck: (deckId) => api.delete(`/api/decks/${deckId}`),
  generateFlashcards: (deckId, count = 10) => api.post(`/api/decks/${deckId}/generate?count=${count}`),
  generateFlashcardsFromPDFs: (deckId, instructions, count = 100) =>
    api.post(`/api/decks/${deckId}/generate-from-pdfs`, { instructions, count }),
  resetMastery: (deckId) => api.post(`/api/decks/${deckId}/reset-mastery`),
};

export const flashcardsAPI = {
  getFlashcards: (deckId) => api.get(`/api/decks/${deckId}/flashcards/`),
  getFlashcard: (deckId, flashcardId) => api.get(`/api/decks/${deckId}/flashcards/${flashcardId}`),
  createFlashcard: (deckId, flashcardData) => api.post(`/api/decks/${deckId}/flashcards/`, flashcardData),
  updateFlashcard: (deckId, flashcardId, updateData) => api.patch(`/api/decks/${deckId}/flashcards/${flashcardId}`, updateData),
  deleteFlashcard: (deckId, flashcardId) => api.delete(`/api/decks/${deckId}/flashcards/${flashcardId}`),
};

export const pdfsAPI = {
  uploadPDF: (deckId, file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/api/decks/${deckId}/pdfs/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  },
  getPDFs: (deckId) => api.get(`/api/decks/${deckId}/pdfs/`),
  deletePDF: (deckId, pdfId) => api.delete(`/api/decks/${deckId}/pdfs/${pdfId}`),
  getPDFFile: (deckId, pdfId) => `${API_URL}/api/decks/${deckId}/pdfs/${pdfId}/file`,
};

export default api;
