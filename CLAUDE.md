# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LinkedIn Semantic Search is a full-stack application that enables semantic search of LinkedIn profiles. The project consists of:

- **Frontend**: Next.js 15 with TypeScript, Tailwind CSS, and NextAuth.js for authentication
- **Backend**: FastAPI with PostgreSQL (using pgvector for embeddings) and Supabase integration
- **Authentication**: NextAuth.js with LinkedIn OAuth provider and Supabase adapter
- **Database**: Supabase with PostgreSQL and pgvector extension for semantic search

## Development Commands

### Frontend (Next.js)
Navigate to `frontend/` directory first:

```bash
cd frontend
npm install                 # Install dependencies
npm run dev                 # Start development server with Turbopack
npm run build               # Build for production
npm run start               # Start production server
npm run lint                # Run ESLint
npm run storybook           # Start Storybook dev server
npm run build-storybook     # Build Storybook
```

### Backend (FastAPI)
Navigate to `backend/` directory first:

```bash
cd backend
python -m venv venv                           # Create virtual environment
source venv/bin/activate                     # Activate (Linux/Mac)
# venv\Scripts\activate                      # Activate (Windows)
pip install -r requirements.txt              # Install dependencies
uvicorn app.main:app --reload                # Start development server
python -m pytest                             # Run tests (if pytest is configured)
```

## Architecture

### Authentication Flow
- NextAuth.js handles LinkedIn OAuth authentication
- Supabase adapter stores user sessions and account data
- JWT tokens are signed with `SUPABASE_JWT_SECRET` for API authorization
- Session includes Supabase access token for database operations

### Database Schema
- **next_auth schema**: Stores user authentication data (users, accounts, sessions)
- **linkedin_profiles schema**: Stores LinkedIn profile data and embeddings
- Uses pgvector extension for semantic search capabilities

### API Structure
- **Frontend API routes**: Located in `frontend/src/app/api/`
- **Backend API**: FastAPI endpoints at `/api/v1/` with routers for profiles and search
- CORS configured to allow frontend at `http://localhost:3000`

### Key Components
- **Search functionality**: Combines traditional filtering with semantic search using OpenAI embeddings
- **Profile management**: Handles LinkedIn profile data import and chunking
- **Email integration**: Gmail API integration for sending personalized emails
- **Quota system**: Tracks usage limits for searches and email generation

## Environment Variables

Both frontend and backend require specific environment variables:

### Frontend (.env.local)
```
AUTH_SECRET=                    # NextAuth.js secret (must match backend)
AUTH_LINKEDIN_ID=              # LinkedIn OAuth client ID
AUTH_LINKEDIN_SECRET=          # LinkedIn OAuth client secret
NEXT_PUBLIC_SUPABASE_URL=      # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=     # Supabase service role key
SUPABASE_JWT_SECRET=           # For signing JWT tokens
```

### Backend (.env)
```
NEXTAUTH_SECRET=               # Must match frontend AUTH_SECRET
SUPABASE_URL=                  # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=     # Supabase service role key
OPENAI_API_KEY=               # For embeddings generation
```

## Development Notes

### Testing
- Frontend includes Vitest configuration with browser testing support
- Storybook is configured for component development and testing
- Backend uses pytest for API testing

### Code Style
- TypeScript strict mode enabled
- ESLint configured with Next.js rules
- Tailwind CSS for styling with custom configuration

### Key Files to Understand
- `frontend/src/auth.ts`: NextAuth.js configuration with LinkedIn provider
- `backend/app/main.py`: FastAPI application entry point
- `frontend/src/app/api/search/route.ts`: Main search API endpoint
- `backend/app/services/`: Core business logic for embeddings and search

### Database Operations
- Supabase client configured for both frontend and backend
- Profile data is chunked and stored with embeddings for semantic search
- Quota tracking implemented at database level with monthly resets

## Development Workflow

1. Start backend server: `cd backend && uvicorn app.main:app --reload`
2. Start frontend server: `cd frontend && npm run dev`
3. Access application at `http://localhost:3000`
4. Backend API available at `http://localhost:8000`

### Important Considerations
- Ensure `AUTH_SECRET`/`NEXTAUTH_SECRET` match between frontend and backend
- LinkedIn OAuth redirect URI must be configured as `http://localhost:3000/api/auth/callback/linkedin`
- Supabase schemas must be properly set up with pgvector extension enabled