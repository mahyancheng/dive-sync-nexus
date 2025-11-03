-- Create equipment_requests table for client equipment needs
CREATE TABLE public.equipment_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.dive_bookings(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  bcd_needed BOOLEAN NOT NULL DEFAULT false,
  bcd_size TEXT,
  fins_needed BOOLEAN NOT NULL DEFAULT false,
  fins_size TEXT,
  regulator_needed BOOLEAN NOT NULL DEFAULT false,
  mask_needed BOOLEAN NOT NULL DEFAULT false,
  wetsuit_needed BOOLEAN NOT NULL DEFAULT false,
  wetsuit_size TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.equipment_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create equipment requests (public form)
CREATE POLICY "Anyone can create equipment requests"
ON public.equipment_requests
FOR INSERT
WITH CHECK (true);

-- Allow dive center owners to view requests for their bookings
CREATE POLICY "Dive center owners can view equipment requests"
ON public.equipment_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.dive_bookings
    JOIN public.dive_centers ON dive_centers.id = dive_bookings.dive_center_id
    WHERE dive_bookings.id = equipment_requests.booking_id
    AND dive_centers.owner_id = auth.uid()
  )
);

-- Allow dive center owners to update requests for their bookings
CREATE POLICY "Dive center owners can update equipment requests"
ON public.equipment_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.dive_bookings
    JOIN public.dive_centers ON dive_centers.id = dive_bookings.dive_center_id
    WHERE dive_bookings.id = equipment_requests.booking_id
    AND dive_centers.owner_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_equipment_requests_updated_at
BEFORE UPDATE ON public.equipment_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();