# EcoShare — Phase 2 Security, Permissions & RLS Specification

**Project:** EcoShare  
**Document Version:** 2.0  
**Status:** Approved Security Specification  
**Authority:** Product Owner Approved  
**Date:** November 2026  

---

## 1. Zero-Trust Security Philosophy

EcoShare enforces a zero-trust model:
1. **The browser is inherently untrusted:** Client state, claims, or payload flags are never trusted for authorization, XP, or roles.
2. **PostgreSQL RLS is the supreme boundary:** Even if an API route bug occurs, the database itself refuses unauthorized reads and writes.
3. **Clerk Token Identity Evaluation:** All client and server PostgREST calls authenticate with Clerk JWTs. The authenticated user ID is verified directly via:
   ```sql
   (auth.jwt()->>'sub')
   ```
4. **Separation of Privileges:** Standard users can never inspect private evidence belonging to other users or award XP to anyone (including themselves).

---

## 2. PostgreSQL Role-Based Access Control & Helper Functions

Role definitions are stored securely in `public.user_roles`. Users cannot read or modify `public.user_roles` directly.

### 2.1 Security Helper Functions
These helper functions run with `SECURITY DEFINER` and `STABLE` attributes to ensure high performance and prevent privilege escalation.

```sql
-- Helper: Retrieve current caller's Clerk user ID
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
```

---

## 3. Comprehensive Row-Level Security (RLS) Policy Matrix

RLS is enabled on **every table** in the `public` schema.

```sql
-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;
```

### 3.1 Table RLS Policies

#### 1. Profiles (`public.profiles`)
- **SELECT:** Public for all users (guests and authenticated).
- **INSERT:** Restricted to service-role (Clerk webhook synchronization).
- **UPDATE:** Only the profile owner `(auth.jwt()->>'sub') = user_id` OR `is_admin()`. Users cannot update `total_xp` or `level` (enforced via database triggers/RPC).
- **DELETE:** Owner or `is_admin()`.

```sql
CREATE POLICY "Profiles are readable by everyone"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING ((auth.jwt()->>'sub') = user_id)
WITH CHECK ((auth.jwt()->>'sub') = user_id);
```

#### 2. User Roles (`public.user_roles`)
- **SELECT:** Only the user themselves OR `is_admin()`.
- **INSERT / UPDATE / DELETE:** Strictly `is_admin()`.

```sql
CREATE POLICY "Users can view their own roles or admins can view all"
ON public.user_roles FOR SELECT
TO authenticated
USING ((auth.jwt()->>'sub') = user_id OR public.is_admin());

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
```

#### 3. Posts & Media (`public.posts`, `public.post_media`)
- **SELECT:** Readable by everyone if community is public or post is not community-restricted. If in private community, user must be a member.
- **INSERT:** Authenticated users where `author_id = (auth.jwt()->>'sub')`.
- **UPDATE:** Only author or `is_admin()`.
- **DELETE:** Only author or `is_admin()`.

```sql
CREATE POLICY "Public posts are viewable by everyone"
ON public.posts FOR SELECT
USING (
  community_id IS NULL OR 
  EXISTS (
    SELECT 1 FROM public.communities c 
    WHERE c.id = posts.community_id AND c.is_private = false
  ) OR 
  EXISTS (
    SELECT 1 FROM public.community_members cm 
    WHERE cm.community_id = posts.community_id AND cm.user_id = (auth.jwt()->>'sub')
  )
);

CREATE POLICY "Authenticated users can create posts"
ON public.posts FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt()->>'sub') = author_id);

CREATE POLICY "Authors and admins can update posts"
ON public.posts FOR UPDATE
TO authenticated
USING ((auth.jwt()->>'sub') = author_id OR public.is_admin())
WITH CHECK ((auth.jwt()->>'sub') = author_id OR public.is_admin());

CREATE POLICY "Authors and admins can delete posts"
ON public.posts FOR DELETE
TO authenticated
USING ((auth.jwt()->>'sub') = author_id OR public.is_admin());
```

