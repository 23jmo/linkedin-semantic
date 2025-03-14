
# User Sign In Flow

(Frontend) Check User function called from sign in callback in `auth.ts`

Invokes the Fast API backend - calls a 'check-user' route and passes the JWT token for working with RLS

Fast API backend checks if user exists in the linkedin_profiles.profiles table in supabase and if exists in the linkedin_profiles.profile_embeddings table in supabase

If it exists:
- nothing needed

If user doesn't exist in the profiles table
- guess their linked in profile url 
- use proxycurl to fetch the user's linked in data based on their url
- parse their JSON 
- generate an embedding of the user's data using `services/embedding.py`

Add the user data + linked in data + embedding data to the linkedin_profiles.profiles table and the linkedin_profiles.profile_embeddings table

# Search

Call the semantic search fast api which 
- First generates an embedding of the search query using embeddings.py
- uses the supabase function `search_profiles_by_embedding` to semantically search for profiles 
- processes the return values into nice json 
- sends it back to the frontend

# Supabase Schema

TABLE linkedin_profiles.profile_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES linkedin_profiles.profiles(id) ON DELETE CASCADE,
    embedding VECTOR(1536), -- Adjust dimension based on your embedding model (1536 for OpenAI)
    embedding_model TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Add a unique constraint to prevent duplicate embeddings for a profile
    CONSTRAINT unique_profile_embedding UNIQUE (profile_id, embedding_model)
);

TABLE linkedin_profiles.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    linkedin_id TEXT,
    full_name TEXT,
    headline TEXT,
    industry TEXT,
    location TEXT,
    profile_url TEXT,
    profile_picture_url TEXT,
    summary TEXT,
    raw_profile_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Add a unique constraint to prevent duplicate profiles for a user
    CONSTRAINT unique_user_profile UNIQUE (user_id)
);

# Supabase Functions:

CREATE OR REPLACE FUNCTION linkedin_profiles.search_profiles_by_embedding(
    query_embedding VECTOR(1536),
    match_threshold FLOAT,
    match_count INT
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    full_name TEXT,
    headline TEXT,
    industry TEXT,
    location TEXT,
    profile_picture_url TEXT,
    summary TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.user_id,
        p.full_name,
        p.headline,
        p.industry,
        p.location,
        p.profile_picture_url,
        p.summary,
        1 - (e.embedding <=> query_embedding) AS similarity
    FROM linkedin_profiles.profiles p
    JOIN linkedin_profiles.profile_embeddings e ON p.id = e.profile_id
    WHERE 1 - (e.embedding <=> query_embedding) > match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;