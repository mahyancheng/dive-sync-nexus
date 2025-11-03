-- Create storage bucket for product and experience images
INSERT INTO storage.buckets (id, name, public)
VALUES ('marketplace', 'marketplace', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for marketplace bucket
CREATE POLICY "Anyone can view marketplace images"
ON storage.objects FOR SELECT
USING (bucket_id = 'marketplace');

CREATE POLICY "Authenticated users can upload marketplace images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'marketplace' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own marketplace images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'marketplace' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own marketplace images"
ON storage.objects FOR DELETE
USING (bucket_id = 'marketplace' AND auth.uid() IS NOT NULL);