#### 4. Post Interactions (`post_likes`, `post_comments`, `post_bookmarks`)
- **SELECT:** Public.
- **INSERT:** Authenticated users where `user_id = (auth.jwt()->>'sub')`.
- **DELETE:** Owner of interaction or admin.

```sql
CREATE POLICY "Likes are viewable by everyone"
ON public.post_likes FOR SELECT USING (true);

CREATE POLICY "Users can manage their own likes"
ON public.post_likes FOR INSERT TO authenticated
WITH CHECK ((auth.jwt()->>'sub') = user_id);

CREATE POLICY "Users can delete their own likes"
ON public.post_likes FOR DELETE TO authenticated
USING ((auth.jwt()->>'sub') = user_id);
```

#### 5. Impact Submissions (`public.impact_submissions`)
- **SELECT:** Submitter can view their own submissions; Verifiers and Admins can view all submissions.
- **INSERT:** Authenticated users where `submitter_id = (auth.jwt()->>'sub')` and `status = 'pending'` and `xp_awarded = 0`.
- **UPDATE:** Submitter can update description/evidence while `status = 'pending'`. Status and XP updates are strictly restricted to the `approve_impact_submission` RPC.
- **DELETE:** Submitter while `status = 'pending'` or Admin.

```sql
CREATE POLICY "Submitters and verifiers can view impact submissions"
ON public.impact_submissions FOR SELECT
TO authenticated
USING (
  (auth.jwt()->>'sub') = submitter_id OR 
  public.is_verifier_or_admin()
);

CREATE POLICY "Users can submit their own impact"
ON public.impact_submissions FOR INSERT
TO authenticated
WITH CHECK (
  (auth.jwt()->>'sub') = submitter_id AND 
  status = 'pending' AND 
  xp_awarded = 0
);

CREATE POLICY "Submitters can edit pending submissions"
ON public.impact_submissions FOR UPDATE
TO authenticated
USING (
  (auth.jwt()->>'sub') = submitter_id AND 
  status = 'pending'
)
WITH CHECK (
  (auth.jwt()->>'sub') = submitter_id AND 
  status = 'pending' AND 
  xp_awarded = 0
);
```

#### 6. Gamification: XP Ledger & Badges (`xp_ledger`, `user_badges`)
- **SELECT:** Public (XP history and earned badges are transparently verifiable).
- **INSERT / UPDATE / DELETE:** Strictly prohibited for direct client writes. Modifiable ONLY by PostgreSQL `SECURITY DEFINER` functions (`approve_impact_submission`) or admin service-role.

```sql
CREATE POLICY "XP ledger is readable by everyone"
ON public.xp_ledger FOR SELECT USING (true);

CREATE POLICY "User badges are readable by everyone"
ON public.user_badges FOR SELECT USING (true);

-- No INSERT/UPDATE/DELETE policies for authenticated role -> client direct write blocked!
```

#### 7. Direct Messaging (`conversations`, `conversation_participants`, `messages`)
- **SELECT:** Only active participants of the conversation can view conversation metadata, participants, and messages.
- **INSERT:** Participants can send messages to conversations they belong to.

```sql
CREATE POLICY "Participants can view conversation messages"
ON public.messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp 
    WHERE cp.conversation_id = messages.conversation_id 
      AND cp.user_id = (auth.jwt()->>'sub')
  )
);

CREATE POLICY "Participants can post messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  (auth.jwt()->>'sub') = sender_id AND
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp 
    WHERE cp.conversation_id = messages.conversation_id 
      AND cp.user_id = (auth.jwt()->>'sub')
  )
);
```

#### 8. Notifications (`public.notifications`)
- **SELECT / UPDATE:** Only the `recipient_id`.
- **INSERT:** Server/Triggers or Authenticated actors.

```sql
CREATE POLICY "Users can view and manage their own notifications"
ON public.notifications FOR ALL
TO authenticated
USING ((auth.jwt()->>'sub') = recipient_id)
WITH CHECK ((auth.jwt()->>'sub') = recipient_id);
```

---

## 4. Supabase Storage Bucket Security Policies

