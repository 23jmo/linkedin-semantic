# LinkedIn Semantic Search - Frontend

This is the frontend for the LinkedIn Semantic Search application. It provides a user interface for searching LinkedIn profiles using semantic search.

## Technologies Used

- **Next.js**: React framework with server-side rendering and routing
- **TypeScript**: Typed JavaScript for better developer experience
- **Tailwind CSS**: Utility-first CSS framework
- **NextAuth.js**: Authentication library for Next.js
- **React Icons**: Icon library for React

## Features

- **Main Page**: Simple search box with suggestion boxes
- **Search Page**: Loading indicator with text stream and profile cards
- **Profile Cards**: Expandable cards with profile information
- **Authentication**: LinkedIn OAuth integration

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with the following variables:
   ```
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-nextauth-secret
   LINKEDIN_CLIENT_ID=your-linkedin-client-id
   LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Authentication Flow

The application uses NextAuth.js with LinkedIn OAuth for authentication. Here's how the authentication flow works:

1. **Sign-In Initiation**: User clicks the "Sign in with LinkedIn" button on the sign-in page.
2. **OAuth Redirect**: User is redirected to LinkedIn's authentication page.
3. **Authorization**: User authorizes the application to access their LinkedIn data.
4. **Callback Processing**: LinkedIn redirects back to our application's callback URL with an authorization code.
5. **Token Exchange**: The application exchanges the code for access tokens.
6. **Session Creation**: NextAuth.js creates a session for the authenticated user.
7. **Redirection**: User is redirected to the originally requested page or the home page.

### Authentication Pages

- `/auth/signin`: Sign-in page with LinkedIn authentication option
- `/auth/callback`: Handles the OAuth callback from LinkedIn
- `/auth/error`: Displays authentication errors with helpful messages
- `/auth/test`: Test page to verify authentication status and session data

### Testing Authentication

You can use the `/auth/test` page to:

- Check your current authentication status
- View session data
- Test sign-in and sign-out functionality
- Navigate to other authentication-related pages

## Troubleshooting Authentication

If you encounter authentication issues:

1. **Check Environment Variables**:

   - Ensure `NEXTAUTH_URL` matches your application's base URL
   - Verify `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` are correct

2. **LinkedIn Developer Settings**:

   - Verify the redirect URI in your LinkedIn app matches your application's callback URL
   - Ensure you've requested the necessary OAuth scopes (openid, profile, email)

3. **Common Errors**:

   - `OAuthCallback`: Issue with the LinkedIn authentication process
   - `Configuration`: Missing or incorrect environment variables
   - `AccessDenied`: User denied permission or scope issues
   - `Timeout`: Authentication process took too long

4. **Debug Mode**:

   - In development, authentication pages display debug information
   - Check browser console for detailed error logs

5. **Session Issues**:
   - Clear browser cookies and cache
   - Try using a different browser
   - Check if the session cookie is being set correctly

## Project Structure

```
src/
├── app/
│   ├── page.tsx           # Main page
│   ├── auth/
│   │   ├── signin/        # Sign-in page
│   │   ├── callback/      # OAuth callback handler
│   │   ├── error/         # Error display page
│   │   └── test/          # Authentication test page
│   └── search/
│       └── page.tsx       # Search page
├── components/
│   ├── LoadingIndicator.tsx
│   ├── ProfileCard.tsx
│   ├── SearchBox.tsx
│   └── SuggestionBox.tsx
└── lib/
    └── api.ts             # API client
```

## Development

To run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Building for Production

To build the application for production:

```bash
npm run build
```

To run the production build:

```bash
npm start
```
