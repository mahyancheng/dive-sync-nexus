-- Create experiences (dive trips/bookings) table
CREATE TABLE public.experiences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dive_center_id uuid REFERENCES public.dive_centers(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  location text NOT NULL,
  price numeric NOT NULL,
  duration text NOT NULL,
  difficulty text NOT NULL DEFAULT 'All levels',
  max_depth text,
  total_spots integer NOT NULL DEFAULT 10,
  spots_left integer NOT NULL DEFAULT 10,
  next_date timestamp with time zone,
  image_url text,
  includes text[] DEFAULT '{}',
  rating numeric DEFAULT 0,
  reviews_count integer DEFAULT 0,
  badges text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  brand text,
  description text,
  price numeric NOT NULL,
  image_url text,
  category text,
  in_stock boolean DEFAULT true,
  rating numeric DEFAULT 0,
  reviews_count integer DEFAULT 0,
  badges text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Update posts table to support linking to experiences or products
ALTER TABLE public.posts 
  ADD COLUMN experience_id uuid REFERENCES public.experiences(id) ON DELETE SET NULL,
  ADD COLUMN product_id uuid REFERENCES public.products(id) ON DELETE SET NULL;

-- Enable RLS on new tables
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- RLS policies for experiences
CREATE POLICY "Experiences are viewable by everyone" 
ON public.experiences 
FOR SELECT 
USING (true);

CREATE POLICY "Dive center owners can create experiences" 
ON public.experiences 
FOR INSERT 
WITH CHECK (
  dive_center_id IS NULL OR 
  EXISTS (
    SELECT 1 FROM public.dive_centers 
    WHERE dive_centers.id = experiences.dive_center_id 
    AND dive_centers.owner_id = auth.uid()
  )
);

CREATE POLICY "Dive center owners can update their experiences" 
ON public.experiences 
FOR UPDATE 
USING (
  dive_center_id IS NULL OR
  EXISTS (
    SELECT 1 FROM public.dive_centers 
    WHERE dive_centers.id = experiences.dive_center_id 
    AND dive_centers.owner_id = auth.uid()
  )
);

CREATE POLICY "Dive center owners can delete their experiences" 
ON public.experiences 
FOR DELETE 
USING (
  dive_center_id IS NULL OR
  EXISTS (
    SELECT 1 FROM public.dive_centers 
    WHERE dive_centers.id = experiences.dive_center_id 
    AND dive_centers.owner_id = auth.uid()
  )
);

-- RLS policies for products
CREATE POLICY "Products are viewable by everyone" 
ON public.products 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create products" 
ON public.products 
FOR INSERT 
WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their products" 
ON public.products 
FOR UPDATE 
USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their products" 
ON public.products 
FOR DELETE 
USING (auth.uid() = seller_id);

-- Add triggers for updated_at
CREATE TRIGGER update_experiences_updated_at
BEFORE UPDATE ON public.experiences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();