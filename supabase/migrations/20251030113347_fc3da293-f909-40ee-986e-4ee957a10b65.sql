-- Create dive equipment table for tracking gear inventory
CREATE TABLE public.dive_equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dive_center_id UUID NOT NULL REFERENCES public.dive_centers(id) ON DELETE CASCADE,
  equipment_type TEXT NOT NULL, -- 'BCD', 'Wetsuit', 'Regulator', 'Fins', 'Mask', etc.
  size TEXT,
  status TEXT NOT NULL DEFAULT 'available', -- 'available', 'rented', 'maintenance', 'retired'
  last_service_date TIMESTAMP WITH TIME ZONE,
  next_service_date TIMESTAMP WITH TIME ZONE,
  purchase_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dive tanks table for gas cylinder management
CREATE TABLE public.dive_tanks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dive_center_id UUID NOT NULL REFERENCES public.dive_centers(id) ON DELETE CASCADE,
  tank_number TEXT NOT NULL,
  gas_type TEXT NOT NULL DEFAULT 'Air', -- 'Air', 'Nitrox 32', 'Nitrox 36', etc.
  status TEXT NOT NULL DEFAULT 'empty', -- 'full', 'empty', 'needs_checking', 'maintenance'
  last_fill_date TIMESTAMP WITH TIME ZONE,
  hydrostatic_test_date TIMESTAMP WITH TIME ZONE,
  visual_test_date TIMESTAMP WITH TIME ZONE,
  pressure_bar INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bookings table for customer reservations
CREATE TABLE public.dive_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experience_id UUID REFERENCES public.experiences(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dive_center_id UUID NOT NULL REFERENCES public.dive_centers(id) ON DELETE CASCADE,
  booking_date TIMESTAMP WITH TIME ZONE NOT NULL,
  dive_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled'
  payment_status TEXT NOT NULL DEFAULT 'unpaid', -- 'unpaid', 'deposit', 'paid', 'refunded'
  total_amount NUMERIC NOT NULL,
  deposit_amount NUMERIC,
  participants_count INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create equipment assignments table
CREATE TABLE public.equipment_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.dive_bookings(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES public.dive_equipment(id) ON DELETE SET NULL,
  tank_id UUID REFERENCES public.dive_tanks(id) ON DELETE SET NULL,
  assigned_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  returned_date TIMESTAMP WITH TIME ZONE,
  condition_notes TEXT
);

-- Create staff assignments table for instructors/DMs
CREATE TABLE public.staff_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.dive_bookings(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'instructor', 'divemaster', 'assistant'
  commission_amount NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create maintenance logs table
CREATE TABLE public.maintenance_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dive_center_id UUID NOT NULL REFERENCES public.dive_centers(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES public.dive_equipment(id) ON DELETE SET NULL,
  tank_id UUID REFERENCES public.dive_tanks(id) ON DELETE SET NULL,
  maintenance_type TEXT NOT NULL, -- 'routine', 'repair', 'inspection'
  description TEXT NOT NULL,
  performed_by UUID REFERENCES public.profiles(id),
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  next_due_date TIMESTAMP WITH TIME ZONE,
  cost NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customer forms table for waivers/medical forms
CREATE TABLE public.customer_forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dive_center_id UUID NOT NULL REFERENCES public.dive_centers(id) ON DELETE CASCADE,
  form_type TEXT NOT NULL, -- 'medical', 'liability', 'refresher'
  signed_date TIMESTAMP WITH TIME ZONE,
  expiry_date TIMESTAMP WITH TIME ZONE,
  document_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'signed', 'expired'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dive_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dive_tanks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dive_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_forms ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dive_equipment
CREATE POLICY "Dive center owners can manage equipment"
ON public.dive_equipment FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.dive_centers
    WHERE dive_centers.id = dive_equipment.dive_center_id
    AND dive_centers.owner_id = auth.uid()
  )
);

CREATE POLICY "Equipment viewable by authenticated users"
ON public.dive_equipment FOR SELECT
USING (auth.uid() IS NOT NULL);

-- RLS Policies for dive_tanks
CREATE POLICY "Dive center owners can manage tanks"
ON public.dive_tanks FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.dive_centers
    WHERE dive_centers.id = dive_tanks.dive_center_id
    AND dive_centers.owner_id = auth.uid()
  )
);

-- RLS Policies for dive_bookings
CREATE POLICY "Dive center owners can manage bookings"
ON public.dive_bookings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.dive_centers
    WHERE dive_centers.id = dive_bookings.dive_center_id
    AND dive_centers.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own bookings"
ON public.dive_bookings FOR SELECT
USING (auth.uid() = customer_id);

CREATE POLICY "Users can create their own bookings"
ON public.dive_bookings FOR INSERT
WITH CHECK (auth.uid() = customer_id);

-- RLS Policies for equipment_assignments
CREATE POLICY "Dive center staff can manage assignments"
ON public.equipment_assignments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.dive_bookings
    JOIN public.dive_centers ON dive_centers.id = dive_bookings.dive_center_id
    WHERE dive_bookings.id = equipment_assignments.booking_id
    AND dive_centers.owner_id = auth.uid()
  )
);

-- RLS Policies for staff_assignments
CREATE POLICY "Dive center owners can manage staff assignments"
ON public.staff_assignments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.dive_bookings
    JOIN public.dive_centers ON dive_centers.id = dive_bookings.dive_center_id
    WHERE dive_bookings.id = staff_assignments.booking_id
    AND dive_centers.owner_id = auth.uid()
  )
);

CREATE POLICY "Staff can view their own assignments"
ON public.staff_assignments FOR SELECT
USING (auth.uid() = staff_id);

-- RLS Policies for maintenance_logs
CREATE POLICY "Dive center owners can manage maintenance logs"
ON public.maintenance_logs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.dive_centers
    WHERE dive_centers.id = maintenance_logs.dive_center_id
    AND dive_centers.owner_id = auth.uid()
  )
);

-- RLS Policies for customer_forms
CREATE POLICY "Dive center owners can manage customer forms"
ON public.customer_forms FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.dive_centers
    WHERE dive_centers.id = customer_forms.dive_center_id
    AND dive_centers.owner_id = auth.uid()
  )
);

CREATE POLICY "Customers can view their own forms"
ON public.customer_forms FOR SELECT
USING (auth.uid() = customer_id);

-- Create triggers for updated_at
CREATE TRIGGER update_dive_equipment_updated_at
BEFORE UPDATE ON public.dive_equipment
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dive_tanks_updated_at
BEFORE UPDATE ON public.dive_tanks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dive_bookings_updated_at
BEFORE UPDATE ON public.dive_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();