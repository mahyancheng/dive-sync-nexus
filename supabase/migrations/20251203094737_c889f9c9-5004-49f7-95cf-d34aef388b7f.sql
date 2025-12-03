-- Drop the foreign key constraint that limits event_id to only custom_events
ALTER TABLE public.event_inventory_assignments 
DROP CONSTRAINT IF EXISTS event_inventory_assignments_event_id_fkey;

-- Add a comment explaining the event_id can reference either custom_events or dive_bookings
COMMENT ON COLUMN public.event_inventory_assignments.event_id IS 'References either custom_events.id or dive_bookings.id';
