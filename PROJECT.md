# LinkedIn Semantic Search - Project Documentation

## Project Overview

LinkedIn Semantic Search is a web application that allows users to search their LinkedIn network using natural language queries powered by semantic search technology. The application leverages modern AI techniques to understand the meaning behind search queries and return relevant profiles from the user's LinkedIn network.

## Architecture

The project follows a modern client-server architecture with a clear separation of concerns:

### Frontend (Next.js)

- Built with Next.js 14 using the App Router
- TypeScript for type safety
- Tailwind CSS for styling
- NextAuth.js for authentication
- Client-side state management with React hooks

### Backend (FastAPI)

- FastAPI for high-performance API endpoints
- PostgreSQL with pgvector extension for structured data and vector storage
- Supabase for database management and vector search capabilities
- OpenAI embeddings for semantic understanding
- JWT-based authentication
- SQLAlchemy ORM for database interactions

## Key Features

1. **LinkedIn OAuth Integration**

   - Secure authentication with LinkedIn
   - Access to user's professional network
   - Non-authenticated users can view the main page but not perform searches
   - Clear UI prompts guiding users to authenticate when needed
   - Custom error handling for authentication failures
   - Debugging tools for troubleshooting OAuth issues
   - Support for proper error recovery and user feedback

2. **Profile Indexing**

   - Automatic indexing of user's LinkedIn connections
   - Vector embeddings generation for semantic search

3. **Semantic Search**

   - Natural language query processing
   - Relevance-based results ranking
   - Real-time search with streaming updates

4. **User Interface**
   - Clean, responsive design
   - Search suggestions based on common queries
   - Expandable profile cards with detailed information
   - Visual loading indicators with progress feedback

## Project Structure

```
linkedin-semantic/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/              # App Router pages
│   │   │   ├── page.tsx      # Home page with search box and suggestions
│   │   │   ├── search/       # Search results page
│   │   │   ├── auth/         # Authentication pages
│   │   │   └── api/          # API routes (NextAuth)
│   │   ├── components/       # Reusable React components
│   │   ├── lib/              # Utility functions and API client
│   │   └── types/            # TypeScript type definitions
│   ├── public/               # Static assets
│   └── package.json          # Frontend dependencies
│
├── backend/                  # FastAPI backend application
│   ├── app/
│   │   ├── api/              # API endpoints
│   │   │   └── routes/       # Route handlers
│   │   ├── core/             # Core functionality
│   │   ├── db/               # Database configuration and SQL scripts
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── services/         # Business logic
│   │   └── utils/            # Utility functions (including Supabase client)
│   ├── main.py               # Application entry point
│   └── requirements.txt      # Backend dependencies
│
├── README.md                 # Project overview
└── PROJECT.md                # Detailed project documentation
```

## Implementation Details

### Frontend Implementation

1. **Authentication Flow**

   - NextAuth.js integration with LinkedIn OAuth
   - JWT-based session management
   - Protected functionality with client-side authentication checks
   - Graceful handling of unauthenticated users with informative UI components
   - Two-tier access model: browsing (unauthenticated) and searching (authenticated)

2. **Component Architecture**

   - `Header`: Navigation and user profile display with authentication status
   - `SearchBox`: Input field for search queries
   - `SuggestionBox`: Displays search suggestions for all users
   - `AuthPrompt`: Prompts unauthenticated users to sign in with LinkedIn
   - `UnauthenticatedSearchWarning`: Displays when unauthenticated users attempt to search
   - `ProfileCard`: Displays profile information with expandable details
   - `LoadingIndicator`: Shows search progress with streaming updates

3. **State Management**

   - React hooks for local component state
   - Server state management with custom API client
   - Session state with NextAuth.js

4. **Routing**
   - Next.js App Router for page navigation
   - Dynamic routes for search queries
   - Authentication-aware redirects

### Backend Implementation

1. **API Endpoints**

   - `/api/auth/*`: Authentication endpoints
   - `/api/profiles/*`: Profile management endpoints
   - `/api/search/*`: Search endpoints

