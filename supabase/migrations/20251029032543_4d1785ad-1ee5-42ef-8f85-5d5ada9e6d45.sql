-- Create public storage bucket for post media (idempotent)
insert into storage.buckets (id, name, public)
select 'posts', 'posts', true
where not exists (select 1 from storage.buckets where id = 'posts');

-- Policies with idempotent guards
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public can read posts media'
  ) THEN
    CREATE POLICY "Public can read posts media"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'posts');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can upload to posts'
  ) THEN
    CREATE POLICY "Authenticated users can upload to posts"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'posts' AND auth.role() = 'authenticated');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can update their own posts files'
  ) THEN
    CREATE POLICY "Users can update their own posts files"
    ON storage.objects
    FOR UPDATE
    USING (
      bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete their own posts files'
  ) THEN
    CREATE POLICY "Users can delete their own posts files"
    ON storage.objects
    FOR DELETE
    USING (
      bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;