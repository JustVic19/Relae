-- Migration: Email Tasks
-- Description: Link tasks created from email scanning with source email metadata
-- Author: Relae Team
-- Date: 2026-01-18

-- Ensure we're in the public schema
SET search_path TO public;

CREATE TABLE IF NOT EXISTS public.email_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    integration_id UUID NOT NULL REFERENCES public.email_integrations(id) ON DELETE CASCADE,
    email_id VARCHAR(255) NOT NULL, -- Provider's unique email ID
    email_subject TEXT,
    email_from VARCHAR(255),
    email_date TIMESTAMPTZ,
    extracted_data JSONB, -- Raw AI extraction result
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1), -- 0.00 to 1.00
    user_reviewed BOOLEAN DEFAULT false, -- Has user confirmed/edited the extracted task?
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(integration_id, email_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_tasks_task ON public.email_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_email_tasks_integration ON public.email_tasks(integration_id);
CREATE INDEX IF NOT EXISTS idx_email_tasks_confidence ON public.email_tasks(confidence_score);
CREATE INDEX IF NOT EXISTS idx_email_tasks_unreviewed ON public.email_tasks(user_reviewed) WHERE user_reviewed = false;

-- GIN index for JSONB queries on extracted_data
CREATE INDEX IF NOT EXISTS idx_email_tasks_extracted_data ON public.email_tasks USING GIN (extracted_data);
