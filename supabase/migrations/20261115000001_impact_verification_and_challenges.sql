-- EcoShare Phase 2B / Milestone 4: Real-Time Impact Evidence, Verification Queue, XP Awarding & Challenges
-- Description: Adds impact_submission_status enum, impact_submissions, challenges, challenge_participants, and atomic verification/XP RPC.

-- 0. Impact Submission Status Enum
DO $$ BEGIN
    CREATE TYPE public.impact_submission_status AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Ensure protect_profile_xp_and_level allows trusted SECURITY DEFINER functions (via app.allow_xp_award = 'true')
-- while blocking direct client-side XP manipulation from authenticated/anon roles.
CREATE OR REPLACE FUNCTION public.protect_profile_xp_and_level()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_setting('app.allow_xp_award', true) IS DISTINCT FROM 'true'
     AND current_user != 'service_role'
     AND NOT public.is_admin() THEN
    NEW.total_xp := OLD.total_xp;
    NEW.level := OLD.level;
    NEW.is_deleted := OLD.is_deleted;
  END IF;
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- 2. Challenges Table
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL CHECK (char_length(trim(title)) >= 3 AND char_length(title) <= 140),
  description TEXT NOT NULL CHECK (char_length(trim(description)) >= 10 AND char_length(description) <= 1000),
  category TEXT NOT NULL DEFAULT 'Community Cleanup',
  thumbnail_url TEXT NOT NULL DEFAULT '/images/challenge-oceans.png',
  participants_count INTEGER NOT NULL DEFAULT 1 CHECK (participants_count >= 0),
  reward_xp INTEGER NOT NULL DEFAULT 75 CHECK (reward_xp >= 10 AND reward_xp <= 500),
  duration_label TEXT NOT NULL DEFAULT '14 days remaining',
  created_by TEXT REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_challenges_category ON public.challenges(category);
CREATE INDEX IF NOT EXISTS idx_challenges_created_at ON public.challenges(created_at DESC);

-- 3. Challenge Participants Table
CREATE TABLE IF NOT EXISTS public.challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (challenge_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON public.challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON public.challenge_participants(user_id);

-- Trigger to keep challenges.participants_count synchronized
CREATE OR REPLACE FUNCTION public.sync_challenge_participants_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.challenges
    SET participants_count = participants_count + 1
    WHERE id = NEW.challenge_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.challenges
    SET participants_count = GREATEST(0, participants_count - 1)
    WHERE id = OLD.challenge_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_challenge_participants_count() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_sync_challenge_participants_count ON public.challenge_participants;
CREATE TRIGGER trg_sync_challenge_participants_count
AFTER INSERT OR DELETE ON public.challenge_participants
FOR EACH ROW
EXECUTE FUNCTION public.sync_challenge_participants_count();

-- 4. Impact Submissions Table
CREATE TABLE IF NOT EXISTS public.impact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (char_length(trim(title)) >= 3 AND char_length(title) <= 160),
  description TEXT NOT NULL CHECK (char_length(trim(description)) >= 5 AND char_length(description) <= 2000),
  category TEXT NOT NULL DEFAULT 'Community Cleanup',
  location TEXT,
  evidence_url TEXT NOT NULL DEFAULT '/images/cleanup-park.png',
  status public.impact_submission_status NOT NULL DEFAULT 'submitted',
  reward_xp INTEGER NOT NULL DEFAULT 75 CHECK (reward_xp >= 10 AND reward_xp <= 500),
  reviewed_by TEXT REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  reviewer_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_impact_submissions_status ON public.impact_submissions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_impact_submissions_user ON public.impact_submissions(user_id, created_at DESC);

-- 5. Enable RLS
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_submissions ENABLE ROW LEVEL SECURITY;

-- Challenges Policies
DROP POLICY IF EXISTS "Challenges are readable by everyone" ON public.challenges;
CREATE POLICY "Challenges are readable by everyone"
ON public.challenges
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Authenticated users can create challenges" ON public.challenges;
CREATE POLICY "Authenticated users can create challenges"
ON public.challenges
FOR INSERT
TO authenticated
WITH CHECK ((select auth.jwt() ->> 'sub') = created_by);

-- Challenge Participants Policies
DROP POLICY IF EXISTS "Challenge participants are readable by everyone" ON public.challenge_participants;
CREATE POLICY "Challenge participants are readable by everyone"
ON public.challenge_participants
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Authenticated users can join challenges" ON public.challenge_participants;
CREATE POLICY "Authenticated users can join challenges"
ON public.challenge_participants
FOR INSERT
TO authenticated
WITH CHECK ((select auth.jwt() ->> 'sub') = user_id);

DROP POLICY IF EXISTS "Authenticated users can leave challenges" ON public.challenge_participants;
CREATE POLICY "Authenticated users can leave challenges"
ON public.challenge_participants
FOR DELETE
TO authenticated
USING ((select auth.jwt() ->> 'sub') = user_id);

-- Impact Submissions Policies
DROP POLICY IF EXISTS "Impact submissions are readable for transparency and review" ON public.impact_submissions;
CREATE POLICY "Impact submissions are readable for transparency and review"
ON public.impact_submissions
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Authenticated users can submit their own impact evidence" ON public.impact_submissions;
CREATE POLICY "Authenticated users can submit their own impact evidence"
ON public.impact_submissions
FOR INSERT
TO authenticated
WITH CHECK (
  (select auth.jwt() ->> 'sub') = user_id
  AND status IN ('draft', 'submitted', 'under_review')
);

-- 6. Atomic Verification & XP Award RPC Function
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

  -- Prevent duplicate XP awards if already approved
  IF v_submission.status = 'approved' AND p_decision = 'approved' THEN
    SELECT total_xp, level INTO v_new_total_xp, v_new_level
    FROM public.profiles
    WHERE user_id = v_submission.user_id;

    RETURN jsonb_build_object(
      'submission_id', v_submission.id,
      'status', v_submission.status,
      'xp_awarded', 0,
      'total_xp', COALESCE(v_new_total_xp, 0),
      'level', COALESCE(v_new_level, 1)
    );
  END IF;

  IF p_decision = 'approved' THEN
    v_new_status := 'approved';
    v_xp_delta := v_submission.reward_xp;
  ELSIF p_decision = 'rejected' THEN
    v_new_status := 'rejected';
    v_xp_delta := 0;
  ELSE
    RAISE EXCEPTION 'Invalid decision: must be approved or rejected';
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

  -- 2) If approved, award XP & recalculate level atomically
  IF v_new_status = 'approved' THEN
    PERFORM set_config('app.allow_xp_award', 'true', true);

    UPDATE public.profiles
    SET
      total_xp = total_xp + v_xp_delta,
      level = public.calculate_user_level(total_xp + v_xp_delta),
      updated_at = timezone('utc'::text, now())
    WHERE user_id = v_submission.user_id
    RETURNING total_xp, level INTO v_new_total_xp, v_new_level;

    -- Also publish a Verified Impact post to the community feed so everyone sees the verified action
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
  ELSE
    SELECT total_xp, level INTO v_new_total_xp, v_new_level
    FROM public.profiles
    WHERE user_id = v_submission.user_id;
  END IF;

  -- 3) Append immutable record to verification_audit_log (if reviewer has a profile)
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

