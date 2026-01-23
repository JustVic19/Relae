-- Create group_messages table
CREATE TABLE IF NOT EXISTS public.group_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- Helper function to check membership (reused from 008_groups_collaboration.sql if available, else define logic inline)
-- We'll assume check_is_group_member exists or we use the join logic directly.
-- For safety/simplicity in this migration:

CREATE POLICY "Group members can view messages" 
ON public.group_messages FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM group_members 
        WHERE group_members.group_id = group_messages.group_id 
        AND group_members.user_id = auth.uid()
    )
);

CREATE POLICY "Group members can send messages" 
ON public.group_messages FOR INSERT 
WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
        SELECT 1 FROM group_members 
        WHERE group_members.group_id = group_messages.group_id 
        AND group_members.user_id = auth.uid()
    )
);

-- Enable Realtime
alter publication supabase_realtime add table group_messages;
