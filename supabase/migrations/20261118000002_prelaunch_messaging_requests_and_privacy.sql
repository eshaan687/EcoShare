-- EcoShare Pre-Launch Migration: Real User-to-User Messaging Requests, Privacy, Blocking & Reporting
-- Description: Extends conversations/participants for Requests & Archived tabs, adds user_blocks and message_reports,
-- and provides transaction-safe RPCs for initiating and responding to message requests.

-- 1. Messaging Privacy Preference on Profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS allow_messages_from TEXT NOT NULL DEFAULT 'everyone'
  CHECK (allow_messages_from IN ('everyone', 'following', 'none'));

-- 2. Extend Conversations and Participants for Request Workflow & Archiving
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'accepted'
    CHECK (status IN ('pending', 'accepted', 'declined')),
  ADD COLUMN IF NOT EXISTS initiated_by TEXT REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recipient_id TEXT REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ;

ALTER TABLE public.conversation_participants
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

-- Allow participants to update their own participant row (e.g. last_read_at, is_archived)
DROP POLICY IF EXISTS "Participants can update their own participation state" ON public.conversation_participants;
CREATE POLICY "Participants can update their own participation state"
ON public.conversation_participants
FOR UPDATE
TO authenticated
USING ((select auth.jwt() ->> 'sub') = user_id)
WITH CHECK ((select auth.jwt() ->> 'sub') = user_id);

-- 3. User Blocks Table
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id TEXT NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  blocked_id TEXT NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_user_blocks_no_self_block CHECK (blocker_id <> blocked_id),
  CONSTRAINT uq_user_blocks_pair UNIQUE (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON public.user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON public.user_blocks(blocked_id);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own block relationships" ON public.user_blocks;
CREATE POLICY "Users can view their own block relationships"
ON public.user_blocks
FOR SELECT
TO authenticated
USING (
  (select auth.jwt() ->> 'sub') = blocker_id
  OR (select auth.jwt() ->> 'sub') = blocked_id
);

DROP POLICY IF EXISTS "Users can block others" ON public.user_blocks;
CREATE POLICY "Users can block others"
ON public.user_blocks
FOR INSERT
TO authenticated
WITH CHECK (
  (select auth.jwt() ->> 'sub') = blocker_id
  AND blocker_id <> blocked_id
);

DROP POLICY IF EXISTS "Users can unblock others" ON public.user_blocks;
CREATE POLICY "Users can unblock others"
ON public.user_blocks
FOR DELETE
TO authenticated
USING ((select auth.jwt() ->> 'sub') = blocker_id);

-- 4. Message Reports Table
CREATE TABLE IF NOT EXISTS public.message_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id TEXT NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  reported_user_id TEXT REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  reason TEXT NOT NULL CHECK (char_length(trim(reason)) >= 3 AND char_length(trim(reason)) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.message_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can submit message reports" ON public.message_reports;
CREATE POLICY "Users can submit message reports"
ON public.message_reports
FOR INSERT
TO authenticated
WITH CHECK ((select auth.jwt() ->> 'sub') = reporter_id);

DROP POLICY IF EXISTS "Reporters and admins can view message reports" ON public.message_reports;
CREATE POLICY "Reporters and admins can view message reports"
ON public.message_reports
FOR SELECT
TO authenticated
USING ((select auth.jwt() ->> 'sub') = reporter_id OR public.is_admin());

-- 5. Helper: Check if either user has blocked the other
CREATE OR REPLACE FUNCTION public.is_blocked_between(p_user_a TEXT, p_user_b TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_blocks
    WHERE (blocker_id = p_user_a AND blocked_id = p_user_b)
       OR (blocker_id = p_user_b AND blocked_id = p_user_a)
  );
$$;

REVOKE ALL ON FUNCTION public.is_blocked_between(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_blocked_between(TEXT, TEXT) TO authenticated, service_role;

-- 6. Strengthen Messages INSERT Policy to Enforce Blocking & Pending Request Limits
DROP POLICY IF EXISTS "Participants can send messages in their conversations" ON public.messages;
CREATE POLICY "Participants can send messages in their conversations"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  (select auth.jwt() ->> 'sub') = sender_id
  AND public.is_conversation_participant(conversation_id)
  AND char_length(trim(content)) >= 1
  AND char_length(content) <= 2000
  AND EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = conversation_id
      AND c.status <> 'declined'
      AND (
        c.status = 'accepted'
        OR (
          c.status = 'pending'
          AND c.initiated_by = (select auth.jwt() ->> 'sub')
          AND (
            SELECT count(*)
            FROM public.messages m
            WHERE m.conversation_id = c.id
          ) < 3
        )
      )
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id
      AND cp.user_id <> (select auth.jwt() ->> 'sub')
      AND public.is_blocked_between((select auth.jwt() ->> 'sub'), cp.user_id)
  )
);

-- 7. Extend notifications type check to include message_request
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'like',
    'comment',
    'reply',
    'follow',
    'message_request',
    'message_accepted',
    'impact_submitted',
    'impact_approved',
    'impact_rejected',
    'changes_requested',
    'badge_awarded'
  ));