2. **Database Models**

   - `User`: User information and authentication details
   - `Profile`: LinkedIn profile data with vector embeddings

3. **Vector Search Implementation**

   - OpenAI embeddings generation for text
   - Supabase with pgvector for efficient similarity search
   - PostgreSQL's native vector operations for cosine similarity

4. **Authentication & Security**
   - JWT token generation and validation
   - Password hashing with bcrypt
   - CORS configuration for frontend access

## Supabase with pgvector Integration

The project now uses Supabase with pgvector for semantic search instead of Pinecone. This change offers several advantages:

1. **Unified Database Solution**

   - Both structured data and vector embeddings are stored in the same PostgreSQL database
   - Simplified architecture with fewer external dependencies
   - Reduced operational complexity

2. **Implementation Details**

   - pgvector extension enables vector similarity search in PostgreSQL
   - Custom SQL function (`match_profiles`) for efficient similarity queries
   - Vector indexing using IVFFlat for improved search performance

3. **Search Flow**

   - Text is converted to embeddings using OpenAI's API
   - Embeddings are stored in a VECTOR(1536) column in the profiles table
   - Searches use the cosine similarity operator (`<=>`) to find relevant profiles
   - Results are ranked by similarity score

4. **Profile Indexing Process**
   - When a profile is created, its text data is converted to an embedding
   - The embedding is stored in the database along with the profile data
   - The profile is marked as indexed and becomes searchable

## Setup and Installation

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- PostgreSQL database with pgvector extension
- Supabase account
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

4. Create a `.env` file with the following variables:

   ```
   # API settings
   SECRET_KEY=your-secret-key-for-development-only

   # Database settings
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/linkedin_semantic

   # LinkedIn OAuth settings
   LINKEDIN_CLIENT_ID=your-linkedin-client-id
   LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
   LINKEDIN_REDIRECT_URI=http://localhost:3000/api/auth/callback/linkedin

   # Supabase settings
   SUPABASE_URL=your-supabase-url
   SUPABASE_KEY=your-supabase-key

   # OpenAI settings
   OPENAI_API_KEY=your-openai-api-key
   ```

5. Set up the pgvector extension and necessary SQL functions in Supabase:

   - Run the SQL script in `backend/app/db/setup_pgvector.sql` in the Supabase SQL Editor
   - This will create the necessary vector column, index, and search function

6. Run the development server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
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

3. Create a `.env.local` file with the following variables:

   ```
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-nextauth-secret-for-development-only

   # LinkedIn OAuth settings
   LINKEDIN_CLIENT_ID=your-linkedin-client-id
   LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

   # API settings
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## Testing

### Backend Testing

1. Run the test suite:

   ```bash
   cd backend
   pytest
   ```

2. Test API endpoints manually using Swagger UI:
   - Start the backend server
   - Navigate to `http://localhost:8000/docs`
   - Use the interactive documentation to test endpoints

### Frontend Testing

1. Run the development server:

   ```bash
   cd frontend
   npm run dev
   ```

2. Manual testing flow:
   - Open `http://localhost:3000`
   - Test authentication with LinkedIn
   - Test search functionality with various queries
   - Test profile card expansion
   - Test responsive design on different screen sizes

## Deployment Considerations

### Backend Deployment

- Deploy as a Docker container
- Set up PostgreSQL with pgvector extension
- Configure Supabase project with appropriate settings
- Set up environment variables for production
- Implement rate limiting for API endpoints
- Configure CORS for production frontend URL

### Frontend Deployment

- Build the Next.js application for production
- Deploy to Vercel or similar platform
- Configure environment variables for production
- Set up proper authentication callback URLs
- Implement analytics for user behavior tracking

## Performance Considerations

### Backend Performance

- Optimize pgvector indexes for faster similarity searches
- Implement caching for frequent searches
- Optimize database queries with proper indexing
- Use connection pooling for database connections
- Implement background tasks for profile indexing
- Consider sharding for large user bases

### Frontend Performance

- Implement code splitting for faster initial load
- Use Next.js Image component for optimized images
- Implement virtualization for long lists of profiles
- Use React.memo for expensive components
- Implement proper error boundaries

