-- StudentOS Database Schema
-- Phase 1: Student Inbox → Action Feed

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email integrations
CREATE TABLE IF NOT EXISTS email_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook', 'forward')),
  provider_email TEXT NOT NULL,
  access_token_encrypted TEXT, -- encrypted OAuth tokens
  refresh_token_encrypted TEXT,
  watch_state JSONB, -- Gmail watch cursor, Graph subscription ID
  last_sync_cursor TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Source messages (normalized email storage)
CREATE TABLE IF NOT EXISTS source_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_id UUID NOT NULL REFERENCES email_integrations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_message_id TEXT NOT NULL,
  provider_thread_id TEXT,
  subject TEXT NOT NULL,
  from_name TEXT,
  from_email TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL,
  body_snippet TEXT, -- limited to 500 chars for privacy
  urls TEXT[],
  attachments JSONB, -- [{name, mime}]
  labels TEXT[],
  raw_hash TEXT, -- for dedup
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(integration_id, provider_message_id)
);

CREATE INDEX IF NOT EXISTS idx_source_messages_integration ON source_messages(integration_id);
CREATE INDEX IF NOT EXISTS idx_source_messages_received ON source_messages(received_at DESC);

-- Threads (canonical task with dedup/merge history)
-- MOVED BEFORE task_candidates because task_candidates references it
CREATE TABLE IF NOT EXISTS threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  canonical_title TEXT NOT NULL,
  canonical_due_date TIMESTAMPTZ,
  canonical_module TEXT,
  canonical_type TEXT NOT NULL,
  merge_fingerprint TEXT, -- for matching (e.g., submission link hash)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_threads_user ON threads(user_id);
CREATE INDEX IF NOT EXISTS idx_threads_fingerprint ON threads(merge_fingerprint);

-- Task candidates (extracted from emails)
CREATE TABLE IF NOT EXISTS task_candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_message_id UUID NOT NULL REFERENCES source_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('DEADLINE', 'READING', 'ADMIN', 'CHANGE', 'EVENT')),
  title TEXT NOT NULL,
  module TEXT,
  due_date TIMESTAMPTZ,
  location TEXT,
  confidence TEXT NOT NULL CHECK (confidence IN ('HIGH', 'MED', 'LOW')),
  confidence_score NUMERIC(3,2), -- 0.00-1.00
  extraction_reasons JSONB, -- why this was created
  links TEXT[],
  attachments JSONB,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'edited', 'ignored')),
  thread_id UUID REFERENCES threads(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidates_user_status ON task_candidates(user_id, status);
CREATE INDEX IF NOT EXISTS idx_candidates_thread ON task_candidates(thread_id);

-- Tasks (confirmed candidates)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES task_candidates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES threads(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  module TEXT,
  due_date TIMESTAMPTZ,
  notes TEXT,
  links TEXT[],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date);

-- Audit events (change log)
CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'thread', 'task', 'candidate'
  entity_id UUID NOT NULL,
  event_type TEXT NOT NULL, -- 'merged', 'due_date_changed', 'created', 'split'
  old_value JSONB,
  new_value JSONB,
  source_message_id UUID REFERENCES source_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_events(entity_type, entity_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- User profiles: users can only see/update their own
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- Email integrations: users can only manage their own
CREATE POLICY "Users can view own integrations" ON email_integrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own integrations" ON email_integrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own integrations" ON email_integrations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own integrations" ON email_integrations FOR DELETE USING (auth.uid() = user_id);

-- Source messages: users can view via their integrations
CREATE POLICY "Users can view own messages" ON source_messages FOR SELECT
  USING (
    integration_id IN (
      SELECT id FROM email_integrations WHERE user_id = auth.uid()
    )
  );

-- Task candidates: users can only see/manage their own
CREATE POLICY "Users can view own candidates" ON task_candidates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own candidates" ON task_candidates FOR UPDATE USING (auth.uid() = user_id);

-- Threads: users can only see/manage their own
CREATE POLICY "Users can view own threads" ON threads FOR SELECT USING (auth.uid() = user_id);

-- Tasks: users can only see/manage their own
CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON tasks FOR DELETE USING (auth.uid() = user_id);

-- Audit events: users can only view their own
CREATE POLICY "Users can view own audit events" ON audit_events FOR SELECT USING (auth.uid() = user_id);
