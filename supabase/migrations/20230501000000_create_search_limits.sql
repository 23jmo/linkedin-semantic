-- Migration: Create search_limits table
CREATE TABLE usage_tracking.search_limits (
    user_id UUID PRIMARY KEY REFERENCES next_auth.users(id) ON DELETE CASCADE,
    searches_this_month INTEGER NOT NULL DEFAULT 0,
    monthly_search_limit INTEGER NOT NULL DEFAULT 50, -- Default limit for free tier
    last_reset_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE usage_tracking.search_limits IS 'Tracks monthly search usage per user.';
COMMENT ON COLUMN usage_tracking.search_limits.user_id IS 'Foreign key referencing the user in auth.users.';
COMMENT ON COLUMN usage_tracking.search_limits.searches_this_month IS 'Number of searches performed by the user in the current billing cycle.';
COMMENT ON COLUMN usage_tracking.search_limits.monthly_search_limit IS 'The maximum number of searches allowed per month for this user''s plan.';
COMMENT ON COLUMN usage_tracking.search_limits.last_reset_date IS 'Timestamp of the last time the quota was reset.';
COMMENT ON COLUMN usage_tracking.search_limits.created_at IS 'Timestamp when the user record was first created.';
COMMENT ON COLUMN usage_tracking.search_limits.updated_at IS 'Timestamp when the record was last updated.';

-- Enable Row Level Security
ALTER TABLE usage_tracking.search_limits ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own limits
CREATE POLICY "Allow users to read their own search limits"
ON usage_tracking.search_limits
FOR SELECT
USING (next_auth.uid() = user_id);

-- Allow service role to do anything
CREATE POLICY "Allow service role full access"
ON usage_tracking.search_limits
FOR ALL
USING (true)
WITH CHECK (true);

-- Create a function to increment search count atomically
CREATE OR REPLACE FUNCTION usage_tracking.increment_user_search_count(user_id_param UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO usage_tracking.search_limits (user_id, searches_this_month, monthly_search_limit)
    VALUES (user_id_param, 1, 50) -- Default limit for new users
    ON CONFLICT (user_id)
    DO UPDATE SET
        searches_this_month = usage_tracking.search_limits.searches_this_month + 1,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION usage_tracking.increment_user_search_count(UUID) TO service_role; 