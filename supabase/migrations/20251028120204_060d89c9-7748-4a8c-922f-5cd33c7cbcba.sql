-- Fix RLS policy causing infinite recursion on conversation_participants
-- Drop the existing SELECT policy if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'conversation_participants' AND policyname = 'Users can view participants in their conversations'
  ) THEN
    DROP POLICY "Users can view participants in their conversations" ON public.conversation_participants;
  END IF;
END $$;

-- Create a simpler, non-recursive SELECT policy
CREATE POLICY "Users can view their own participant rows"
ON public.conversation_participants
FOR SELECT
USING (auth.uid() = user_id);

-- Optional: keep existing INSERT policy as-is (do nothing)

-- Note: No changes to conversations/messages policies.
