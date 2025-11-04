-- Add new fields to custom_events table
ALTER TABLE public.custom_events
ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'blue',
ADD COLUMN IF NOT EXISTS dive_type TEXT,
ADD COLUMN IF NOT EXISTS event_group_id UUID;

-- Create index for event groups
CREATE INDEX IF NOT EXISTS idx_custom_events_group ON public.custom_events(event_group_id);