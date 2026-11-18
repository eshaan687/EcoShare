-- EcoShare Phase 2A: Row Level Security Policies Migration
-- Document Version: 2.1
-- Status: Product Owner Approved
-- Description: Enforces Row-Level Security on all foundational tables using Clerk JWT claims.

-- 1. Enable RLS on all foundational tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_audit_log ENABLE ROW LEVEL SECURITY;

-- 2. Profiles Table RLS Policies
-- Readable by public and guests (supports guest preview feed and user discovery)
CREATE POLICY "Profiles are readable by everyone"
ON public.profiles
FOR SELECT
USING (true);

-- Authenticated users can only update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING ((select auth.jwt() ->> 'sub') = user_id)
WITH CHECK ((select auth.jwt() ->> 'sub') = user_id);

-- Admins can insert or delete profiles
CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (public.is_admin());

-- Profile Integrity Trigger: Prevents users from manually altering total_xp, level, or is_deleted
CREATE OR REPLACE FUNCTION public.protect_profile_xp_and_level()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- If caller is not admin or service role, preserve existing total_xp and level
  IF current_user != 'service_role' AND NOT public.is_admin() THEN
    NEW.total_xp := OLD.total_xp;
    NEW.level := OLD.level;
    NEW.is_deleted := OLD.is_deleted;
  END IF;
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_xp_and_level ON public.profiles;
CREATE TRIGGER trg_protect_profile_xp_and_level
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_xp_and_level();

-- 3. User Roles Table RLS Policies
-- Users can view their own roles; admins can view all roles
CREATE POLICY "Users can view their own roles or admins can view all"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  (select auth.jwt() ->> 'sub') = user_id OR
  public.is_admin()
);

-- ONLY administrators can insert, update, or delete roles.
-- Standard users CANNOT grant themselves or others any role!
CREATE POLICY "Only admins can insert user roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update user roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can delete user roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.is_admin());

-- 4. Processed Webhook Events Table RLS Policies
-- Audit inspection restricted to administrators
CREATE POLICY "Admins can view processed webhook events"
ON public.processed_webhook_events
FOR SELECT
TO authenticated
USING (public.is_admin());

-- 5. Verification Audit Log Table RLS Policies
-- Only verifiers and administrators can view verification logs
CREATE POLICY "Verifiers and admins can view audit logs"
ON public.verification_audit_log
FOR SELECT
TO authenticated
USING (public.is_verifier_or_admin());

-- Only verifiers and administrators can insert verification logs
CREATE POLICY "Verifiers and admins can insert audit logs"
ON public.verification_audit_log
FOR INSERT
TO authenticated
WITH CHECK (public.is_verifier_or_admin());

-- Notice: No UPDATE or DELETE policy exists for verification_audit_log,
-- ensuring the audit log is strictly append-only and immutable.
