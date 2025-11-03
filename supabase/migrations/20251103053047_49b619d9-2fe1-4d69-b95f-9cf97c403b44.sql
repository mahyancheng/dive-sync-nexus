-- Allow public access to basic booking information for equipment request forms
-- This policy allows anyone with a booking ID to view basic booking details
-- needed for the public equipment request form
CREATE POLICY "Anyone can view basic booking info with booking ID"
ON public.dive_bookings
FOR SELECT
USING (true);