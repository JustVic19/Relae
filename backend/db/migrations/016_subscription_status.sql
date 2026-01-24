-- Add subscription status and usage tracking to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free', -- 'active', 'past_due', 'canceled', 'free'
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS daily_ai_scans INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_ai_usage_date DATE DEFAULT CURRENT_DATE;

-- Create function to reset daily counts if date changed (lazy reset)
CREATE OR REPLACE FUNCTION check_and_reset_ai_usage() 
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.last_ai_usage_date < CURRENT_DATE THEN
    NEW.daily_ai_scans := 0;
    NEW.last_ai_usage_date := CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run before update (optional, but handling in app logic is easier for now)
-- We will handle the reset logic in the service layer for simplicity and performance control
