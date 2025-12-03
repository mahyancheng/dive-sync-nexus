-- Drop the foreign key constraint that limits event_id to only custom_events
ALTER TABLE public.dive_trip_participants 
DROP CONSTRAINT IF EXISTS dive_trip_participants_event_id_fkey;

-- Add a comment explaining the event_id can reference either custom_events or dive_bookings
COMMENT ON COLUMN public.dive_trip_participants.event_id IS 'References either custom_events.id or dive_bookings.id';

-- Update RLS policy to allow viewing participants for both custom events and bookings
DROP POLICY IF EXISTS "Dive center owners can view all participants" ON public.dive_trip_participants;
DROP POLICY IF EXISTS "Dive center owners can update participants" ON public.dive_trip_participants;

CREATE POLICY "Dive center owners can view all participants" 
ON public.dive_trip_participants 
FOR SELECT 
USING (
  (EXISTS (
    SELECT 1 FROM custom_events ce
    JOIN dive_centers dc ON dc.id = ce.dive_center_id
    WHERE ce.id = dive_trip_participants.event_id AND dc.owner_id = auth.uid()
  ))
  OR
  (EXISTS (
    SELECT 1 FROM dive_bookings db
    JOIN dive_centers dc ON dc.id = db.dive_center_id
    WHERE db.id = dive_trip_participants.event_id AND dc.owner_id = auth.uid()
  ))
);

CREATE POLICY "Dive center owners can update participants" 
ON public.dive_trip_participants 
FOR UPDATE 
USING (
  (EXISTS (
    SELECT 1 FROM custom_events ce
    JOIN dive_centers dc ON dc.id = ce.dive_center_id
    WHERE ce.id = dive_trip_participants.event_id AND dc.owner_id = auth.uid()
  ))
  OR
  (EXISTS (
    SELECT 1 FROM dive_bookings db
    JOIN dive_centers dc ON dc.id = db.dive_center_id
    WHERE db.id = dive_trip_participants.event_id AND dc.owner_id = auth.uid()
  ))
);