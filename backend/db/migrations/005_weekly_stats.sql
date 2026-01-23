-- Migration 005: Weekly Stats Table
-- Tracks historical weekly performance for goal tracking and analytics

CREATE TABLE IF NOT EXISTS weekly_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    tasks_completed INTEGER DEFAULT 0 CHECK (tasks_completed >= 0),
    goal_met BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, week_start)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_weekly_stats_user_id ON weekly_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_stats_week_start ON weekly_stats(week_start);
CREATE INDEX IF NOT EXISTS idx_weekly_stats_user_week ON weekly_stats(user_id, week_start);

-- Function to get the start of week (Monday) for a given date
CREATE OR REPLACE FUNCTION get_week_start(input_date DATE)
RETURNS DATE AS $$
BEGIN
    RETURN input_date - ((EXTRACT(DOW FROM input_date)::INTEGER + 6) % 7);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_weekly_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the update function
DROP TRIGGER IF EXISTS weekly_stats_updated_at ON weekly_stats;
CREATE TRIGGER weekly_stats_updated_at
    BEFORE UPDATE ON weekly_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_weekly_stats_updated_at();
