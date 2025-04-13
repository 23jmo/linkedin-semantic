-- Create waitlist table
CREATE TABLE linkedin_profiles.waitlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add index for email lookups
CREATE INDEX idx_waitlist_email ON linkedin_profiles.waitlist(email);

-- Add RLS policies
ALTER TABLE linkedin_profiles.waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert into waitlist
CREATE POLICY "Allow public waitlist signups" ON linkedin_profiles.waitlist
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Only allow admins to view waitlist
CREATE POLICY "Only admins can view waitlist" ON linkedin_profiles.waitlist
    FOR SELECT
    TO authenticated
    USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'admin'); 