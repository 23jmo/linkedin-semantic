-- Create the email schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS email;

-- Grant permissions to the service_role
GRANT USAGE ON SCHEMA email TO service_role;
GRANT ALL ON SCHEMA email TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA email TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA email TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA email TO service_role;

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA email TO authenticated;

-- Create the email_credentials table in the email schema
CREATE TABLE IF NOT EXISTS email.email_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Create the email_history table in the email schema
CREATE TABLE IF NOT EXISTS email.email_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_profile_id TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on the tables
ALTER TABLE email.email_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE email.email_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for email_credentials
CREATE POLICY "Users can view their own email credentials"
  ON email.email_credentials
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email credentials"
  ON email.email_credentials
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email credentials"
  ON email.email_credentials
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email credentials"
  ON email.email_credentials
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for email_history
CREATE POLICY "Users can view their own email history"
  ON email.email_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email history"
  ON email.email_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create a function to get the next_auth user ID
CREATE OR REPLACE FUNCTION email.get_next_auth_uid()
RETURNS UUID
LANGUAGE SQL STABLE
AS $$
  SELECT
    coalesce(
      nullif(current_setting('request.jwt.claim.sub', true), ''),
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    )::uuid
$$;

-- Create a function to check if a user exists
CREATE OR REPLACE FUNCTION email.user_exists(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users WHERE id = user_id
  );
END;
$$; 