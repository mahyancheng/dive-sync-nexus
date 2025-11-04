-- Add flexible equipment fields to equipment_rental_requests
ALTER TABLE equipment_rental_requests
ADD COLUMN IF NOT EXISTS equipment_type TEXT,
ADD COLUMN IF NOT EXISTS size TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_equipment_rental_requests_equipment_type 
ON equipment_rental_requests(equipment_type);