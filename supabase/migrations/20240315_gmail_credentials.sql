-- Create a table for storing Gmail credentials
CREATE TABLE IF NOT EXISTS gmail_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create a table for storing email history
CREATE TABLE IF NOT EXISTS email_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE gmail_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_history ENABLE ROW LEVEL SECURITY;

-- Only allow users to see their own Gmail credentials
CREATE POLICY "Users can view their own Gmail credentials"
  ON gmail_credentials
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only allow users to update their own Gmail credentials
CREATE POLICY "Users can update their own Gmail credentials"
  ON gmail_credentials
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Only allow users to insert their own Gmail credentials
CREATE POLICY "Users can insert their own Gmail credentials"
  ON gmail_credentials
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only allow users to delete their own Gmail credentials
CREATE POLICY "Users can delete their own Gmail credentials"
  ON gmail_credentials
  FOR DELETE
  USING (auth.uid() = user_id);

-- Only allow users to see their own email history
CREATE POLICY "Users can view their own email history"
  ON email_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only allow users to insert their own email history
CREATE POLICY "Users can insert their own email history"
  ON email_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create functions to manage Gmail credentials

-- Function to store or update Gmail credentials
CREATE OR REPLACE FUNCTION store_gmail_credentials(
  p_user_id UUID,
  p_access_token TEXT,
  p_refresh_token TEXT,
  p_expires_at TIMESTAMP WITH TIME ZONE
) RETURNS VOID AS $$
BEGIN
  INSERT INTO gmail_credentials (user_id, access_token, refresh_token, expires_at)
  VALUES (p_user_id, p_access_token, p_refresh_token, p_expires_at)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    access_token = p_access_token,
    refresh_token = p_refresh_token,
    expires_at = p_expires_at,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get Gmail credentials
CREATE OR REPLACE FUNCTION get_gmail_credentials(
  p_user_id UUID
) RETURNS TABLE (
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gc.access_token,
    gc.refresh_token,
    gc.expires_at
  FROM gmail_credentials gc
  WHERE gc.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to store email history
CREATE OR REPLACE FUNCTION store_email_history(
  p_user_id UUID,
  p_recipient_email TEXT,
  p_recipient_name TEXT,
  p_subject TEXT,
  p_body TEXT
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO email_history (user_id, recipient_email, recipient_name, subject, body)
  VALUES (p_user_id, p_recipient_email, p_recipient_name, p_subject, p_body)
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 