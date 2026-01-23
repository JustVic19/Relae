-- User Devices (for Push Notifications)
CREATE TABLE IF NOT EXISTS user_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    device_token TEXT NOT NULL,
    device_type TEXT, -- 'ios', 'android'
    platform TEXT,    -- 'expo'
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, device_token)
);

-- Enable RLS
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own devices" 
    ON user_devices FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own devices" 
    ON user_devices FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own devices" 
    ON user_devices FOR DELETE 
    USING (auth.uid() = user_id);

-- Cleanup function to remove old tokens (optional)
-- Trigger to update updated_at?
