-- Migration: Timetable Events
-- Description: Store calendar/timetable events (classes, exams, deadlines)
-- Author: Relae Team
-- Date: 2026-01-18

-- Ensure we're in the public schema
SET search_path TO public;

CREATE TABLE IF NOT EXISTS public.timetable_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_type VARCHAR(50) NOT NULL, -- 'google_calendar', 'outlook_calendar', 'icloud_calendar', 'manual_upload'
    source_id VARCHAR(255), -- External calendar event ID (for sync)
    event_type VARCHAR(50), -- 'class', 'office_hours', 'exam', 'assignment_due', 'other'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    all_day BOOLEAN DEFAULT false,
    recurrence_rule TEXT, -- iCal RRULE format (e.g., "FREQ=WEEKLY;BYDAY=MO,WE,FR")
    recurrence_end TIMESTAMPTZ, -- When recurring event ends
    color VARCHAR(7), -- Hex color for display
    reminder_minutes INTEGER, -- Minutes before event to remind
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_timetable_events_user ON public.timetable_events(user_id);
CREATE INDEX IF NOT EXISTS idx_timetable_events_time_range ON public.timetable_events(user_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_timetable_events_type ON public.timetable_events(event_type);
CREATE INDEX IF NOT EXISTS idx_timetable_events_source ON public.timetable_events(source_type, source_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_timetable_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS timetable_events_updated_at ON public.timetable_events;
CREATE TRIGGER timetable_events_updated_at
    BEFORE UPDATE ON public.timetable_events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_timetable_events_updated_at();

-- View for upcoming events (next 7 days)
CREATE OR REPLACE VIEW public.upcoming_timetable_events AS
SELECT 
    te.*,
    CASE 
        WHEN te.start_time < NOW() THEN 'in_progress'
        WHEN te.start_time <= (NOW() + INTERVAL '24 hours') THEN 'today'
        WHEN te.start_time <= (NOW() + INTERVAL '7 days') THEN 'this_week'
        ELSE 'future'
    END as time_status
FROM public.timetable_events te
WHERE te.start_time >= NOW() - INTERVAL '1 hour' -- Include events that just started
ORDER BY te.start_time ASC;
