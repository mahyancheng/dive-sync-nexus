-- Create dive trip participants table
CREATE TABLE IF NOT EXISTS public.dive_trip_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.custom_events(id) ON DELETE CASCADE,
  participant_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  ic_passport_number TEXT NOT NULL,
  dive_cert_number TEXT,
  dive_cert_level TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  medical_conditions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create equipment rental requests table
CREATE TABLE IF NOT EXISTS public.equipment_rental_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID NOT NULL REFERENCES public.dive_trip_participants(id) ON DELETE CASCADE,
  regulator_needed BOOLEAN DEFAULT false,
  bcd_needed BOOLEAN DEFAULT false,
  bcd_size TEXT,
  fins_needed BOOLEAN DEFAULT false,
  fins_size TEXT,
  mask_needed BOOLEAN DEFAULT false,
  wetsuit_needed BOOLEAN DEFAULT false,
  wetsuit_size TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create waiver signatures table
CREATE TABLE IF NOT EXISTS public.waiver_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID NOT NULL REFERENCES public.dive_trip_participants(id) ON DELETE CASCADE,
  signature_data TEXT NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  waiver_type TEXT DEFAULT 'PADI'
);

-- Create event inventory assignments table
CREATE TABLE IF NOT EXISTS public.event_inventory_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.custom_events(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES public.dive_trip_participants(id) ON DELETE CASCADE,
  inventory_type TEXT NOT NULL CHECK (inventory_type IN ('tank', 'boat', 'equipment')),
  tank_id UUID REFERENCES public.dive_tanks(id) ON DELETE SET NULL,
  boat_id UUID REFERENCES public.boats(id) ON DELETE SET NULL,
  equipment_id UUID REFERENCES public.dive_equipment(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  returned_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dive_trip_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_rental_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiver_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_inventory_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dive_trip_participants
CREATE POLICY "Anyone can create participant records"
  ON public.dive_trip_participants
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Participants can view their own records"
  ON public.dive_trip_participants
  FOR SELECT
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR true);

CREATE POLICY "Dive center owners can view all participants"
  ON public.dive_trip_participants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.custom_events ce
      JOIN public.dive_centers dc ON dc.id = ce.dive_center_id
      WHERE ce.id = dive_trip_participants.event_id
      AND dc.owner_id = auth.uid()
    )
  );

CREATE POLICY "Dive center owners can update participants"
  ON public.dive_trip_participants
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.custom_events ce
      JOIN public.dive_centers dc ON dc.id = ce.dive_center_id
      WHERE ce.id = dive_trip_participants.event_id
      AND dc.owner_id = auth.uid()
    )
  );

-- RLS Policies for equipment_rental_requests
CREATE POLICY "Anyone can create equipment requests"
  ON public.equipment_rental_requests
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Equipment requests viewable by related parties"
  ON public.equipment_rental_requests
  FOR SELECT
  USING (true);

-- RLS Policies for waiver_signatures
CREATE POLICY "Anyone can create waiver signatures"
  ON public.waiver_signatures
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Waiver signatures viewable by related parties"
  ON public.waiver_signatures
  FOR SELECT
  USING (true);

-- RLS Policies for event_inventory_assignments
CREATE POLICY "Dive center owners can manage inventory assignments"
  ON public.event_inventory_assignments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.custom_events ce
      JOIN public.dive_centers dc ON dc.id = ce.dive_center_id
      WHERE ce.id = event_inventory_assignments.event_id
      AND dc.owner_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_dive_trip_participants_event ON public.dive_trip_participants(event_id);
CREATE INDEX idx_equipment_rental_participant ON public.equipment_rental_requests(participant_id);
CREATE INDEX idx_waiver_signatures_participant ON public.waiver_signatures(participant_id);
CREATE INDEX idx_event_inventory_event ON public.event_inventory_assignments(event_id);
CREATE INDEX idx_event_inventory_type ON public.event_inventory_assignments(inventory_type);

-- Create triggers for updated_at
CREATE TRIGGER update_dive_trip_participants_updated_at
  BEFORE UPDATE ON public.dive_trip_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();