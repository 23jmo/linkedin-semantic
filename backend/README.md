# LinkedIn Semantic Search - Backend

This is the backend for the LinkedIn Semantic Search application. It provides API endpoints for authentication, profile management, and semantic search.

## Technologies Used

- **FastAPI**: Modern, fast web framework for building APIs with Python
- **SQLAlchemy**: SQL toolkit and Object-Relational Mapping (ORM) for Python
- **PostgreSQL**: Relational database with pgvector extension for vector embeddings
- **Pinecone**: Vector database for efficient semantic search
- **OpenAI**: API for generating embeddings for semantic search
- **JWT**: JSON Web Tokens for authentication
- **Pydantic**: Data validation and settings management
- **Uvicorn**: ASGI server for running FastAPI applications

## Setup

1. Clone the repository
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy `.env.example` to `.env` and fill in the required values
5. Run the application:
   ```bash
   uvicorn app.main:app --reload
   ```

## API Documentation

Once the application is running, you can access the API documentation at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
app/
├── api/
│   └── routes/
│       ├── auth.py
│       ├── profiles.py
│       └── search.py
├── core/
│   └── config.py
├── db/
│   └── database.py
├── models/
│   ├── user.py
│   └── profile.py
├── schemas/
│   ├── auth.py
│   ├── profiles.py
│   └── search.py
├── services/
│   ├── auth.py
│   ├── profiles.py
│   └── search.py
└── main.py
```

## Development

To run the application in development mode:

```bash
uvicorn app.main:app --reload
```

## Testing

To run tests:

```bash
pytest
```
