# LinkedIn Semantic Search

A web application for searching your LinkedIn network using semantic search.

## Features

- Sign in with LinkedIn to access your network
- Index your LinkedIn connections for semantic search
- Search for people by skills, experience, or company
- View detailed profile information
- Expandable profile cards with summaries

## Project Structure

This project is divided into two main parts:

- **Frontend**: Next.js application with TypeScript and Tailwind CSS
- **Backend**: FastAPI application with PostgreSQL and Pinecone for vector search

## Setup

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- PostgreSQL
- Pinecone account
- OpenAI API key
- LinkedIn Developer account

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Create a virtual environment and activate it:

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Copy `.env.example` to `.env` and fill in the required values:

   ```bash
   cp .env.example .env
   ```

5. Run the development server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.local.example` to `.env.local` and fill in the required values:

   ```bash
   cp .env.local.example .env.local
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Sign in with your LinkedIn account
3. Wait for your network to be indexed
4. Search for people using natural language queries

## Technologies Used

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- NextAuth.js
- React Icons

### Backend

- FastAPI
- PostgreSQL with pgvector
- Pinecone
- OpenAI Embeddings
- SQLAlchemy
- JWT Authentication

## Authentication

This application uses NextAuth.js for authentication with LinkedIn. The authentication flow is as follows:

1. User clicks "Sign in with LinkedIn" on the frontend
2. NextAuth.js redirects to LinkedIn's OAuth page
3. User authenticates with LinkedIn
4. LinkedIn redirects back to the NextAuth.js callback URL
5. NextAuth.js creates a session with the user's information and LinkedIn tokens
6. The frontend uses the session token for API authentication
7. The backend validates the NextAuth.js token and identifies the user

### Environment Variables

For authentication to work properly, you need to set up the following environment variables:

#### Frontend (.env.local)

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-for-development-only
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
```

#### Backend (.env)

```
NEXTAUTH_SECRET=your-nextauth-secret-for-development-only
```

**Important**: The `NEXTAUTH_SECRET` must be the same in both the frontend and backend for token validation to work correctly.

### LinkedIn Developer Portal Configuration

In the LinkedIn Developer Portal, you need to configure the following:

1. Redirect URL: `http://localhost:3000/api/auth/callback/linkedin`
2. OAuth 2.0 scopes: `r_emailaddress`, `r_liteprofile`

## License

MIT
