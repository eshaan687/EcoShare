-- EcoShare Milestone 2: Complete Social Graph, Comments/Replies, Bookmarks, Notifications, XP Ledger & Badges
-- Description: Adds follows, notifications, points_ledger, badges, user_badges, profile cover_url, comment replies, and automated notification/badge triggers.

-- 1. Extend impact_submission_status enum with full PRD statuses
ALTER TYPE public.impact_submission_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE public.impact_submission_status ADD VALUE IF NOT EXISTS 'changes_requested';
ALTER TYPE public.impact_submission_status ADD VALUE IF NOT EXISTS 'appealed';

-- 2. Add cover_url to profiles for cover photo customization
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cover_url TEXT DEFAULT '/images/hero-mountains.png';

-- Allow authenticated users to insert their own profile row if not yet created by webhook
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK ((select auth.jwt() ->> 'sub') = user_id);

-- 3. Follows Table (Social Graph)
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id TEXT NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  following_id TEXT NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_follows_no_self_follow CHECK (follower_id <> following_id),
  CONSTRAINT uq_follows_pair UNIQUE (follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Follows are readable by everyone" ON public.follows;
CREATE POLICY "Follows are readable by everyone"
ON public.follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can follow others" ON public.follows;
CREATE POLICY "Authenticated users can follow others"
ON public.follows FOR INSERT TO authenticated
WITH CHECK (
  (select auth.jwt() ->> 'sub') = follower_id
  AND follower_id <> following_id
);

DROP POLICY IF EXISTS "Authenticated users can unfollow" ON public.follows;
CREATE POLICY "Authenticated users can unfollow"
ON public.follows FOR DELETE TO authenticated
USING ((select auth.jwt() ->> 'sub') = follower_id);

-- Seed initial follow relationships for demonstration
INSERT INTO public.follows (follower_id, following_id)
VALUES
  ('user_alex_r', 'user_sofia_m'),
  ('user_alex_r', 'user_marcus_v'),
  ('user_alex_r', 'user_maya_s'),
  ('user_sofia_m', 'user_alex_r'),
  ('user_marcus_v', 'user_alex_r')
ON CONFLICT (follower_id, following_id) DO NOTHING;

-- 4. Add parent_comment_id to post_comments for threaded replies
ALTER TABLE public.post_comments
  ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON public.post_comments(parent_comment_id);

-- Seed initial realistic comments on Sofia's & Marcus's posts
INSERT INTO public.post_comments (id, post_id, author_id, content, created_at)
VALUES
  (
    '66666666-6666-4666-8666-666666666601',
    '11111111-1111-4111-8111-111111111101',
    'user_marcus_v',
    'Awesome work at Fundidora Park Sofia! Separating recyclables on-site makes a huge difference.',
    timezone('utc'::text, now() - interval '90 minutes')
  ),
  (
    '66666666-6666-4666-8666-666666666602',
    '11111111-1111-4111-8111-111111111102',
    'user_maya_s',
    'Native Oregon white oaks are incredible keystone trees for local pollinators and birds!',
    timezone('utc'::text, now() - interval '3 hours')
  )
ON CONFLICT (id) DO NOTHING;

-- 5. Extend impact_submissions with country and activity_date
ALTER TABLE public.impact_submissions
  ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'Global',
  ADD COLUMN IF NOT EXISTS activity_date DATE NOT NULL DEFAULT CURRENT_DATE;

-- Allow submitters to update their own draft/changes_requested/rejected (to appeal) submissions
DROP POLICY IF EXISTS "Users can update their own non-approved impact submissions" ON public.impact_submissions;
CREATE POLICY "Users can update their own non-approved impact submissions"
ON public.impact_submissions
FOR UPDATE
TO authenticated
USING (
  (select auth.jwt() ->> 'sub') = user_id
  AND status::text IN ('draft', 'changes_requested', 'rejected')
)
WITH CHECK (
  (select auth.jwt() ->> 'sub') = user_id
  AND status::text IN ('draft', 'submitted', 'pending', 'appealed')
);

-- 6. Points Ledger Table (Immutable XP Transaction Ledger with Unique Submission Constraint)
CREATE TABLE IF NOT EXISTS public.points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  submission_id UUID UNIQUE REFERENCES public.impact_submissions(id) ON DELETE SET NULL,
  points_delta INTEGER NOT NULL CHECK (points_delta > 0),
  reason TEXT NOT NULL,
  awarded_by TEXT REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_points_ledger_user ON public.points_ledger(user_id, created_at DESC);

ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Points ledger is readable by everyone for reputation transparency" ON public.points_ledger;
CREATE POLICY "Points ledger is readable by everyone for reputation transparency"
ON public.points_ledger FOR SELECT USING (true);

-- 7. Badges & User Badges Tables
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'leaf',
  accent_ring TEXT NOT NULL DEFAULT 'green',
  xp_threshold INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (user_id, badge_id)
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Badges are readable by everyone" ON public.badges;
CREATE POLICY "Badges are readable by everyone"
ON public.badges FOR SELECT USING (true);

DROP POLICY IF EXISTS "User badges are readable by everyone" ON public.user_badges;
CREATE POLICY "User badges are readable by everyone"
ON public.user_badges FOR SELECT USING (true);

INSERT INTO public.badges (id, slug, name, description, icon_name, accent_ring, xp_threshold)
VALUES
  (
    '77777777-7777-4777-8777-777777777701',
    'first-action',
    'First Action',
    'Completed and verified your first environmental contribution.',
    'leaf',
    'green',
    50
  ),
  (
    '77777777-7777-4777-8777-777777777702',
    'good-collector',
    'Good Collector',
    'Verified community litter or recycling cleanup submissions.',
    'recycle',
    'gold',
    150
  ),
  (
    '77777777-7777-4777-8777-777777777703',
    'community-helper',
    'Community Helper',
    'Collaborated in verified group environmental initiatives.',
    'users',
    'green',
    300
  ),
  (
    '77777777-7777-4777-8777-777777777704',
    'eco-contributor',
    'Eco Contributor',
    'Sustained verified environmental participation across multiple categories.',
    'award',
    'gold',
    400
  )
ON CONFLICT (slug) DO NOTHING;

-- 8. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id TEXT NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  actor_id TEXT REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'reply', 'follow', 'impact_submitted', 'impact_approved', 'impact_rejected', 'changes_requested', 'badge_awarded')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link_url TEXT NOT NULL DEFAULT '/home',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id, is_read, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING ((select auth.jwt() ->> 'sub') = recipient_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING ((select auth.jwt() ->> 'sub') = recipient_id)
WITH CHECK ((select auth.jwt() ->> 'sub') = recipient_id);

DROP POLICY IF EXISTS "Authenticated users can trigger notifications" ON public.notifications;
CREATE POLICY "Authenticated users can trigger notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK ((select auth.jwt() ->> 'sub') = actor_id OR (select auth.jwt() ->> 'sub') = recipient_id);

-- 9. Automatic Notification Triggers for Likes, Comments, Follows & Impact Submissions

-- Trigger on Post Like
CREATE OR REPLACE FUNCTION public.notify_on_post_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_post_author TEXT;
  v_actor_name TEXT;
BEGIN
  SELECT author_id INTO v_post_author FROM public.posts WHERE id = NEW.post_id;
  IF v_post_author IS NOT NULL AND v_post_author <> NEW.user_id THEN
    SELECT display_name INTO v_actor_name FROM public.profiles WHERE user_id = NEW.user_id;
    INSERT INTO public.notifications (recipient_id, actor_id, type, title, message, link_url)
    VALUES (
      v_post_author,
      NEW.user_id,
      'like',
      'New Post Like',
      COALESCE(v_actor_name, 'An EcoShare member') || ' liked your environmental post.',
      '/home'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_post_like ON public.post_likes;
CREATE TRIGGER trg_notify_on_post_like
AFTER INSERT ON public.post_likes
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_post_like();

-- Trigger on Post Comment / Reply
CREATE OR REPLACE FUNCTION public.notify_on_post_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_post_author TEXT;
  v_actor_name TEXT;
BEGIN
  SELECT author_id INTO v_post_author FROM public.posts WHERE id = NEW.post_id;
  SELECT display_name INTO v_actor_name FROM public.profiles WHERE user_id = NEW.author_id;

  IF v_post_author IS NOT NULL AND v_post_author <> NEW.author_id THEN
    INSERT INTO public.notifications (recipient_id, actor_id, type, title, message, link_url)
    VALUES (
      v_post_author,
      NEW.author_id,
      CASE WHEN NEW.parent_comment_id IS NOT NULL THEN 'reply' ELSE 'comment' END,
      CASE WHEN NEW.parent_comment_id IS NOT NULL THEN 'New Comment Reply' ELSE 'New Comment on Your Post' END,
      COALESCE(v_actor_name, 'An EcoShare member') || ': "' || LEFT(NEW.content, 80) || '"',
      '/home'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_post_comment ON public.post_comments;
CREATE TRIGGER trg_notify_on_post_comment
AFTER INSERT ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_post_comment();

-- Trigger on Follow
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor_name TEXT;
  v_actor_username TEXT;
BEGIN
  SELECT display_name, username INTO v_actor_name, v_actor_username
  FROM public.profiles
  WHERE user_id = NEW.follower_id;

  INSERT INTO public.notifications (recipient_id, actor_id, type, title, message, link_url)
  VALUES (
    NEW.following_id,
    NEW.follower_id,
    'follow',
    'New Follower',
    COALESCE(v_actor_name, 'An EcoShare member') || ' started following your environmental journey.',
    '/u/' || COALESCE(v_actor_username, 'alexr')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_follow ON public.follows;
CREATE TRIGGER trg_notify_on_follow
AFTER INSERT ON public.follows
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_follow();

-- Trigger on Impact Submission Created
CREATE OR REPLACE FUNCTION public.notify_on_impact_submitted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.notifications (recipient_id, actor_id, type, title, message, link_url)
  VALUES (
    NEW.user_id,
    NEW.user_id,
    'impact_submitted',
    'Impact Evidence Received',
    'Your submission "' || NEW.title || '" is now in the Verification Queue for review.',
    '/impact'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_impact_submitted ON public.impact_submissions;
CREATE TRIGGER trg_notify_on_impact_submitted
AFTER INSERT ON public.impact_submissions
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_impact_submitted();

-- 10. Upgrade review_impact_submission RPC to record points_ledger, award eligible badges, and send notifications
CREATE OR REPLACE FUNCTION public.review_impact_submission(
  p_submission_id UUID,
  p_decision TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id TEXT;
  v_submission public.impact_submissions%ROWTYPE;
  v_new_status public.impact_submission_status;
  v_xp_delta INTEGER := 0;
  v_new_total_xp INTEGER := 0;
  v_new_level INTEGER := 1;
  v_post_id UUID;
BEGIN
  v_caller_id := (SELECT auth.jwt() ->> 'sub');
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to review impact submissions';
  END IF;

  SELECT *
  INTO v_submission
  FROM public.impact_submissions
  WHERE id = p_submission_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Impact submission not found';
  END IF;

  -- Idempotency / Anti-Duplicate XP check via status and points_ledger
  IF v_submission.status = 'approved' OR EXISTS (
    SELECT 1 FROM public.points_ledger WHERE submission_id = p_submission_id
  ) THEN
    IF p_decision = 'approved' THEN
      SELECT total_xp, level INTO v_new_total_xp, v_new_level
      FROM public.profiles
      WHERE user_id = v_submission.user_id;

      RETURN jsonb_build_object(
        'submission_id', v_submission.id,
        'status', 'approved',
        'xp_awarded', 0,
        'total_xp', COALESCE(v_new_total_xp, 0),
        'level', COALESCE(v_new_level, 1)
      );
    END IF;
  END IF;

  IF p_decision = 'approved' THEN
    v_new_status := 'approved';
    v_xp_delta := v_submission.reward_xp;
  ELSIF p_decision = 'rejected' THEN
    v_new_status := 'rejected';
    v_xp_delta := 0;
  ELSIF p_decision = 'changes_requested' THEN
    v_new_status := 'changes_requested';
    v_xp_delta := 0;
  ELSE
    RAISE EXCEPTION 'Invalid decision: must be approved, rejected, or changes_requested';
  END IF;

  -- 1) Update impact submission state
  UPDATE public.impact_submissions
  SET
    status = v_new_status,
    reviewed_by = v_caller_id,
    reviewer_notes = COALESCE(p_notes, reviewer_notes),
    reviewed_at = timezone('utc'::text, now()),
    updated_at = timezone('utc'::text, now())
  WHERE id = p_submission_id;

  -- 2) If approved, record in points_ledger, award XP & recalculate level, and award eligible badges
  IF v_new_status = 'approved' THEN
    INSERT INTO public.points_ledger (
      user_id,
      submission_id,
      points_delta,
      reason,
      awarded_by
    ) VALUES (
      v_submission.user_id,
      v_submission.id,
      v_xp_delta,
      'Verified Environmental Impact: ' || v_submission.title,
      v_caller_id
    ) ON CONFLICT (submission_id) DO NOTHING;

    PERFORM set_config('app.allow_xp_award', 'true', true);

    UPDATE public.profiles
    SET
      total_xp = total_xp + v_xp_delta,
      level = public.calculate_user_level(total_xp + v_xp_delta),
      updated_at = timezone('utc'::text, now())
    WHERE user_id = v_submission.user_id
    RETURNING total_xp, level INTO v_new_total_xp, v_new_level;

    -- Award any newly eligible badges based on updated total_xp
    INSERT INTO public.user_badges (user_id, badge_id)
    SELECT v_submission.user_id, b.id
    FROM public.badges b
    WHERE b.xp_threshold <= COALESCE(v_new_total_xp, 0)
    ON CONFLICT (user_id, badge_id) DO NOTHING;

    -- Publish a Verified Impact post to the community feed
    INSERT INTO public.posts (
      author_id,
      content,
      category,
      location,
      is_verified_impact
    ) VALUES (
      v_submission.user_id,
      '✅ Verified Environmental Impact (' || v_submission.title || '): ' || v_submission.description,
      v_submission.category,
      v_submission.location,
      true
    ) RETURNING id INTO v_post_id;

    IF v_post_id IS NOT NULL AND v_submission.evidence_url IS NOT NULL THEN
      INSERT INTO public.post_media (
        post_id,
        media_type,
        url,
        alt_text,
        has_verified_badge
      ) VALUES (
        v_post_id,
        'image',
        v_submission.evidence_url,
        v_submission.title,
        true
      );
    END IF;

    -- Notify submitter of approval & XP reward
    INSERT INTO public.notifications (recipient_id, actor_id, type, title, message, link_url)
    VALUES (
      v_submission.user_id,
      v_caller_id,
      'impact_approved',
      'Impact Verified! +' || v_xp_delta || ' XP Awarded',
      'Your submission "' || v_submission.title || '" was verified and awarded +' || v_xp_delta || ' Environmental XP.',
      '/impact'
    );
  ELSE
    SELECT total_xp, level INTO v_new_total_xp, v_new_level
    FROM public.profiles
    WHERE user_id = v_submission.user_id;

    INSERT INTO public.notifications (recipient_id, actor_id, type, title, message, link_url)
    VALUES (
      v_submission.user_id,
      v_caller_id,
      CASE WHEN v_new_status = 'changes_requested' THEN 'changes_requested' ELSE 'impact_rejected' END,
      CASE WHEN v_new_status = 'changes_requested' THEN 'Changes Requested on Submission' ELSE 'Impact Submission Needs Revision' END,
      'Update on "' || v_submission.title || '": ' || COALESCE(p_notes, 'Please review verifier notes and provide clearer evidence.'),
      '/impact'
    );
  END IF;

  -- 3) Append immutable record to verification_audit_log
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = v_caller_id) THEN
    INSERT INTO public.verification_audit_log (
      submission_id,
      verifier_id,
      action,
      xp_awarded,
      metadata
    ) VALUES (
      v_submission.id,
      v_caller_id,
      p_decision,
      v_xp_delta,
      jsonb_build_object(
        'title', v_submission.title,
        'category', v_submission.category,
        'notes', COALESCE(p_notes, 'Reviewed via EcoShare Impact Verifier Queue')
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'submission_id', v_submission.id,
    'status', v_new_status,
    'xp_awarded', v_xp_delta,
    'total_xp', COALESCE(v_new_total_xp, 0),
    'level', COALESCE(v_new_level, 1)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.review_impact_submission(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_impact_submission(UUID, TEXT, TEXT) TO authenticated, service_role;

-- 11. Enable Realtime on follows, notifications, points_ledger, and user_badges
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'follows'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'points_ledger'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.points_ledger;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'user_badges'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_badges;
  END IF;
END
$$;
