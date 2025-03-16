# Email Integration Setup

This document explains how to set up the email integration with Supabase and NextAuth.js.

## Overview

The application uses:

- NextAuth.js for authentication
- Supabase for database storage
- Row Level Security (RLS) to protect user data

## Setup Instructions

### 1. Create the Email Schema in Supabase

You need to create the `email` schema and grant the necessary permissions. You can do this in two ways:

#### Option 1: Using the SQL Editor in Supabase Dashboard

1. Go to the Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of the `supabase/migrations/20240601_email_schema.sql` file
4. Run the SQL query

#### Option 2: Using the Script

Run the provided script:

```bash
# Make sure the script is executable
chmod +x scripts/apply-email-schema.js

# Run the script
node scripts/apply-email-schema.js
```

### 2. Expose the Email Schema in Supabase API Settings

1. Go to the Supabase Dashboard
2. Navigate to Settings > API
3. Under "API Settings", find "Exposed schemas"
4. Add `email` to the list of exposed schemas
5. Click "Save"

### 3. Configure JWT Secret

Make sure your `SUPABASE_JWT_SECRET` environment variable is set correctly. This is used to sign the JWT tokens for Row Level Security.

1. Go to the Supabase Dashboard
2. Navigate to Settings > API
3. Find the "JWT Settings" section
4. Copy the "JWT Secret" value
5. Add it to your environment variables:

```
SUPABASE_JWT_SECRET=your_jwt_secret
```

## How It Works

### Authentication Flow

1. User signs in with NextAuth.js (LinkedIn provider)
2. NextAuth.js creates a session with a JWT token
3. The session callback in `auth.ts` adds a Supabase JWT token to the session
4. This token is used to authenticate requests to Supabase with Row Level Security

### Row Level Security (RLS)

The email tables have RLS policies that only allow users to access their own data. The policies check:

```sql
auth.uid() = user_id
```

Where `auth.uid()` is the user ID from the JWT token, and `user_id` is the column in the table.

### Troubleshooting

If you encounter permission errors like:

```
permission denied for schema email
```

Check the following:

1. The email schema exists in Supabase
2. The schema is exposed in the API settings
3. The JWT token is being correctly generated and included in requests
4. The RLS policies are correctly set up

## Additional Resources

- [NextAuth.js Supabase Adapter Documentation](https://authjs.dev/getting-started/adapters/supabase)
- [Supabase Row Level Security Documentation](https://supabase.com/docs/guides/auth/row-level-security)
