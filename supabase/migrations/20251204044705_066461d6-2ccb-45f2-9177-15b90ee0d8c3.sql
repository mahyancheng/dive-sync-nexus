-- Create booking tasks table for tracking preparation and operation tasks
CREATE TABLE public.booking_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dive_center_id UUID NOT NULL REFERENCES public.dive_centers(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.dive_bookings(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.custom_events(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL, -- 'equipment_prep', 'tank_fill', 'boat_prep', 'briefing', 'checkout', 'custom'
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES public.profiles(id),
  priority INTEGER NOT NULL DEFAULT 1, -- 1=low, 2=medium, 3=high
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.booking_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Dive center owners can manage tasks"
ON public.booking_tasks FOR ALL
USING (EXISTS (
  SELECT 1 FROM dive_centers
  WHERE dive_centers.id = booking_tasks.dive_center_id
  AND dive_centers.owner_id = auth.uid()
));

-- Trigger for updated_at
CREATE TRIGGER update_booking_tasks_updated_at
BEFORE UPDATE ON public.booking_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();