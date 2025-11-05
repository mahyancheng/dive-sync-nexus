-- Fix RLS policy for event_inventory_assignments to allow inserts
DROP POLICY IF EXISTS "Dive center owners can manage inventory assignments" ON event_inventory_assignments;

CREATE POLICY "Dive center owners can manage inventory assignments"
ON event_inventory_assignments
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM custom_events ce
    JOIN dive_centers dc ON dc.id = ce.dive_center_id
    WHERE ce.id = event_inventory_assignments.event_id
    AND dc.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM custom_events ce
    JOIN dive_centers dc ON dc.id = ce.dive_center_id
    WHERE ce.id = event_inventory_assignments.event_id
    AND dc.owner_id = auth.uid()
  )
);