-- 8. RPC: Start or Reuse Direct Conversation / Message Request
CREATE OR REPLACE FUNCTION public.start_or_get_direct_conversation(
  p_recipient_id TEXT,
  p_intro_message TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id TEXT;
  v_caller_name TEXT;
  v_recipient public.profiles%ROWTYPE;
  v_existing_conv public.conversations%ROWTYPE;
  v_conv_id UUID;
  v_status TEXT;
  v_recipient_follows_caller BOOLEAN := false;
  v_trimmed_intro TEXT;
BEGIN
  v_caller_id := (SELECT auth.jwt() ->> 'sub');
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to start a conversation.';
  END IF;

  IF v_caller_id = p_recipient_id THEN
    RAISE EXCEPTION 'You cannot message yourself.';
  END IF;

  IF public.is_blocked_between(v_caller_id, p_recipient_id) THEN
    RAISE EXCEPTION 'Messaging is unavailable between these accounts.';
  END IF;

  SELECT * INTO v_recipient
  FROM public.profiles
  WHERE user_id = p_recipient_id AND is_deleted = false;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recipient profile not found.';
  END IF;

  SELECT display_name INTO v_caller_name
  FROM public.profiles
  WHERE user_id = v_caller_id;

  -- Check if a 1:1 conversation already exists between v_caller_id and p_recipient_id
  SELECT c.*
  INTO v_existing_conv
  FROM public.conversations c
  JOIN public.conversation_participants cp1
    ON cp1.conversation_id = c.id AND cp1.user_id = v_caller_id
  JOIN public.conversation_participants cp2
    ON cp2.conversation_id = c.id AND cp2.user_id = p_recipient_id
  WHERE c.is_group = false
  ORDER BY c.updated_at DESC
  LIMIT 1;

  IF FOUND THEN
    IF v_existing_conv.status = 'declined' THEN
      IF v_existing_conv.declined_at IS NOT NULL
         AND v_existing_conv.declined_at > timezone('utc'::text, now() - interval '24 hours') THEN
        RAISE EXCEPTION 'This message request was recently declined. Please respect recipient preferences.';
      END IF;
    END IF;

    v_conv_id := v_existing_conv.id;
    v_status := v_existing_conv.status;

    -- Unarchive for caller when explicitly opening conversation
    UPDATE public.conversation_participants
    SET is_archived = false
    WHERE conversation_id = v_conv_id AND user_id = v_caller_id;
  ELSE
    -- Check recipient messaging privacy settings
    IF v_recipient.allow_messages_from = 'none' THEN
      RAISE EXCEPTION 'This user does not accept new message requests.';
    END IF;

    SELECT EXISTS (
      SELECT 1 FROM public.follows
      WHERE follower_id = p_recipient_id AND following_id = v_caller_id
    ) INTO v_recipient_follows_caller;

    IF v_recipient.allow_messages_from = 'following' AND NOT v_recipient_follows_caller THEN
      RAISE EXCEPTION 'This user only accepts messages from people they follow.';
    END IF;

    -- If recipient already follows caller, open as accepted chat; otherwise create pending request
    v_status := CASE WHEN v_recipient_follows_caller THEN 'accepted' ELSE 'pending' END;

    INSERT INTO public.conversations (
      title,
      is_group,
      created_by,
      initiated_by,
      recipient_id,
      status,
      last_message_preview
    ) VALUES (
      COALESCE(v_caller_name, 'Member') || ' & ' || v_recipient.display_name,
      false,
      v_caller_id,
      v_caller_id,
      p_recipient_id,
      v_status,
      CASE
        WHEN p_intro_message IS NOT NULL AND char_length(trim(p_intro_message)) > 0
          THEN LEFT(trim(p_intro_message), 140)
        ELSE 'Message request'
      END
    ) RETURNING id INTO v_conv_id;

    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES
      (v_conv_id, v_caller_id),
      (v_conv_id, p_recipient_id)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;

    -- Notify recipient of the new message request
    INSERT INTO public.notifications (
      recipient_id,
      actor_id,
      type,
      title,
      message,
      link_url
    ) VALUES (
      p_recipient_id,
      v_caller_id,
      'message_request',
      CASE WHEN v_status = 'pending' THEN 'New Message Request' ELSE 'New Direct Message' END,
      COALESCE(v_caller_name, 'An EcoShare member') ||
        CASE
          WHEN v_status = 'pending' THEN ' sent you a message request.'
          ELSE ' started a conversation with you.'
        END,
      '/messages'
    );
  END IF;

  -- Optionally insert introductory message if provided
  v_trimmed_intro := trim(COALESCE(p_intro_message, ''));
  IF char_length(v_trimmed_intro) > 0 THEN
    IF v_status = 'pending' AND (
      SELECT count(*) FROM public.messages WHERE conversation_id = v_conv_id
    ) >= 3 THEN
      RAISE EXCEPTION 'Please wait for the recipient to accept your message request before sending more messages.';
    END IF;

    INSERT INTO public.messages (
      conversation_id,
      sender_id,
      content
    ) VALUES (
      v_conv_id,
      v_caller_id,
      LEFT(v_trimmed_intro, 2000)
    );
  END IF;

  RETURN jsonb_build_object(
    'conversation_id', v_conv_id,
    'status', v_status,
    'recipient_id', p_recipient_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.start_or_get_direct_conversation(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_or_get_direct_conversation(TEXT, TEXT) TO authenticated, service_role;

-- 9. RPC: Respond to Message Request (Accept, Decline, Block, Report)
CREATE OR REPLACE FUNCTION public.respond_to_message_request(
  p_conversation_id UUID,
  p_action TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id TEXT;
  v_caller_name TEXT;
  v_conv public.conversations%ROWTYPE;
  v_other_user_id TEXT;
BEGIN
  v_caller_id := (SELECT auth.jwt() ->> 'sub');
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  SELECT * INTO v_conv
  FROM public.conversations
  WHERE id = p_conversation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conversation not found.';
  END IF;

  IF NOT public.is_conversation_participant(p_conversation_id) THEN
    RAISE EXCEPTION 'Not authorized for this conversation.';
  END IF;

  SELECT user_id INTO v_other_user_id
  FROM public.conversation_participants
  WHERE conversation_id = p_conversation_id AND user_id <> v_caller_id
  LIMIT 1;

  SELECT display_name INTO v_caller_name
  FROM public.profiles
  WHERE user_id = v_caller_id;

  IF p_action = 'accept' THEN
    UPDATE public.conversations
    SET
      status = 'accepted',
      updated_at = timezone('utc'::text, now())
    WHERE id = p_conversation_id;

    IF v_other_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        recipient_id,
        actor_id,
        type,
        title,
        message,
        link_url
      ) VALUES (
        v_other_user_id,
        v_caller_id,
        'message_accepted',
        'Message Request Accepted',
        COALESCE(v_caller_name, 'An EcoShare member') || ' accepted your message request.',
        '/messages'
      );
    END IF;

    RETURN jsonb_build_object('conversation_id', p_conversation_id, 'status', 'accepted');

  ELSIF p_action = 'decline' THEN
    UPDATE public.conversations
    SET
      status = 'declined',
      declined_at = timezone('utc'::text, now()),
      updated_at = timezone('utc'::text, now())
    WHERE id = p_conversation_id;

    RETURN jsonb_build_object('conversation_id', p_conversation_id, 'status', 'declined');

  ELSIF p_action = 'block' THEN
    UPDATE public.conversations
    SET
      status = 'declined',
      declined_at = timezone('utc'::text, now()),
      updated_at = timezone('utc'::text, now())
    WHERE id = p_conversation_id;

    IF v_other_user_id IS NOT NULL AND v_other_user_id <> v_caller_id THEN
      INSERT INTO public.user_blocks (blocker_id, blocked_id)
      VALUES (v_caller_id, v_other_user_id)
      ON CONFLICT (blocker_id, blocked_id) DO NOTHING;
    END IF;

    RETURN jsonb_build_object('conversation_id', p_conversation_id, 'status', 'blocked');

  ELSIF p_action = 'report' THEN
    INSERT INTO public.message_reports (
      reporter_id,
      reported_user_id,
      conversation_id,
      reason
    ) VALUES (
      v_caller_id,
      v_other_user_id,
      p_conversation_id,
      COALESCE(NULLIF(trim(p_reason), ''), 'Reported via EcoShare message requests')
    );

    UPDATE public.conversations
    SET
      status = 'declined',
      declined_at = timezone('utc'::text, now()),
      updated_at = timezone('utc'::text, now())
    WHERE id = p_conversation_id;

    RETURN jsonb_build_object('conversation_id', p_conversation_id, 'status', 'reported');
  ELSE
    RAISE EXCEPTION 'Unsupported action: %', p_action;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.respond_to_message_request(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.respond_to_message_request(UUID, TEXT, TEXT) TO authenticated, service_role;
