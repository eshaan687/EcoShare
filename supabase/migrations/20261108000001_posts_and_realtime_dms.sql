-- EcoShare Phase 2: Real-Time Posts, Engagement & Direct Messaging Migration
-- Document Version: 2.2
-- Description: Implements posts, post_media, post_likes, post_comments, post_bookmarks,
--              conversations, conversation_participants, messages, RLS policies,
--              Supabase Realtime replication, and initial community seed data.

-- 1. Allow authenticated users to self-register their initial profile row (with 0 XP & Level 1)
DO $$ BEGIN
  CREATE POLICY "Users can insert their own initial profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.jwt() ->> 'sub') = user_id
    AND total_xp = 0
    AND level = 1
    AND is_deleted = false
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Posts Table
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id TEXT NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Community Cleanup',
    location TEXT,
    is_verified_impact BOOLEAN NOT NULL DEFAULT false,
    likes_count INTEGER NOT NULL DEFAULT 0,
    comments_count INTEGER NOT NULL DEFAULT 0,
    bookmarks_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_posts_content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 2000),
    CONSTRAINT chk_posts_location_length CHECK (location IS NULL OR char_length(location) <= 120),
    CONSTRAINT chk_posts_counts_non_negative CHECK (likes_count >= 0 AND comments_count >= 0 AND bookmarks_count >= 0)
);

CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_verified ON public.posts(is_verified_impact, created_at DESC);

-- 3. Post Media Table
CREATE TABLE IF NOT EXISTS public.post_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    media_type TEXT NOT NULL DEFAULT 'image',
    url TEXT NOT NULL,
    alt_text TEXT NOT NULL DEFAULT 'Environmental action media',
    has_verified_badge BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_post_media_type CHECK (media_type IN ('image', 'video'))
);

CREATE INDEX IF NOT EXISTS idx_post_media_post_id ON public.post_media(post_id);

-- 4. Post Likes Table
CREATE TABLE IF NOT EXISTS public.post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_post_likes_post_user UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);

-- 5. Post Comments Table
CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    author_id TEXT NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_post_comments_length CHECK (char_length(content) >= 1 AND char_length(content) <= 1000)
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id, created_at ASC);

-- 6. Post Bookmarks Table
CREATE TABLE IF NOT EXISTS public.post_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_post_bookmarks_post_user UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_bookmarks_user_id ON public.post_bookmarks(user_id);

-- 7. Direct Messaging Tables (Conversations, Participants, Messages)
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    is_group BOOLEAN NOT NULL DEFAULT false,
    created_by TEXT REFERENCES public.profiles(user_id) ON DELETE SET NULL,
    last_message_preview TEXT,
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at DESC);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_read_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_conversation_participant UNIQUE (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_participants_conv_id ON public.conversation_participants(conversation_id);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_messages_content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 2000)
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages(conversation_id, created_at ASC);

-- 8. Helper Functions & Integrity Triggers

-- Check if current authenticated user is a participant in a conversation
CREATE OR REPLACE FUNCTION public.is_conversation_participant(p_conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE conversation_id = p_conversation_id
      AND user_id = (auth.jwt() ->> 'sub')
  );
$$;

-- Protect post verification flag & counters from direct client manipulation
CREATE OR REPLACE FUNCTION public.protect_post_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF current_user != 'service_role' AND current_user != 'postgres' AND NOT public.is_verifier_or_admin() THEN
      NEW.is_verified_impact := false;
      NEW.likes_count := 0;
      NEW.comments_count := 0;
      NEW.bookmarks_count := 0;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF current_user != 'service_role' AND current_user != 'postgres' AND NOT public.is_verifier_or_admin() THEN
      NEW.is_verified_impact := OLD.is_verified_impact;
      NEW.likes_count := OLD.likes_count;
      NEW.comments_count := OLD.comments_count;
      NEW.bookmarks_count := OLD.bookmarks_count;
    END IF;
    NEW.updated_at := timezone('utc'::text, now());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_post_integrity ON public.posts;
CREATE TRIGGER trg_protect_post_integrity
BEFORE INSERT OR UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.protect_post_integrity();

-- Automatically maintain posts.likes_count
CREATE OR REPLACE FUNCTION public.sync_post_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_post_likes_count ON public.post_likes;
CREATE TRIGGER trg_sync_post_likes_count
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW
EXECUTE FUNCTION public.sync_post_likes_count();

-- Automatically maintain posts.comments_count
CREATE OR REPLACE FUNCTION public.sync_post_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_post_comments_count ON public.post_comments;
CREATE TRIGGER trg_sync_post_comments_count
AFTER INSERT OR DELETE ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION public.sync_post_comments_count();

