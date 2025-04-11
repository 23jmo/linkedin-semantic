
CREATE table linkedin_profiles.referrals(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES next_auth.users(id),
  referral_code TEXT NOT NULL, 
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE table linkedin_profiles.referred (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referred_id UUID NOT NULL UNIQUE REFERENCES next_auth.users(id), -- who signed up
  referrer_id UUID NOT NULL REFERENCES next_auth.users(id),         -- who referred them
  referral_code TEXT NOT NULL,                                      -- which code was used
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ                                          -- auto-filled by trigger
);



CREATE OR REPLACE FUNCTION linkedin_profiles.handle_referral_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Reward the referrer immediately
  UPDATE usage_tracking.email_generation_limits
  SET monthly_limit = monthly_limit + 10
  WHERE user_id = NEW.referrer_id;

  -- Mark referral as completed
  NEW.completed_at := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE trigger on_referral_completed
BEFORE INSERT ON linkedin_profiles.referred
FOR EACH ROW
EXECUTE FUNCTION linkedin_profiles.handle_referral_completion();