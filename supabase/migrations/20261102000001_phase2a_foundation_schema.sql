-- EcoShare Phase 2A: Foundational Schema Migration
-- Document Version: 2.1
-- Status: Product Owner Approved
-- Description: Core authentication, profiles, user roles, processed webhook events, and audit foundations.

-- 1. App Role Enum
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('user', 'moderator', 'verifier', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Profiles Table (Clerk-synced user metadata & public profile)
CREATE TABLE IF NOT EXISTS public.profiles (
    user_id TEXT PRIMARY KEY, -- Clerk User ID (e.g. user_2...)
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    location TEXT,
    website TEXT,
    total_xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_profiles_bio_length CHECK (bio IS NULL OR char_length(bio) <= 500),
    CONSTRAINT chk_profiles_location_length CHECK (location IS NULL OR char_length(location) <= 100),
    CONSTRAINT chk_profiles_website_length CHECK (website IS NULL OR char_length(website) <= 255),
    CONSTRAINT chk_profiles_total_xp_positive CHECK (total_xp >= 0),
    CONSTRAINT chk_profiles_level_range CHECK (level >= 1 AND level <= 6),
    CONSTRAINT chk_profiles_username_format CHECK (username ~* '^[a-zA-Z0-9_-]{3,30}$')
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_total_xp ON public.profiles(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_is_deleted ON public.profiles(is_deleted);

-- 3. User Roles Table (Granular administrative, verifier, and moderation privileges)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    role public.app_role NOT NULL DEFAULT 'user',
    granted_by TEXT REFERENCES public.profiles(user_id) ON DELETE SET NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_roles_user_role UNIQUE (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- 4. Processed Webhook Events Table (Svix webhook replay protection & idempotency)
CREATE TABLE IF NOT EXISTS public.processed_webhook_events (
    event_id TEXT PRIMARY KEY, -- Svix event ID (e.g. evt_2...)
    event_type TEXT NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_at ON public.processed_webhook_events(processed_at DESC);

-- 5. Verification Audit Log Foundation Table (Permanent audit trail)
-- verifier_id uses ON DELETE SET NULL to preserve immutable audit trail even if account is deleted
CREATE TABLE IF NOT EXISTS public.verification_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID, -- References future impact_submissions table
    verifier_id TEXT REFERENCES public.profiles(user_id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- e.g. 'submitted', 'approved', 'rejected', 'escalated'
    xp_awarded INTEGER NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_audit_xp_non_negative CHECK (xp_awarded >= 0)
);

CREATE INDEX IF NOT EXISTS idx_audit_log_verifier ON public.verification_audit_log(verifier_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.verification_audit_log(created_at DESC);

-- 6. Helper Functions for Authentication, Roles, and Levels

-- Helper: Retrieve current caller's Clerk user ID from JWT sub claim
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT (auth.jwt()->>'sub');
$$;

-- Helper: Check if caller possesses a specific role
CREATE OR REPLACE FUNCTION public.has_role(p_role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = (auth.jwt()->>'sub')
      AND role = p_role
  );
$$;

-- Helper: Check if caller is an administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT public.has_role('admin'::public.app_role);
$$;

-- Helper: Check if caller is a verifier or administrator
CREATE OR REPLACE FUNCTION public.is_verifier_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = (auth.jwt()->>'sub')
      AND role IN ('verifier'::public.app_role, 'admin'::public.app_role)
  );
$$;

-- Helper: Calculate user level based on approved EcoShare 6-Tier XP Thresholds
-- Level 1 — Eco Starter: 0 XP
-- Level 2 — Good Collector: 50 XP
-- Level 3 — Eco Guardian: 150 XP
-- Level 4 — Planet Protector: 350 XP
-- Level 5 — Earth Champion: 700 XP
-- Level 6 — Planet Legend: 1500 XP
CREATE OR REPLACE FUNCTION public.calculate_user_level(p_xp INTEGER)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_xp >= 1500 THEN 6
    WHEN p_xp >= 700  THEN 5
    WHEN p_xp >= 350  THEN 4
    WHEN p_xp >= 150  THEN 3
    WHEN p_xp >= 50   THEN 2
    ELSE 1
  END;
$$;
