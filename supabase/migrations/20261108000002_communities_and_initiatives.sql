-- EcoShare Phase 2: Global Country-Filtered Communities & Initiatives Migration
-- Document Version: 2.3
-- Description: Creates communities and community_members tables with country/city/campaign
--              fields, Row Level Security, Realtime replication, and global seed initiatives.

CREATE TABLE IF NOT EXISTS public.communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Community Cleanup',
    country TEXT NOT NULL DEFAULT 'Global',
    city TEXT,
    campaign_goal TEXT,
    banner_url TEXT NOT NULL DEFAULT '/images/cleanup-park.png',
    visibility TEXT NOT NULL DEFAULT 'public',
    members_count INTEGER NOT NULL DEFAULT 1,
    created_by TEXT REFERENCES public.profiles(user_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_communities_name_length CHECK (char_length(name) >= 3 AND char_length(name) <= 120),
    CONSTRAINT chk_communities_desc_length CHECK (char_length(description) >= 10 AND char_length(description) <= 1500),
    CONSTRAINT chk_communities_visibility CHECK (visibility IN ('public', 'private')),
    CONSTRAINT chk_communities_members_non_negative CHECK (members_count >= 0)
);

CREATE INDEX IF NOT EXISTS idx_communities_country ON public.communities(country);
CREATE INDEX IF NOT EXISTS idx_communities_category ON public.communities(category);
CREATE INDEX IF NOT EXISTS idx_communities_created_at ON public.communities(created_at DESC);

CREATE TABLE IF NOT EXISTS public.community_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_community_member UNIQUE (community_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_members_comm_id ON public.community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON public.community_members(user_id);

-- Trigger to automatically maintain communities.members_count
CREATE OR REPLACE FUNCTION public.sync_community_members_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.communities SET members_count = members_count + 1 WHERE id = NEW.community_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.communities SET members_count = GREATEST(1, members_count - 1) WHERE id = OLD.community_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_community_members_count ON public.community_members;
CREATE TRIGGER trg_sync_community_members_count
AFTER INSERT OR DELETE ON public.community_members
FOR EACH ROW
EXECUTE FUNCTION public.sync_community_members_count();

-- Enable RLS
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- Communities Policies
CREATE POLICY "Communities are readable by everyone"
ON public.communities FOR SELECT USING (true);

CREATE POLICY "Authenticated users can launch initiatives and communities"
ON public.communities FOR INSERT TO authenticated
WITH CHECK ((select auth.jwt() ->> 'sub') = created_by);

CREATE POLICY "Creators or admins can update communities"
ON public.communities FOR UPDATE TO authenticated
USING ((select auth.jwt() ->> 'sub') = created_by OR public.is_admin())
WITH CHECK ((select auth.jwt() ->> 'sub') = created_by OR public.is_admin());

-- Community Members Policies
CREATE POLICY "Community memberships are readable by everyone"
ON public.community_members FOR SELECT USING (true);

CREATE POLICY "Authenticated users can join communities"
ON public.community_members FOR INSERT TO authenticated
WITH CHECK ((select auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Authenticated users can leave communities"
ON public.community_members FOR DELETE TO authenticated
USING ((select auth.jwt() ->> 'sub') = user_id);

-- Realtime Replication
ALTER TABLE public.communities REPLICA IDENTITY FULL;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.communities;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Seed Global & Country-Specific Initiatives
INSERT INTO public.communities (id, slug, name, description, category, country, city, campaign_goal, banner_url, visibility, members_count, created_by)
VALUES
  (
    '33333333-3333-4333-8333-333333333301',
    'beach-cleanup-volunteers',
    'Beach Cleanup Volunteers',
    'Coordinating coastal cleanups, marine debris tracking, and shoreline protection.',
    'Ocean Conservation',
    'United States',
    'San Diego',
    'Remove 5,000 kg of coastal plastic debris this quarter',
    '/images/challenge-oceans.png',
    'public',
    14820,
    'user_david_l'
  ),
  (
    '33333333-3333-4333-8333-333333333302',
    'urban-gardening-collective',
    'Urban Gardening & Reforestation',
    'Transforming city rooftops, schoolyards, and parks with native trees and pollinator gardens.',
    'Tree Planting',
    'Canada',
    'Vancouver',
    'Plant 2,500 native saplings across urban neighborhoods',
    '/images/challenge-trees.png',
    'public',
    9640,
    'user_maya_s'
  ),
  (
    '33333333-3333-4333-8333-333333333303',
    'community-recycling-network',
    'Zero-Waste & Recycling Advocates',
    'Practical community recycling drives, repair cafes, and local waste-reduction education.',
    'Recycling Initiatives',
    'Mexico',
    'Monterrey',
    'Zero-waste sorting stations in 40 local parks and campuses',
    '/images/cleanup-park.png',
    'public',
    7210,
    'user_sofia_m'
  ),
  (
    '33333333-3333-4333-8333-333333333304',
    'lisbon-plastic-free-harbor',
    'Atlantic Plastic-Free Harbor Initiative',
    'Mobilizing local volunteers, surfers, and fishermen to eliminate single-use plastics along the Tagus estuary.',
    'Ocean Conservation',
    'Portugal',
    'Lisbon',
    '100% plastic-free coastal markets and 50 harbor cleanups',
    '/images/cleanup-team.png',
    'public',
    4380,
    'user_elena_k'
  ),
  (
    '33333333-3333-4333-8333-333333333305',
    'global-pollinator-corridor',
    'Global Pollinator & Biodiversity Corridor',
    'Worldwide citizen-science campaign planting native wildflowers to restore monarch butterfly and wild bee habitats.',
    'Wildlife Conservation',
    'Global',
    'Worldwide',
    'Establish 1,000 verified micro-meadows across 30+ countries',
    '/images/wildlife-pollinator.png',
    'public',
    18950,
    'user_alex_r'
  ),
  (
    '33333333-3333-4333-8333-333333333306',
    'green-canopy-south-asia',
    'Monsoon Reforestation & Urban Canopy',
    'Community-led native tree planting drives to cool urban heat islands and restore watershed forests.',
    'Tree Planting',
    'India',
    'Bengaluru',
    '10,000 native neem, banyan, and peepal saplings planted',
    '/images/challenge-trees.png',
    'public',
    11240,
    'user_alex_r'
  )
ON CONFLICT (slug) DO NOTHING;
