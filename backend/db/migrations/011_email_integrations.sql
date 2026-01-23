-- Migration: Email Integrations
-- Description: Store user email account connections and OAuth credentials
-- Author: Relae Team
-- Date: 2026-01-18

-- Ensure we're in the public schema
SET search_path TO public;

-- Drop existing table if it exists (clean slate)
DROP TABLE IF EXISTS public.email_integrations CASCADE;

-- Create email_integrations table
CREATE TABLE public.email_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    email_address VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    sync_enabled BOOLEAN DEFAULT true,
    last_synced_at TIMESTAMPTZ,
    sync_cursor VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT email_integrations_user_id_email_address_key UNIQUE(user_id, email_address)
);

-- Indexes for faster lookups
CREATE INDEX idx_email_integrations_user ON public.email_integrations(user_id);
CREATE INDEX idx_email_integrations_sync ON public.email_integrations(sync_enabled, last_synced_at) WHERE sync_enabled = true;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_email_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER email_integrations_updated_at
    BEFORE UPDATE ON public.email_integrations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_email_integrations_updated_at();
