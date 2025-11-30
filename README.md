# FlashCard Generator

A full-stack flashcard application with React frontend and FastAPI backend that helps users create, manage, and study flashcards with spaced repetition.

## Features

- User authentication (JWT-based)
- Create and manage flashcard decks
- Add, view, and delete flashcards
- **AI-Powered Flashcard Generation** - Automatically generate flashcards using OpenAI (see [SETUP_AI.md](SETUP_AI.md))
- Study mode with progress tracking
- Mastery level tracking for each flashcard
- RESTful API following best practices
- PostgreSQL database for data persistence

## Tech Stack

### Backend
- FastAPI (Python web framework)
- PostgreSQL (Database)
- SQLAlchemy (ORM)
- JWT Authentication
- Pydantic (Data validation)
- OpenAI API (AI flashcard generation)

### Frontend
- React 18
- React Router (Navigation)
- Axios (HTTP client)
- Vite (Build tool)

## Prerequisites

- Docker
- Docker Compose

## Quick Start with Docker (Recommended)

### 1. Clone the repository

```bash
git clone <repository-url>
cd FlashCardGenerator
```

### 2. Start the application

```bash
docker-compose up --build
```

That's it! The application will automatically:
- Set up a PostgreSQL database
- Start the FastAPI backend
- Start the React frontend
- Create all necessary database tables

### 3. Access the application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### 4. Stop the application

```bash
docker-compose down
```

To stop and remove all data (including the database):

```bash
docker-compose down -v
```

For more detailed Docker commands and troubleshooting, see [DOCKER.md](DOCKER.md).

## Configuration

The default configuration in `docker-compose.yml` includes:

- **Database credentials**:
  - User: `flashcard_user`
  - Password: `flashcard_password`
  - Database: `flashcard_db`

- **Backend**: Runs on port 8000
- **Frontend**: Runs on port 3000
- **Database**: Runs on port 5432

To change the configuration, you can:
1. Edit the `docker-compose.yml` file
2. Or create a `.env` file in the backend directory (optional)

**Security Note**: For production, change the `SECRET_KEY` in `docker-compose.yml` or use environment variables.

## Development

The Docker setup includes hot-reloading for both frontend and backend:

- **Backend**: Changes to Python files will automatically reload the server
- **Frontend**: Changes to React files will automatically update in the browser

## Alternative: Local Setup (Without Docker)

<details>
<summary>Click to expand local setup instructions</summary>

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL 12+

### Backend Setup

```bash
cd backend

# Create a virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
```

Edit the `.env` file:

```
DATABASE_URL=postgresql://flashcard_user:flashcard_password@localhost:5432/flashcard_db
SECRET_KEY=your-super-secret-key-here-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Database Setup

```bash
# Create PostgreSQL database
createdb flashcard_db
```

### Frontend Setup

```bash
cd frontend
npm install
```

### Running Locally

Terminal 1 - Backend:
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

</details>

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get access token
- `GET /api/auth/me` - Get current user info

### Decks
- `GET /api/decks/` - Get all decks for current user
- `POST /api/decks/` - Create a new deck
- `GET /api/decks/{deck_id}` - Get a specific deck
- `DELETE /api/decks/{deck_id}` - Delete a deck

### Flashcards
- `GET /api/decks/{deck_id}/flashcards/` - Get all flashcards in a deck
- `POST /api/decks/{deck_id}/flashcards/` - Create a new flashcard
- `GET /api/decks/{deck_id}/flashcards/{flashcard_id}` - Get a specific flashcard
- `PATCH /api/decks/{deck_id}/flashcards/{flashcard_id}` - Update flashcard mastery
- `DELETE /api/decks/{deck_id}/flashcards/{flashcard_id}` - Delete a flashcard
- `POST /api/decks/{deck_id}/generate?count=10` - Generate flashcards with AI

## Usage

1. Register a new account or login
2. Create a new deck with a topic (e.g., "React Hooks", "Python Basics")
3. **Option A**: Manually add flashcards with questions and answers
4. **Option B**: Click "Generate with AI" to auto-create 10 flashcards based on the topic
   - Requires OpenAI API key setup (see [SETUP_AI.md](SETUP_AI.md))
5. Start studying in study mode
6. Click on cards to reveal answers
7. Mark cards as "Know" or "Don't Know" to track your progress
8. Cards are sorted by mastery level, so you practice difficult cards more often

### AI Flashcard Generation

To use the AI generation feature:
1. Set up your OpenAI API key (see [SETUP_AI.md](SETUP_AI.md) for detailed instructions)
2. Create a deck with a descriptive topic
3. Click the "Generate with AI" button
4. Wait a few seconds while the AI creates relevant flashcards
5. Review and study the generated cards

## Project Structure

```
FlashCardGenerator/
├── docker-compose.yml          # Docker orchestration
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── auth.py         # Authentication endpoints
│   │   │   ├── decks.py        # Deck CRUD endpoints
│   │   │   └── flashcards.py   # Flashcard CRUD endpoints
│   │   ├── __init__.py
│   │   ├── auth.py             # JWT authentication logic
│   │   ├── config.py           # Configuration settings
│   │   ├── database.py         # Database connection
│   │   ├── main.py             # FastAPI application
│   │   ├── models.py           # SQLAlchemy models
│   │   └── schemas.py          # Pydantic schemas
│   ├── Dockerfile              # Backend container definition
│   ├── .dockerignore
│   ├── .env.example
│   ├── .gitignore
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Dashboard.jsx   # Main dashboard view
    │   │   ├── DeckView.jsx    # Deck management
    │   │   ├── Login.jsx       # Login form
    │   │   ├── Register.jsx    # Registration form
    │   │   └── StudyMode.jsx   # Study interface
    │   ├── context/
    │   │   └── AuthContext.jsx # Authentication context
    │   ├── utils/
    │   │   └── api.js          # API client
    │   ├── App.jsx             # Main app component
    │   ├── index.css           # Global styles
    │   └── main.jsx            # React entry point
    ├── Dockerfile              # Frontend container definition
    ├── .dockerignore
    ├── .gitignore
    ├── index.html
    ├── package.json
    └── vite.config.js
```

## Security Notes

- Always change the `SECRET_KEY` in production
- Use HTTPS in production
- Keep dependencies updated
- Don't commit `.env` files to version control
- Use strong passwords for database and user accounts

## Future Enhancements

- AI-powered flashcard generation based on topics
- Spaced repetition algorithm (SM-2)
- Study statistics and analytics
- Card categories and tags
- Image support for flashcards
- Export/import deck functionality
- Collaborative decks