## Security Considerations

- Implement proper input validation
- Use HTTPS for all communications
- Store sensitive data securely
- Implement rate limiting to prevent abuse
- Regular security audits
- Keep dependencies updated
- Secure Supabase API keys and access

## Future Enhancements

1. **Advanced Search Filters**

   - Filter by industry, location, company, etc.
   - Save favorite searches

2. **Profile Analytics**

   - Insights about user's network
   - Visualization of connections

3. **Recommendation Engine**

   - Suggest people to connect with
   - Recommend skills to develop

4. **Integration with Other Platforms**

   - GitHub integration for developers
   - Twitter integration for social presence

5. **Collaborative Features**

   - Share search results with team members
   - Collaborative talent sourcing

6. **Advanced Vector Search Features**
   - Hybrid search combining keyword and semantic search
   - Multi-vector search for different aspects of profiles
   - Negative search to exclude certain characteristics

## Troubleshooting

### Common Backend Issues

1. **Database Connection Errors**

   - Check PostgreSQL is running
   - Verify connection string in `.env`
   - Ensure pgvector extension is installed in Supabase

2. **API Authentication Errors**
   - Verify JWT secret key
   - Check token expiration settings
   - Ensure proper CORS configuration

### Common Frontend Issues

1. **Authentication Failures**

   - Check LinkedIn OAuth credentials
   - Verify callback URLs
   - Check NextAuth.js configuration

2. **API Connection Issues**
   - Verify backend URL in `.env.local`
   - Check network requests in browser console
   - Ensure CORS is properly configured

### LinkedIn OAuth Troubleshooting

If you encounter the error "The redirect_uri does not match the registered value" or "Bummer, something went wrong":

1. **Check LinkedIn Developer Portal Configuration**

   - Ensure the exact redirect URI `http://localhost:3000/api/auth/callback/linkedin` is registered
   - Verify that your application has the correct permissions
   - Check that your OAuth 2.0 settings are properly configured
   - Make sure you've requested access for "Sign In with LinkedIn using OpenID Connect" under Products

2. **Verify Environment Variables**

   - Ensure `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` are correct
   - Make sure `NEXTAUTH_URL` is set to `http://localhost:3000`
   - Verify that `NEXTAUTH_SECRET` is properly set

3. **Check NextAuth.js Configuration**

   - Use the OpenID Connect scopes: `openid profile email` (the old scopes `r_liteprofile` and `r_emailaddress` are deprecated)
   - Implement a custom profile function to handle LinkedIn profile data
   - Ensure proper error handling in the authentication flow

4. **Debug Authentication Flow**

   - Check browser console for errors
   - Examine network requests during authentication
   - Use the custom error page to get more information about authentication failures
   - Enable debug mode in NextAuth.js configuration

5. **Redirection Issues**
   - If users aren't being redirected properly after authentication:
     - Check that the `callbackUrl` is being properly passed to the `signIn` function
     - Verify that the `redirect` callback in NextAuth.js configuration is working correctly
     - Ensure there are no client-side navigation issues preventing redirection
     - Check for any errors in the browser console during the redirection process
   - If users are stuck in a redirection loop:
     - Check for circular redirects in your authentication logic
     - Ensure the `redirectAttempted` state is properly managed to prevent multiple redirects

## User Experience

The application implements a tiered access model to balance openness with authentication requirements:

1. **Unauthenticated Users**

   - Can access the main page and view the application's purpose
   - See example search suggestions to understand the application's capabilities
   - Cannot perform searches but are prompted to sign in with LinkedIn
   - Receive clear visual cues and explanations about authentication requirements

2. **Authenticated Users**
   - Full access to all features including search functionality
   - Personalized experience with their LinkedIn profile information
   - Can search their professional network using semantic search
   - View detailed profile information of their connections

This approach allows users to understand the value proposition before committing to authentication, while ensuring that sensitive data access requires proper authentication.

## Data Flow

