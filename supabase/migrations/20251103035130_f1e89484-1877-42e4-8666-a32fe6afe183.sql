-- Add location column to dive_bookings table
ALTER TABLE public.dive_bookings 
ADD COLUMN location text;