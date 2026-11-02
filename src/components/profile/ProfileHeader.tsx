"use client";

import { Calendar, Leaf, MapPin, UserCheck, UserPlus } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { VerificationBadge } from "@/components/impact/VerificationBadge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { calculateLevelProgress } from "@/lib/constants/levels";
import type { PrototypeProfileSummary } from "@/lib/mock/prototype-data";
import { cn } from "@/lib/utils";

export interface ProfileHeaderProps {
  readonly profile: PrototypeProfileSummary;
  readonly isOwnProfile?: boolean;
  readonly className?: string;
}

/**
 * Matches the "User Profile" header card in references/ecoshare-ui-reference.png:
 * mountain nature cover banner, overlapping photographic avatar, "Alex R. ✓", "@alexr",
 * "Level 4 · Planet Protector", bio, location, and Edit Profile / Follow action.
 */
export function ProfileHeader({
  profile,
  isOwnProfile = false,
  className,
}: ProfileHeaderProps) {
  const [followingPreview, setFollowingPreview] = useState(false);
  const progress = calculateLevelProgress(profile.totalXp);

  return (
    <Card className={cn("overflow-hidden shadow-xs", className)}>
      {/* Nature Cover Banner */}
      <div className="relative h-40 w-full overflow-hidden border-b border-border sm:h-48">
        <Image
          src={profile.coverSrc}
          alt={`${profile.displayName} cover banner`}
          fill
          sizes="(max-width: 1024px) 100vw, 720px"
          className="object-cover"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent"
          aria-hidden="true"
        />
      </div>

      {/* Profile Identity Content */}
      <div className="px-6 pb-5">
        <div className="relative -mt-11 mb-3 flex flex-wrap items-end justify-between gap-3">
          <Avatar
            src={profile.avatarSrc}
            alt={profile.displayName}
            size="xl"
            className="h-22 w-22 border-4 border-surface shadow-sm"
          />

          <div className="flex items-center gap-2 pt-2">
            {isOwnProfile ? (
              <Button type="button" variant="secondary" size="sm" pill>
                Edit Profile
              </Button>
            ) : (
              <Button
                type="button"
                variant={followingPreview ? "secondary" : "primary"}
                size="sm"
                pill
                onClick={() => setFollowingPreview((prev) => !prev)}
                aria-pressed={followingPreview}
              >
                {followingPreview ? (
                  <>
                    <UserCheck className="h-4 w-4" aria-hidden="true" />
                    Following (Preview)
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" aria-hidden="true" />
                    Follow
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">{profile.displayName}</h1>
            {profile.isVerifiedContributor ? (
              <VerificationBadge variant="author" />
            ) : null}
          </div>

          <p className="text-sm text-muted-foreground">@{profile.username}</p>

          <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-dark pt-0.5">
            <Leaf className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            <span>
              Level {progress.currentLevel.level} · {progress.currentLevel.name}
            </span>
          </p>

          <p className="pt-1 text-sm text-foreground leading-relaxed">{profile.bio}</p>

          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              {profile.location}
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              {profile.joinedLabel}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
