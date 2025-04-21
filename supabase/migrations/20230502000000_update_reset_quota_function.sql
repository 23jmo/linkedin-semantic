-- Update the existing quota reset function to include search limits
CREATE OR REPLACE FUNCTION reset_monthly_quotas()
RETURNS void AS $$
BEGIN
  -- Reset all users' email quotas to 0
  UPDATE usage_tracking.email_generation_limits
  SET 
    emails_generated_this_month = 0,
    last_reset_date = NOW();
    
  -- Reset all users' search quotas to 0
  UPDATE usage_tracking.search_limits
  SET 
    searches_this_month = 0,
    last_reset_date = NOW();
    
  -- Log the reset activity
  INSERT INTO usage_tracking.quota_reset_logs (reset_timestamp, reset_type)
  VALUES (NOW(), 'monthly');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 