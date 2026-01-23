-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    code TEXT UNIQUE NOT NULL, -- Short code for joining
    admin_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member', -- 'admin', 'member'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);

-- Add collaboration fields to tasks
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL;

-- Enable RLS for groups
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Group RLS Policies
-- Users can view groups they are members of
CREATE POLICY "Users can view groups they belong to" 
    ON groups FOR SELECT 
    USING (
        check_is_group_member(id)
    );

-- Users can create groups (and automatically become admin via trigger/logic)
CREATE POLICY "Users can create groups" 
    ON groups FOR INSERT 
    WITH CHECK (auth.uid() = admin_id);

-- Admins can update their groups
CREATE POLICY "Admins can update their groups" 
    ON groups FOR UPDATE 
    USING (auth.uid() = admin_id);

-- Enable RLS for group_members
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Users can view members of their groups
-- Helper function to check membership without triggering RLS (breaks recursion)
CREATE OR REPLACE FUNCTION check_is_group_member(_group_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = _group_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users can view members of their groups
CREATE POLICY "Users can view members of their groups" 
    ON group_members FOR SELECT 
    USING (
         check_is_group_member(group_id)
    );

-- Users can join (insert themselves) - simplified for MVP
CREATE POLICY "Users can join groups" 
    ON group_members FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Update RLS for tasks
CREATE POLICY "Group members can view group tasks" 
    ON tasks FOR SELECT 
    USING (
        group_id IS NOT NULL AND check_is_group_member(group_id)
    );

CREATE POLICY "Group members can create group tasks" 
    ON tasks FOR INSERT 
    WITH CHECK (
        group_id IS NOT NULL AND check_is_group_member(group_id)
    );

CREATE POLICY "Group members can update group tasks" 
    ON tasks FOR UPDATE 
    USING (
        group_id IS NOT NULL AND check_is_group_member(group_id)
    );
