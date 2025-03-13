-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create profiles table with vector column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS embedding VECTOR(1536);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS profiles_embedding_idx 
ON profiles USING ivfflat (embedding vector_cosine_ops);

-- Create function for similarity search
CREATE OR REPLACE FUNCTION match_profiles(
  query_embedding VECTOR(1536), 
  match_threshold FLOAT, 
  match_count INT,
  user_id UUID
)
RETURNS TABLE (
  id UUID,
  linkedin_id TEXT,
  name TEXT,
  headline TEXT,
  summary TEXT,
  location TEXT,
  industry TEXT,
  profile_url TEXT,
  profile_image_url TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    profiles.id,
    profiles.linkedin_id,
    profiles.name,
    profiles.headline,
    profiles.summary,
    profiles.location,
    profiles.industry,
    profiles.profile_url,
    profiles.profile_image_url,
    1 - (profiles.embedding <=> query_embedding) as similarity
  FROM profiles
  WHERE 
    profiles.user_id = match_profiles.user_id AND
    profiles.is_indexed = true AND
    1 - (profiles.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$; 