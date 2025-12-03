-- Add color column to dive_bookings for calendar display
ALTER TABLE public.dive_bookings 
ADD COLUMN IF NOT EXISTS color text DEFAULT 'blue';

-- Add comment
COMMENT ON COLUMN public.dive_bookings.color IS 'Color for calendar display';