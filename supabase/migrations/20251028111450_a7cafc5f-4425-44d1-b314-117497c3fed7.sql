-- Function to create or get a direct (1:1) conversation between the current user and a target user
CREATE OR REPLACE FUNCTION public.create_or_get_direct_conversation(target_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conv_id uuid;
  me uuid := auth.uid();
BEGIN
  IF target_user_id IS NULL OR me IS NULL THEN
    RAISE EXCEPTION 'Missing target user or not authenticated';
  END IF;

  IF target_user_id = me THEN
    RAISE EXCEPTION 'Cannot create a conversation with yourself';
  END IF;

  -- Try to find an existing direct conversation between both users
  SELECT c.id INTO conv_id
  FROM public.conversations c
  JOIN public.conversation_participants cp1 ON cp1.conversation_id = c.id AND cp1.user_id = me
  JOIN public.conversation_participants cp2 ON cp2.conversation_id = c.id AND cp2.user_id = target_user_id
  WHERE c.is_group = false
  LIMIT 1;

  IF conv_id IS NOT NULL THEN
    RETURN conv_id;
  END IF;

  -- Create a new conversation
  INSERT INTO public.conversations (is_group)
  VALUES (false)
  RETURNING id INTO conv_id;

  -- Add both participants (this requires SECURITY DEFINER to bypass RLS)
  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES (conv_id, me);

  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES (conv_id, target_user_id);

  RETURN conv_id;
END;
$$;