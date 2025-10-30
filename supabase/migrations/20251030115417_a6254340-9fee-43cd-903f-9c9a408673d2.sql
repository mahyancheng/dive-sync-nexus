-- Create boats table
CREATE TABLE public.boats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dive_center_id UUID NOT NULL REFERENCES public.dive_centers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  max_capacity INTEGER NOT NULL DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create compressors table
CREATE TABLE public.compressors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dive_center_id UUID NOT NULL REFERENCES public.dive_centers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  running_hours INTEGER NOT NULL DEFAULT 0,
  dives_since_service INTEGER NOT NULL DEFAULT 0,
  maintenance_trigger INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dive_conditions table for weather/tide tracking
CREATE TABLE public.dive_conditions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.dive_bookings(id) ON DELETE CASCADE,
  temperature NUMERIC,
  wind_speed NUMERIC,
  wave_height NUMERIC,
  tide_status TEXT,
  flag_status TEXT NOT NULL DEFAULT 'green',
  flag_reason TEXT,
  override_by UUID REFERENCES auth.users(id),
  override_reason TEXT,
  override_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create priority_rules table
CREATE TABLE public.priority_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dive_center_id UUID NOT NULL REFERENCES public.dive_centers(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  customer_type TEXT NOT NULL,
  dive_type TEXT NOT NULL,
  boat_id UUID REFERENCES public.boats(id),
  priority_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trip_catering table
CREATE TABLE public.trip_catering (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.dive_bookings(id) ON DELETE CASCADE,
  total_pax INTEGER NOT NULL,
  meal_items TEXT[],
  preparation_status TEXT NOT NULL DEFAULT 'planned',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add new fields to dive_bookings
ALTER TABLE public.dive_bookings 
  ADD COLUMN IF NOT EXISTS boat_id UUID REFERENCES public.boats(id),
  ADD COLUMN IF NOT EXISTS dive_type TEXT DEFAULT 'shore',
  ADD COLUMN IF NOT EXISTS max_capacity INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS group_name TEXT;

-- Add new fields to dive_tanks for nitrox tracking
ALTER TABLE public.dive_tanks
  ADD COLUMN IF NOT EXISTS nitrox_o2_percentage NUMERIC,
  ADD COLUMN IF NOT EXISTS nitrox_mod NUMERIC,
  ADD COLUMN IF NOT EXISTS filler_name TEXT,
  ADD COLUMN IF NOT EXISTS fill_timestamp TIMESTAMP WITH TIME ZONE;

-- Add customer sizing link to dive_equipment
ALTER TABLE public.dive_equipment
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS assigned_booking_id UUID REFERENCES public.dive_bookings(id);

-- Add boat and compressor references to maintenance_logs
ALTER TABLE public.maintenance_logs
  ADD COLUMN IF NOT EXISTS boat_id UUID REFERENCES public.boats(id),
  ADD COLUMN IF NOT EXISTS compressor_id UUID REFERENCES public.compressors(id);

-- Enable RLS on new tables
ALTER TABLE public.boats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compressors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dive_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.priority_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_catering ENABLE ROW LEVEL SECURITY;

-- RLS Policies for boats
CREATE POLICY "Dive center owners can manage boats"
  ON public.boats FOR ALL
  USING (EXISTS (
    SELECT 1 FROM dive_centers
    WHERE dive_centers.id = boats.dive_center_id
    AND dive_centers.owner_id = auth.uid()
  ));

CREATE POLICY "Boats viewable by authenticated users"
  ON public.boats FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- RLS Policies for compressors
CREATE POLICY "Dive center owners can manage compressors"
  ON public.compressors FOR ALL
  USING (EXISTS (
    SELECT 1 FROM dive_centers
    WHERE dive_centers.id = compressors.dive_center_id
    AND dive_centers.owner_id = auth.uid()
  ));

-- RLS Policies for dive_conditions
CREATE POLICY "Dive center owners can manage conditions"
  ON public.dive_conditions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM dive_bookings
    JOIN dive_centers ON dive_centers.id = dive_bookings.dive_center_id
    WHERE dive_bookings.id = dive_conditions.booking_id
    AND dive_centers.owner_id = auth.uid()
  ));

CREATE POLICY "Customers can view their booking conditions"
  ON public.dive_conditions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM dive_bookings
    WHERE dive_bookings.id = dive_conditions.booking_id
    AND dive_bookings.customer_id = auth.uid()
  ));

-- RLS Policies for priority_rules
CREATE POLICY "Dive center owners can manage priority rules"
  ON public.priority_rules FOR ALL
  USING (EXISTS (
    SELECT 1 FROM dive_centers
    WHERE dive_centers.id = priority_rules.dive_center_id
    AND dive_centers.owner_id = auth.uid()
  ));

-- RLS Policies for trip_catering
CREATE POLICY "Dive center staff can manage catering"
  ON public.trip_catering FOR ALL
  USING (EXISTS (
    SELECT 1 FROM dive_bookings
    JOIN dive_centers ON dive_centers.id = dive_bookings.dive_center_id
    WHERE dive_bookings.id = trip_catering.booking_id
    AND dive_centers.owner_id = auth.uid()
  ));

-- Add triggers for updated_at
CREATE TRIGGER update_boats_updated_at
  BEFORE UPDATE ON public.boats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_compressors_updated_at
  BEFORE UPDATE ON public.compressors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trip_catering_updated_at
  BEFORE UPDATE ON public.trip_catering
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();