EcoShare provisions 3 storage buckets via Supabase Storage:

### 4.1 Bucket Definitions & Security Configuration

#### 1. `avatars` Bucket
- **Visibility:** Public (`public: true`).
- **File constraints:** Max size 2MB, MIME types: `image/jpeg`, `image/png`, `image/webp`.
- **Upload policy:** Only authenticated user writing to `{userId}/*`.
- **Delete policy:** User owns `{userId}/*` or admin.

```sql
-- Upload: Users can upload avatar only inside their own folder
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = (auth.jwt()->>'sub')
);

CREATE POLICY "Avatar images are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
```

#### 2. `public-post-media` Bucket
- **Visibility:** Public (`public: true`).
- **File constraints:** Images <= 15MB, Videos <= 50MB. MIME types: `image/*`, `video/mp4`, `video/quicktime`.
- **Upload policy:** Only authenticated user writing to `{userId}/*`.
- **Delete policy:** Submitter owns folder or admin.

```sql
CREATE POLICY "Users can upload public post media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'public-post-media' AND 
  (storage.foldername(name))[1] = (auth.jwt()->>'sub')
);

CREATE POLICY "Public post media is readable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'public-post-media');
```

#### 3. `private-impact-evidence` Bucket (Strictly Private)
- **Visibility:** Private (`public: false`). Unauthenticated CDN access is completely disabled.
- **File constraints:** Max 25MB. MIME types: `image/*`, `video/mp4`, `application/pdf`.
- **Upload policy:** Submitter writes to `{userId}/{submissionId}/*`.
- **Read policy:** Only the submitter `{userId}` OR users with `is_verifier_or_admin()`.
- **Access mechanism:** Browser clients never get persistent public URLs. Server or client generates **short-lived signed URLs (60-second TTL)**.

```sql
CREATE POLICY "Submitters can upload impact evidence"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'private-impact-evidence' AND 
  (storage.foldername(name))[1] = (auth.jwt()->>'sub')
);

CREATE POLICY "Submitters and verifiers can access private evidence"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'private-impact-evidence' AND (
    (storage.foldername(name))[1] = (auth.jwt()->>'sub') OR
    public.is_verifier_or_admin()
  )
);
```

---

## 5. Input Validation, Sanitization & Defense-in-Depth

### 5.1 Centralized Zod Validation Schemas
All data entry points (Server Actions and API routes) validate untrusted payloads through strict Zod schemas:

- `CreatePostSchema`: Validates content length (1-3000 chars), sanitizes HTML tags, validates media UUIDs.
- `SubmitImpactSchema`: Validates title (5-120 chars), description (20-2500 chars), evidence storage paths, category from enum, and coordinates bounds.
- `VerifyImpactSchema`: Validates submission UUID, XP amount (1-1000), notes length (<= 1000 chars).

### 5.2 File Upload Defense
1. **Client-side Compression:** Browser resizes high-resolution camera photos to max 1920px width/height and compresses to WebP/JPEG before upload, saving bandwidth and storage.
2. **Server/Edge MIME & Magic Byte Check:** Inspects first 512 bytes of uploaded buffers to verify magic numbers (e.g. `\xFF\xD8\xFF` for JPEG, `\x89PNG` for PNG) preventing executable or malicious file spoofing.
3. **Randomized File Names:** Upload paths use cryptographically random UUIDs (`crypto.randomUUID()`) to prevent directory traversal or file overwrites.

### 5.3 Anti-Abuse & Rate Limiting
- **Next.js Server Actions:** In-memory token bucket / Redis rate limiting:
  - Post creation: Max 5 posts per 10 minutes per user.
  - Comments: Max 15 comments per 5 minutes per user.
  - Impact submissions: Max 3 submissions per hour per user.
- **Database Level:** Unique constraint `uq_post_likes (post_id, user_id)` and `uq_post_bookmarks` mechanically prevent duplicate count increments.
- **Audit Logging:** Every verifier action is permanently written to `public.verification_audit_log` with timestamp, verifier Clerk ID, XP amount, and optional review notes.
