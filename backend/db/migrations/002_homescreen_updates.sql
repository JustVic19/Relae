-- Homescreen Schema Updates
-- Add display_name and avatar_url to user_profiles

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update the handle_new_user function to extract first name from email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name)
  VALUES (
    new.id, 
    new.email,
    -- Extract name before @ as default display name
    SPLIT_PART(new.email, '@', 1)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add order column to tasks for drag-to-reorder functionality
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Create index for faster ordering
CREATE INDEX IF NOT EXISTS idx_tasks_sort_order ON tasks(user_id, sort_order);

-- Allow tasks to be created without a candidate (for quick-add feature)
-- This is needed because quick-add tasks don't come from email parsing
ALTER TABLE tasks ALTER COLUMN candidate_id DROP NOT NULL;

-- Allow task_candidates without a source message (for manual task creation)
ALTER TABLE task_candidates ALTER COLUMN source_message_id DROP NOT NULL;
