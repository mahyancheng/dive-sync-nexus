-- Fix RLS policy to support both custom_events and dive_bookings
DROP POLICY IF EXISTS "Dive center owners can manage inventory assignments" ON event_inventory_assignments;

CREATE POLICY "Dive center owners can manage inventory assignments"
ON event_inventory_assignments
FOR ALL
USING (
  -- Check if event is a custom_event owned by the user
  EXISTS (
    SELECT 1
    FROM custom_events ce
    JOIN dive_centers dc ON dc.id = ce.dive_center_id
    WHERE ce.id = event_inventory_assignments.event_id
    AND dc.owner_id = auth.uid()
  )
  OR
  -- Check if event is a dive_booking owned by the user
  EXISTS (
    SELECT 1
    FROM dive_bookings db
    JOIN dive_centers dc ON dc.id = db.dive_center_id
    WHERE db.id = event_inventory_assignments.event_id
    AND dc.owner_id = auth.uid()
  )
)
WITH CHECK (
  -- Check if event is a custom_event owned by the user
  EXISTS (
    SELECT 1
    FROM custom_events ce
    JOIN dive_centers dc ON dc.id = ce.dive_center_id
    WHERE ce.id = event_inventory_assignments.event_id
    AND dc.owner_id = auth.uid()
  )
  OR
  -- Check if event is a dive_booking owned by the user
  EXISTS (
    SELECT 1
    FROM dive_bookings db
    JOIN dive_centers dc ON dc.id = db.dive_center_id
    WHERE db.id = event_inventory_assignments.event_id
    AND dc.owner_id = auth.uid()
  )
);