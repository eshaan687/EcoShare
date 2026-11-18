"use client";

import { useUser } from "@clerk/nextjs";
import { Check, Globe, MapPin, Target, Users } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { PrototypeCommunity } from "@/lib/mock/prototype-data";
import { useSafeSupabaseClient } from "@/lib/supabase/client";
import { ensureCurrentUserProfile } from "@/lib/supabase/profile-sync";
import { cn } from "@/lib/utils";

export interface CommunityCardProps {
  readonly community: PrototypeCommunity;
  readonly isJoinedInitial?: boolean;
  readonly className?: string;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function CommunityCard({
  community,
  isJoinedInitial = false,
  className,
}: CommunityCardProps) {
  const supabase = useSafeSupabaseClient();
  const { user, isSignedIn } = useUser();

  const [joined, setJoined] = useState(isJoinedInitial);
  const [membersDelta, setMembersDelta] = useState(0);
  const [busy, setBusy] = useState(false);

  async function handleToggleJoin() {
    if (busy) return;
    const nextJoined = !joined;
    setJoined(nextJoined);
    setMembersDelta((prev) => prev + (nextJoined ? 1 : -1));

    if (!supabase || !isSignedIn || !user?.id || !UUID_REGEX.test(community.id)) {
      return;
    }

    setBusy(true);
    try {
      await ensureCurrentUserProfile(supabase, user);
      if (nextJoined) {
        await supabase.from("community_members").upsert(
          {
            community_id: community.id,
            user_id: user.id,
          },
          { onConflict: "community_id,user_id" },
        );
      } else {
        await supabase
          .from("community_members")
          .delete()
          .eq("community_id", community.id)
          .eq("user_id", user.id);
      }
    } finally {
      setBusy(false);
    }
  }

  const countryLabel = community.country ?? "Global";
  const locationLabel = community.city
    ? `${community.city}, ${countryLabel}`
    : countryLabel;

  return (
    <Card className={cn("overflow-hidden flex flex-col", className)}>
      <div className="relative h-36 w-full overflow-hidden border-b border-border">
        <Image
          src={community.bannerSrc || "/images/hero-mountains.png"}
          alt={community.name}
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
          <Badge variant="verified">{community.category}</Badge>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-0.5 text-[11px] font-semibold text-foreground shadow-xs backdrop-blur-xs">
            <MapPin className="h-3 w-3 text-primary" aria-hidden="true" />
            {countryLabel}
          </span>
        </div>

        {community.city ? (
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-white/95">
            <span className="inline-flex items-center gap-1 truncate font-medium drop-shadow-xs">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-300" aria-hidden="true" />
              {locationLabel}
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col justify-between p-5">
        <div className="space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-bold text-foreground leading-snug">
              {community.name}
            </h3>
            <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
              <Globe className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Public
            </span>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {community.description}
          </p>

          {community.campaignGoal ? (
            <div className="rounded-xl border border-primary/20 bg-secondary/35 px-3 py-2 text-xs text-foreground">
              <div className="flex items-center gap-1.5 font-semibold text-primary-dark">
                <Target className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                <span>Initiative Goal</span>
              </div>
              <p className="mt-0.5 text-muted-foreground">{community.campaignGoal}</p>
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Users className="h-4 w-4 text-primary" aria-hidden="true" />
            {Math.max(0, community.membersCount + membersDelta).toLocaleString()} members
          </span>

          <Button
            type="button"
            size="sm"
            variant={joined ? "secondary" : "primary"}
            pill
            disabled={busy}
            onClick={() => void handleToggleJoin()}
            aria-pressed={joined}
          >
            {joined ? (
              <>
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                Joined Initiative
              </>
            ) : (
              "Join Initiative"
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
