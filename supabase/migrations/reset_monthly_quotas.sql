-- Create the function to reset quotas
CREATE OR REPLACE FUNCTION reset_monthly_quotas()
RETURNS void AS $$
BEGIN
  -- Reset all users' email quotas to 0
  UPDATE usage_tracking.email_generation_limits
  SET 
    emails_generated_this_month = 0,
    last_reset_date = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 