-- Automatically update conversation last_message_preview & timestamp on new message
CREATE OR REPLACE FUNCTION public.sync_conversation_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.conversations
  SET
    last_message_preview = LEFT(NEW.content, 140),
    last_message_at = NEW.created_at,
    updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_conversation_last_message ON public.messages;
CREATE TRIGGER trg_sync_conversation_last_message
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.sync_conversation_last_message();

-- 9. Enable Row Level Security (RLS) on All New Tables
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Posts Policies
CREATE POLICY "Posts are readable by everyone"
ON public.posts FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create their own posts"
ON public.posts FOR INSERT TO authenticated
WITH CHECK ((select auth.jwt() ->> 'sub') = author_id);

CREATE POLICY "Authors or admins can update posts"
ON public.posts FOR UPDATE TO authenticated
USING ((select auth.jwt() ->> 'sub') = author_id OR public.is_admin())
WITH CHECK ((select auth.jwt() ->> 'sub') = author_id OR public.is_admin());

CREATE POLICY "Authors or admins can delete posts"
ON public.posts FOR DELETE TO authenticated
USING ((select auth.jwt() ->> 'sub') = author_id OR public.is_admin());

-- Post Media Policies
CREATE POLICY "Post media is readable by everyone"
ON public.post_media FOR SELECT USING (true);

CREATE POLICY "Post authors can insert post media"
ON public.post_media FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE id = post_id AND author_id = (select auth.jwt() ->> 'sub')
  )
);

