-- Add end_date column to dive_bookings for multi-day events
ALTER TABLE public.dive_bookings
ADD COLUMN end_date TIMESTAMP WITH TIME ZONE;

-- Add comment explaining the column
COMMENT ON COLUMN public.dive_bookings.end_date IS 'End date for multi-day events. If NULL, event is single-day (ends on dive_date).';