1. **User Authentication**

   - User visits the main page and can browse without authentication
   - When attempting to search, user is prompted to sign in with LinkedIn
   - User signs in with LinkedIn OAuth
   - Backend validates credentials and issues JWT token
   - Frontend stores token for authenticated requests
   - User is redirected back to the application with full access

2. **Profile Indexing**

   - Backend fetches user's LinkedIn connections
   - For each profile:
     - Extract relevant text (name, headline, summary, etc.)
     - Generate embedding using OpenAI API
     - Store profile data and embedding in Supabase
     - Mark profile as indexed

3. **Search Process**

   - User enters natural language query
   - Frontend sends query to backend
   - Backend generates embedding for query using OpenAI API
   - Backend executes `match_profiles` function in Supabase
   - Supabase performs vector similarity search using pgvector
   - Results are ranked by similarity score
   - Backend returns results to frontend
   - Frontend displays results as profile cards

4. **Profile Interaction**
   - User clicks on profile card
   - Card expands to show detailed information
   - Additional profile data is loaded if needed

## Authentication Flow

The application uses a consolidated authentication flow with NextAuth.js:

1. **Single Authentication Provider**: NextAuth.js handles all LinkedIn OAuth authentication.
2. **Token-Based Authentication**: NextAuth.js generates JWT tokens that are used for both frontend session management and backend API authentication.
3. **Shared Secret**: Both frontend and backend use the same `NEXTAUTH_SECRET` to validate tokens.
4. **Stateless Authentication**: No server-side session storage is required, as all authentication state is contained in the JWT token.
5. **Smart Redirection**: The application preserves the original URL the user was trying to access and redirects them back after successful authentication.

The authentication flow works as follows:

1. User clicks "Sign in with LinkedIn" on the frontend
2. NextAuth.js redirects to LinkedIn's OAuth page
3. User authenticates with LinkedIn
4. LinkedIn redirects back to the NextAuth.js callback URL (`http://localhost:3000/api/auth/callback/linkedin`)
5. NextAuth.js creates a session with the user's information and LinkedIn tokens
6. The user is redirected back to their original destination or the main page
7. The frontend uses the session token for API authentication
8. The backend validates the NextAuth.js token and identifies the user

### Redirection Process

The application implements a smart redirection system:

1. **Already Authenticated Users**:

   - If a user visits the sign-in page but is already authenticated, they are automatically redirected to the main page
   - This prevents unnecessary authentication steps for logged-in users

2. **Callback URL Preservation**:

   - When a user is redirected to the sign-in page from another part of the application, the original URL is preserved as a `callbackUrl` parameter
   - After successful authentication, the user is redirected back to this original URL
   - If no callback URL is provided, the user is redirected to the main page

3. **Error Handling**:
   - If authentication fails, the user is redirected to a custom error page
   - The error page provides clear information about what went wrong and how to resolve it
   - Users can easily navigate back to the main page or try signing in again

This consolidated approach offers several advantages:

- **Simplified Architecture**: One authentication system means fewer points of failure and easier maintenance.
- **Consistent User Experience**: Users follow a single sign-in flow.
- **Reduced Configuration**: Only one set of redirect URIs and OAuth settings to manage.
- **Centralized Session Management**: All authentication state is managed in one place.
- **Better Security**: Reduced attack surface and fewer opportunities for configuration mistakes.
- **Seamless Navigation**: Users are always redirected to their intended destination after authentication.

## Conclusion

The LinkedIn Semantic Search project demonstrates a modern approach to building a full-stack application with semantic search capabilities. By leveraging the power of Next.js, FastAPI, and Supabase with pgvector, we've created a scalable and performant solution for searching LinkedIn networks using natural language.

The integration of Supabase with pgvector provides a unified database solution that simplifies the architecture while maintaining high-performance vector search capabilities. This approach reduces operational complexity and provides a more cost-effective solution compared to using separate services for structured data and vector search.

The modular architecture allows for easy extension and maintenance, while the separation of concerns between frontend and backend ensures that each part can evolve independently. The use of TypeScript and Pydantic schemas provides type safety and validation throughout the application.

This project serves as a solid foundation for building more advanced features and scaling to handle larger user bases in the future.
