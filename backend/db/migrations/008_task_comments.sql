-- Create task_comments table
CREATE TABLE IF NOT EXISTS public.task_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Policies for task_comments
-- Ideally we check if user is in the group of the task, but for MVP:
-- Allow read/write for authenticated users (assuming app logic protects access)
-- A more secure way would be to join tasks -> groups -> group_members

CREATE POLICY "Users can view comments on tasks" 
ON public.task_comments FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can create comments" 
ON public.task_comments FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Enable Realtime
alter publication supabase_realtime add table task_comments;