-- Post Likes Policies
CREATE POLICY "Post likes are readable by everyone"
ON public.post_likes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like posts"
ON public.post_likes FOR INSERT TO authenticated
WITH CHECK ((select auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Authenticated users can unlike their own likes"
ON public.post_likes FOR DELETE TO authenticated
USING ((select auth.jwt() ->> 'sub') = user_id);

-- Post Comments Policies
CREATE POLICY "Post comments are readable by everyone"
ON public.post_comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can comment on posts"
ON public.post_comments FOR INSERT TO authenticated
WITH CHECK ((select auth.jwt() ->> 'sub') = author_id);

CREATE POLICY "Comment authors or admins can delete comments"
ON public.post_comments FOR DELETE TO authenticated
USING ((select auth.jwt() ->> 'sub') = author_id OR public.is_admin());

-- Post Bookmarks Policies
CREATE POLICY "Users can view their own bookmarks"
ON public.post_bookmarks FOR SELECT TO authenticated
USING ((select auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can create their own bookmarks"
ON public.post_bookmarks FOR INSERT TO authenticated
WITH CHECK ((select auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can delete their own bookmarks"
ON public.post_bookmarks FOR DELETE TO authenticated
USING ((select auth.jwt() ->> 'sub') = user_id);

-- Conversations Policies
CREATE POLICY "Participants can view their conversations"
ON public.conversations FOR SELECT TO authenticated
USING (
  created_by = (select auth.jwt() ->> 'sub') OR
  public.is_conversation_participant(id)
);

CREATE POLICY "Authenticated users can create conversations"
ON public.conversations FOR INSERT TO authenticated
WITH CHECK ((select auth.jwt() ->> 'sub') = created_by);

CREATE POLICY "Participants can update their conversations"
ON public.conversations FOR UPDATE TO authenticated
USING (public.is_conversation_participant(id));

-- Conversation Participants Policies
CREATE POLICY "Participants can view conversation members"
ON public.conversation_participants FOR SELECT TO authenticated
USING (
  user_id = (select auth.jwt() ->> 'sub') OR
  public.is_conversation_participant(conversation_id)
);

CREATE POLICY "Users can join or be added by conversation creator"
ON public.conversation_participants FOR INSERT TO authenticated
WITH CHECK (
  user_id = (select auth.jwt() ->> 'sub') OR
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = conversation_id AND created_by = (select auth.jwt() ->> 'sub')
  )
);

-- Messages Policies
CREATE POLICY "Participants can read conversation messages"
ON public.messages FOR SELECT TO authenticated
USING (public.is_conversation_participant(conversation_id));

CREATE POLICY "Participants can send messages in their conversations"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  (select auth.jwt() ->> 'sub') = sender_id AND
  public.is_conversation_participant(conversation_id)
);

-- 10. Configure Supabase Realtime Publication
ALTER TABLE public.posts REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 11. Seed Initial Community Profiles & Feed Posts into Supabase
INSERT INTO public.profiles (user_id, username, display_name, avatar_url, bio, location, total_xp, level)
VALUES
  ('user_alex_r', 'alexr', 'Alex R.', '/images/avatar-alex.png', 'Passionate about environmental conservation and sustainable living. Organizing weekly urban park cleanups and native tree planting drives.', 'Monterrey, Mexico', 420, 4),
  ('user_sofia_m', 'sofiam', 'Sofia M.', '/images/avatar-sofia.png', 'Environmental science student leading campus zero-waste drives and weekend park restorations.', 'Monterrey, Mexico', 385, 4),
  ('user_marcus_v', 'marcusv', 'Marcus V.', '/images/avatar-marcus.png', 'Urban forestry coordinator and watershed volunteer.', 'Portland, USA', 540, 4),
  ('user_david_l', 'davidl', 'David L.', '/images/avatar-alex.png', 'Coastal cleanup organizer and marine conservation diver.', 'San Diego, USA', 610, 4),
  ('user_maya_s', 'mayas', 'Maya S.', '/images/avatar-elena.png', 'Pollinator habitat specialist and community botanist.', 'Vancouver, Canada', 490, 4),
  ('user_elena_k', 'elenak', 'Elena K.', '/images/avatar-elena.png', 'Zero-waste advocate and sustainable living enthusiast.', 'Lisbon, Portugal', 120, 2)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.posts (id, author_id, content, category, location, is_verified_impact, likes_count, comments_count, created_at)
VALUES
  (
    '11111111-1111-4111-8111-111111111101',
    'user_sofia_m',
    'Cleaned up litter at Fundidora Park today with my classmates! ♻️ Small actions make a big difference. 💚',
    'Community Cleanup',
    'Monterrey, Mexico',
    true,
    284,
    27,
    timezone('utc'::text, now()) - interval '2 hours'
  ),
  (
    '11111111-1111-4111-8111-111111111102',
    'user_marcus_v',
    'Our weekend urban canopy group planted 18 native oak saplings along the river trail. Submitted evidence through the Impact workflow for verifier review!',
    'Tree Planting',
    'Portland, USA',
    true,
    142,
    19,
    timezone('utc'::text, now()) - interval '5 hours'
  ),
  (
    '11111111-1111-4111-8111-111111111103',
    'user_david_l',
    'Recorded 14 kg of marine microplastics and abandoned fishing gear removed during our low-tide shoreline survey at Balboa Cove. Clean waters protect our marine life! 🌊🐢',
    'Community Cleanup',
    'San Diego, USA',
    true,
    198,
    14,
    timezone('utc'::text, now()) - interval '8 hours'
  ),
  (
    '11111111-1111-4111-8111-111111111104',
    'user_maya_s',
    'Planted a native clover and lavender micro-meadow to support urban bumblebee populations. Documented flower coverage and visitor density for our local biodiversity audit! 🐝🌸',
    'Wildlife Conservation',
    'Vancouver, Canada',
    true,
    215,
    23,
    timezone('utc'::text, now()) - interval '12 hours'
  ),
  (
    '11111111-1111-4111-8111-111111111105',
    'user_elena_k',
    'What reusable containers do you bring for zero-waste grocery shopping? Looking for lightweight ideas before starting the 7-Day Plastic Reduction Challenge.',
    'Sustainable Living',
    'Lisbon, Portugal',
    false,
    64,
    31,
    timezone('utc'::text, now()) - interval '24 hours'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.post_media (id, post_id, media_type, url, alt_text, has_verified_badge)
VALUES
  (
    '22222222-2222-4222-8222-222222222201',
    '11111111-1111-4111-8111-111111111101',
    'image',
    '/images/cleanup-park.png',
    'Gloved volunteer hand collecting recyclable plastic bottle on park grass',
    false
  ),
  (
    '22222222-2222-4222-8222-222222222202',
    '11111111-1111-4111-8111-111111111101',
    'image',
    '/images/cleanup-team.png',
    'Four classmates in recycling volunteer shirts smiling at Fundidora Park',
    true
  ),
  (
    '22222222-2222-4222-8222-222222222203',
    '11111111-1111-4111-8111-111111111102',
    'image',
    '/images/challenge-trees.png',
    'Newly planted native sapling in rich soil',
    true
  ),
  (
    '22222222-2222-4222-8222-222222222204',
    '11111111-1111-4111-8111-111111111103',
    'image',
    '/images/challenge-oceans.png',
    'Green sea turtle in turquoise coastal waters',
    true
  ),
  (
    '22222222-2222-4222-8222-222222222205',
    '11111111-1111-4111-8111-111111111104',
    'image',
    '/images/wildlife-pollinator.png',
    'Bumblebee pollinating purple wildflower blossoms in community garden',
    true
  )
ON CONFLICT (id) DO NOTHING;
