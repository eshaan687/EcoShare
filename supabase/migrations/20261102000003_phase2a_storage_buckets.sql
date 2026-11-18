-- EcoShare Phase 2A: Storage Buckets and Policies Migration
-- Document Version: 2.1
-- Status: Product Owner Approved
-- Description: Provisions the 3 approved EcoShare storage buckets and applies strict storage RLS policies.

-- 1. Insert Storage Buckets into storage.buckets if they do not already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'avatars',
    'avatars',
    true,
    2097152, -- 2 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'public-post-media',
    'public-post-media',
    true,
    52428800, -- 50 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime']
  ),
  (
    'private-impact-evidence',
    'private-impact-evidence',
    false, -- STRICTLY PRIVATE: No direct public access
    26214400, -- 25 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'application/pdf']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage RLS Policies for avatars bucket

-- Anyone can view avatars (public CDN read)
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Authenticated users can upload avatars only inside their own user folder: {userId}/*
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
);

-- Users can update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
);

-- Users can delete their own avatar, or admins can delete
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND (
    (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub') OR
    public.is_admin()
  )
);

-- 3. Storage RLS Policies for public-post-media bucket

-- Anyone can view public post media (public CDN read)
CREATE POLICY "Public post media is viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'public-post-media');

-- Authenticated users can upload media only inside their own user folder: {userId}/*
CREATE POLICY "Users can upload their own public post media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'public-post-media' AND 
  (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
);

-- Users can update or delete their own post media, or admins can delete
CREATE POLICY "Users can delete their own public post media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'public-post-media' AND (
    (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub') OR
    public.is_admin()
  )
);

-- 4. Storage RLS Policies for private-impact-evidence bucket (STRICTLY PRIVATE)

-- Read Access: ONLY the submitter OR authorized verifiers / administrators
-- No public unauthenticated reads permitted!
CREATE POLICY "Only submitter or verifiers can access private evidence"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'private-impact-evidence' AND (
    (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub') OR
    public.is_verifier_or_admin()
  )
);

-- Upload Access: Authenticated users can upload evidence only into their own user folder: {userId}/*
CREATE POLICY "Users can upload private impact evidence"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'private-impact-evidence' AND 
  (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
);

-- Delete Access: Submitter or admin only
CREATE POLICY "Submitters or admins can delete private evidence"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'private-impact-evidence' AND (
    (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub') OR
    public.is_admin()
  )
);
