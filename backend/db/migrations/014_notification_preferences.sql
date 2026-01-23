-- Migration 014: Add Notification Settings to User Preferences

ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{
    "daily_briefing": true,
    "weekly_report": true,
    "task_reminders": true,
    "achievements": true,
    "marketing": false
}'::jsonb;

-- Update existing records to have default settings if null
UPDATE user_preferences
SET notification_settings = '{
    "daily_briefing": true,
    "weekly_report": true,
    "task_reminders": true,
    "achievements": true,
    "marketing": false
}'::jsonb
WHERE notification_settings IS NULL;