-- 7. Seed Initial Challenges
INSERT INTO public.challenges (
  id, slug, title, description, category, thumbnail_url, participants_count, reward_xp, duration_label, created_by
) VALUES
  (
    '44444444-4444-4444-8444-444444444401',
    'clean-oceans-challenge',
    'Clean Oceans Challenge',
    'Collect and properly dispose of coastal or waterway litter in your area and upload photo evidence.',
    'Ocean Conservation',
    '/images/challenge-oceans.png',
    12430,
    75,
    '14 days remaining',
    'user_david_l'
  ),
  (
    '44444444-4444-4444-8444-444444444402',
    'plant-for-tomorrow',
    'Plant for Tomorrow',
    'Plant native trees, saplings, or pollinator flora and document the planting site for verification.',
    'Tree Planting',
    '/images/challenge-trees.png',
    8920,
    100,
    '21 days remaining',
    'user_marcus_v'
  ),
  (
    '44444444-4444-4444-8444-444444444403',
    'zero-waste-week',
    '7-Day Plastic Reduction Challenge',
    'Eliminate single-use plastics for a full week, sort community recyclables, and document your impact.',
    'Recycling Initiatives',
    '/images/cleanup-park.png',
    5340,
    50,
    '7 days remaining',
    'user_sofia_m'
  )
ON CONFLICT (slug) DO NOTHING;

-- 8. Seed Initial Impact Submissions for the Live Verifier Queue
INSERT INTO public.impact_submissions (
  id, user_id, challenge_id, title, description, category, location, evidence_url, status, reward_xp, created_at
) VALUES
  (
    '55555555-5555-4555-8555-555555555501',
    'user_sofia_m',
    '44444444-4444-4444-8444-444444444403',
    'Fundidora Park Litter & Plastic Cleanup',
    'Collected 4 full bags of recyclable plastic bottles and aluminum cans along the main park trail with classmates.',
    'Community Cleanup',
    'Fundidora Park, Monterrey, Mexico',
    '/images/cleanup-park.png',
    'submitted',
    75,
    timezone('utc'::text, now() - interval '2 hours')
  ),
  (
    '55555555-5555-4555-8555-555555555502',
    'user_marcus_v',
    '44444444-4444-4444-8444-444444444402',
    'Willamette River Native Oak Sapling Planting',
    'Planted 18 native Oregon white oak saplings along the riparian buffer zone with protective mulch rings.',
    'Tree Planting',
    'Portland, United States',
    '/images/challenge-trees.png',
    'submitted',
    100,
    timezone('utc'::text, now() - interval '4 hours')
  ),
  (
    '55555555-5555-4555-8555-555555555503',
    'user_maya_s',
    NULL,
    'Urban Pollinator Micro-Meadow Installation',
    'Seeded 40 sq meters of native clover and lavender to support urban bumblebees and documented initial bloom.',
    'Wildlife Conservation',
    'Vancouver, Canada',
    '/images/wildlife-pollinator.png',
    'approved',
    75,
    timezone('utc'::text, now() - interval '1 day')
  )
ON CONFLICT (id) DO NOTHING;

-- 9. Enable Supabase Realtime on challenges, challenge_participants, impact_submissions, and profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'challenges'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.challenges;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'challenge_participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_participants;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'impact_submissions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.impact_submissions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END
$$;
