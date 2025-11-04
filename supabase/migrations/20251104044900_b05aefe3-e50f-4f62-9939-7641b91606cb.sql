-- Create custom_events table for calendar management
CREATE TABLE IF NOT EXISTS public.custom_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dive_center_id UUID NOT NULL REFERENCES public.dive_centers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  category TEXT DEFAULT 'custom',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_events ENABLE ROW LEVEL SECURITY;

-- Create policies for custom events
CREATE POLICY "Vendors can view their own custom events"
  ON public.custom_events
  FOR SELECT
  USING (
    dive_center_id IN (
      SELECT id FROM public.dive_centers 
      WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can create custom events"
  ON public.custom_events
  FOR INSERT
  WITH CHECK (
    dive_center_id IN (
      SELECT id FROM public.dive_centers 
      WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can update their own custom events"
  ON public.custom_events
  FOR UPDATE
  USING (
    dive_center_id IN (
      SELECT id FROM public.dive_centers 
      WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can delete their own custom events"
  ON public.custom_events
  FOR DELETE
  USING (
    dive_center_id IN (
      SELECT id FROM public.dive_centers 
      WHERE owner_id = auth.uid()
    )
  );

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_custom_events_updated_at
  BEFORE UPDATE ON public.custom_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_custom_events_dive_center ON public.custom_events(dive_center_id);
CREATE INDEX idx_custom_events_dates ON public.custom_events(start_time, end_time);