"use client";

import { useUser } from "@clerk/nextjs";
import {
  Globe2,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Target,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CommunityCard } from "@/components/communities/CommunityCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  INITIATIVE_BANNERS,
  WORLD_COUNTRIES,
} from "@/lib/constants/countries";
import type { PrototypeCommunity } from "@/lib/mock/prototype-data";
import { useSafeSupabaseClient } from "@/lib/supabase/client";
import { ensureCurrentUserProfile } from "@/lib/supabase/profile-sync";
import { cn } from "@/lib/utils";

const INITIATIVE_CATEGORIES = [
  "Ocean Conservation",
  "Tree Planting",
  "Recycling Initiatives",
  "Community Cleanup",
  "Wildlife Conservation",
  "Sustainable Living",
] as const;

const COMMUNITY_CATEGORIES = ["All", ...INITIATIVE_CATEGORIES] as const;

interface SupabaseCommunityRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  country: string;
  city: string | null;
  campaign_goal: string | null;
  visibility: string;
  banner_url: string;
  members_count: number;
  created_by: string | null;
  created_at: string;
}

function mapRowToCommunity(row: SupabaseCommunityRow): PrototypeCommunity {
  return {
    id: row.id,
    isPrototype: true,
    slug: row.slug,
    name: row.name,
    description: row.description,
    category: row.category,
    country: row.country || "Global",
    city: row.city ?? undefined,
    campaignGoal: row.campaign_goal ?? undefined,
    membersCount: row.members_count ?? 1,
    visibility: row.visibility === "private" ? "private" : "public",
    bannerSrc: row.banner_url || "/images/hero-mountains.png",
  };
}

