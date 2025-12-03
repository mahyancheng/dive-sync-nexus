-- Add display_order column to dive_bookings and custom_events for drag-and-drop ordering
ALTER TABLE public.dive_bookings 
ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

ALTER TABLE public.custom_events 
ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- Add comments
COMMENT ON COLUMN public.dive_bookings.display_order IS 'Display order for same-day events';
COMMENT ON COLUMN public.custom_events.display_order IS 'Display order for same-day events';