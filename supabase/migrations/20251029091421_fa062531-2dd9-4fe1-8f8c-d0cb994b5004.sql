-- Drop constraint if it somehow exists (cleanup)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'posts_author_id_fkey'
  ) THEN
    ALTER TABLE public.posts DROP CONSTRAINT posts_author_id_fkey;
  END IF;
END $$;

-- Add foreign key from posts.author_id to profiles.id
ALTER TABLE public.posts
ADD CONSTRAINT posts_author_id_fkey
FOREIGN KEY (author_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);