export default function CommunitiesPage() {
  const supabase = useSafeSupabaseClient();
  const { user, isSignedIn } = useUser();
  const userId = user?.id ?? null;

  const [communities, setCommunities] = useState<readonly PrototypeCommunity[]>(
    [],
  );
  const [joinedIds, setJoinedIds] = useState<ReadonlySet<string>>(new Set());
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedCountry, setSelectedCountry] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Create Initiative / Campaign Dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [country, setCountry] = useState<string>("United States");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState<string>(INITIATIVE_CATEGORIES[0]);
  const [campaignGoal, setCampaignGoal] = useState("");
  const [description, setDescription] = useState("");
  const [bannerUrl, setBannerUrl] = useState<string>(
    INITIATIVE_BANNERS[0].value,
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdBannerMessage, setCreatedBannerMessage] = useState<
    string | null
  >(null);

  const fetchCommunities = useCallback(async () => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from("communities")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error && data && data.length > 0) {
      setCommunities(
        (data as unknown as SupabaseCommunityRow[]).map(mapRowToCommunity),
      );
    }

    if (userId) {
      const { data: memberships } = await supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", userId);

      if (memberships) {
        setJoinedIds(new Set(memberships.map((m) => m.community_id)));
      }
    }
  }, [supabase, userId]);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(async () => {
      if (!cancelled) {
        await fetchCommunities();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [fetchCommunities]);

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel("ecoshare-realtime-communities")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "communities" },
        () => {
          void fetchCommunities();
        },
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === "SUBSCRIBED");
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, fetchCommunities]);

  // Distinct countries that currently have initiatives for quick-filter chips
  const activeCountries = useMemo(() => {
    const set = new Set<string>();
    for (const item of communities) {
      if (item.country) {
        set.add(item.country);
      }
    }
    return Array.from(set).sort((a, b) => {
      if (a === "Global") return -1;
      if (b === "Global") return 1;
      return a.localeCompare(b);
    });
  }, [communities]);

  const visibleCommunities = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return communities.filter((item) => {
      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;
      const matchesCountry =
        selectedCountry === "All" ||
        (item.country ?? "Global").toLowerCase() ===
          selectedCountry.toLowerCase();
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        (item.country ?? "").toLowerCase().includes(query) ||
        (item.city ?? "").toLowerCase().includes(query) ||
        (item.campaignGoal ?? "").toLowerCase().includes(query);

      return matchesCategory && matchesCountry && matchesSearch;
    });
  }, [communities, selectedCategory, selectedCountry, searchQuery]);

  function openCreateDialogForCountry(prefillCountry?: string) {
    setErrorMessage(null);
    if (prefillCountry && prefillCountry !== "All") {
      setCountry(prefillCountry);
    }
    setCreateOpen(true);
  }

  async function handleCreateInitiative(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();
    const trimmedCity = city.trim();
    const trimmedGoal = campaignGoal.trim();

    if (trimmedTitle.length < 3) {
      setErrorMessage("Please enter an initiative or campaign name (at least 3 characters).");
      return;
    }
    if (trimmedDesc.length < 10) {
      setErrorMessage("Please describe your initiative and how people can participate.");
      return;
    }

    setSubmitting(true);
    try {
      const slugBase = trimmedTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 48);
      const uniqueSlug = `${slugBase || "eco-initiative"}-${Date.now().toString(36)}`;

      const optimisticCommunity: PrototypeCommunity = {
        id: `local-${Date.now()}`,
        isPrototype: true,
        slug: uniqueSlug,
        name: trimmedTitle,
        description: trimmedDesc,
        category,
        country,
        city: trimmedCity || undefined,
        campaignGoal: trimmedGoal || undefined,
        membersCount: 1,
        visibility: "public",
        bannerSrc: bannerUrl,
      };

      if (supabase && isSignedIn && user?.id) {
        await ensureCurrentUserProfile(supabase, user);
        const { data: inserted, error } = await supabase
          .from("communities")
          .insert({
            slug: uniqueSlug,
            name: trimmedTitle,
            description: trimmedDesc,
            category,
            country,
            city: trimmedCity || null,
            campaign_goal: trimmedGoal || null,
            visibility: "public",
            banner_url: bannerUrl,
            members_count: 1,
            created_by: user.id,
          })
          .select("*")
          .single();

        if (!error && inserted) {
          await supabase.from("community_members").upsert(
            {
              community_id: inserted.id,
              user_id: user.id,
            },
            { onConflict: "community_id,user_id" },
          );
          const createdMapped = mapRowToCommunity(
            inserted as unknown as SupabaseCommunityRow,
          );
          setCommunities((prev) => [
            createdMapped,
            ...prev.filter((c) => c.id !== createdMapped.id),
          ]);
          setJoinedIds((prev) => new Set([...prev, createdMapped.id]));
        } else {
          setCommunities((prev) => [optimisticCommunity, ...prev]);
        }
      } else {
        setCommunities((prev) => [optimisticCommunity, ...prev]);
      }

      if (selectedCountry !== "All" && selectedCountry !== country) {
        setSelectedCountry(country);
      }
      setCreatedBannerMessage(
        `Launched "${trimmedTitle}" in ${trimmedCity ? `${trimmedCity}, ${country}` : country}!`,
      );
      setTitle("");
      setCity("");
      setCampaignGoal("");
      setDescription("");
      setCreateOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/50 text-primary-dark">
              <Users className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Environmental Communities
              </h1>
              <p className="text-xs text-muted-foreground">
                Filter by any country worldwide to find local initiatives or launch your own campaign
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={isRealtimeConnected ? "verified" : "prototype"}>
              {isRealtimeConnected ? "Realtime Global Network" : "Global Initiatives"}
            </Badge>
            <Button
              type="button"
              variant="primary"
              size="sm"
              pill
              onClick={() => openCreateDialogForCountry(selectedCountry)}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create Initiative / Campaign
            </Button>
          </div>
        </div>

        {createdBannerMessage ? (
          <div
            role="status"
            className="flex items-center justify-between gap-2 rounded-xl border border-primary/30 bg-secondary/40 px-3.5 py-2.5 text-xs font-medium text-primary-dark"
          >
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              {createdBannerMessage}
            </span>
            <button
              type="button"
              onClick={() => setCreatedBannerMessage(null)}
              className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        ) : null}

        {/* Country Dropdown + Search Row */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="community-country-select"
              className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground"
            >
              <Globe2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Filter by Country (All {WORLD_COUNTRIES.length} Countries)
            </label>
            <select
              id="community-country-select"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="h-10 w-full rounded-xl border border-input bg-surface px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              <option value="All">🌍 All Countries Worldwide ({communities.length})</option>
              {WORLD_COUNTRIES.map((countryName) => (
                <option key={countryName} value={countryName}>
                  {countryName === "Global" ? "🌐 Global (Worldwide)" : countryName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="community-search-input"
              className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground"
            >
              <Search className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Search Initiatives, Cities, or Goals
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                id="community-search-input"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by campaign name, city, country..."
                className="h-10 w-full rounded-xl border border-input bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
              />
            </div>
          </div>
        </div>

        {/* Quick Country Pills for Active Countries */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Active Country Hubs</span>
            {selectedCountry !== "All" ? (
              <button
                type="button"
                onClick={() => setSelectedCountry("All")}
                className="text-primary hover:underline normal-case font-semibold"
              >
                Reset country filter
              </button>
            ) : null}
          </div>
          <div
            role="group"
            aria-label="Quick filter by active country"
            className="flex flex-wrap items-center gap-1.5"
          >
            <button
              type="button"
              aria-pressed={selectedCountry === "All"}
              onClick={() => setSelectedCountry("All")}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                selectedCountry === "All"
                  ? "bg-primary-dark text-white shadow-xs"
                  : "border border-border bg-background text-muted-foreground hover:text-foreground",
              )}
            >
              All Countries
            </button>
            {activeCountries.map((countryName) => {
              const active = selectedCountry === countryName;
              return (
                <button
                  key={countryName}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedCountry(countryName)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                    active
                      ? "bg-primary-dark text-white shadow-xs"
                      : "border border-border bg-background text-muted-foreground hover:text-foreground",
                  )}
                >
                  <MapPin className="h-3 w-3" aria-hidden="true" />
                  {countryName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div
          role="group"
          aria-label="Filter communities by category"
          className="flex flex-wrap items-center gap-2 border-t border-border pt-3"
        >
          {COMMUNITY_CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "bg-primary text-white shadow-xs"
                    : "border border-border bg-background text-muted-foreground hover:text-foreground",
                )}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </Card>

      {visibleCommunities.length === 0 ? (
        <Card className="p-8 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary/50 text-primary-dark">
            <Globe2 className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="text-base font-bold text-foreground">
            No initiatives found for{" "}
            {selectedCountry !== "All" ? selectedCountry : "this filter"} yet
          </h2>
          <p className="mx-auto max-w-md text-xs text-muted-foreground">
            Be the pioneer in{" "}
            {selectedCountry !== "All" ? selectedCountry : "your region"}! Create
            the first local environmental campaign so volunteers in your country can
            join and organize verified impact actions together.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <Button
              type="button"
              variant="primary"
              size="sm"
              pill
              onClick={() => openCreateDialogForCountry(selectedCountry)}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Launch Initiative in{" "}
              {selectedCountry !== "All" ? selectedCountry : "Your Country"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              pill
              onClick={() => {
                setSelectedCountry("All");
                setSelectedCategory("All");
                setSearchQuery("");
              }}
            >
              Show All Global Initiatives
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {visibleCommunities.map((community) => (
            <CommunityCard
              key={community.id}
              community={community}
              isJoinedInitial={joinedIds.has(community.id)}
            />
          ))}
        </div>
      )}

      {/* Create Initiative / Campaign Modal */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Environmental Initiative / Campaign"
        description="Launch a local or national campaign in your country so people around the world can find and join your mission."
      >
        <form onSubmit={(e) => void handleCreateInitiative(e)} className="space-y-4">
          <div>
            <label
              htmlFor="create-initiative-title"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Initiative or Campaign Name
            </label>
            <Input
              id="create-initiative-title"
              placeholder="e.g., Tokyo Bay Plastic-Free Shoreline Campaign"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="create-initiative-country"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Country
              </label>
              <select
                id="create-initiative-country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-surface px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              >
                {WORLD_COUNTRIES.map((countryName) => (
                  <option key={countryName} value={countryName}>
                    {countryName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="create-initiative-city"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                City / Region (optional)
              </label>
              <Input
                id="create-initiative-city"
                placeholder="e.g., Nairobi, Sydney, Berlin..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="create-initiative-category"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Environmental Category
              </label>
              <select
                id="create-initiative-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-surface px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              >
                {INITIATIVE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="create-initiative-banner"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Campaign Cover Theme
              </label>
              <select
                id="create-initiative-banner"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-surface px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              >
                {INITIATIVE_BANNERS.map((banner) => (
                  <option key={banner.value} value={banner.value}>
                    {banner.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="create-initiative-goal"
              className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground"
            >
              <Target className="h-4 w-4 text-primary" aria-hidden="true" />
              Campaign Goal / Measurable Target
            </label>
            <Input
              id="create-initiative-goal"
              type="text"
              value={campaignGoal}
              onChange={(e) => setCampaignGoal(e.target.value)}
              placeholder="e.g., Plant 2,500 native trees & clean 5 rivers this quarter"
            />
          </div>

          <div>
            <label
              htmlFor="create-initiative-description"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Mission & How Volunteers Can Participate
            </label>
            <Textarea
              id="create-initiative-description"
              placeholder="Describe where your group meets, what environmental challenge you are tackling, and how members can submit verified actions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {errorMessage ? (
            <p role="alert" className="text-xs font-medium text-destructive">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              pill
              disabled={submitting}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {submitting ? "Launching Campaign..." : "Launch Initiative"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
