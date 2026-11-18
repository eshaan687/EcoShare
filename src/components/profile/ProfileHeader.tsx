"use client";

import {
  Calendar,
  Check,
  Leaf,
  MapPin,
  MessageSquare,
  Pencil,
  UserCheck,
  UserPlus,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { VerificationBadge } from "@/components/impact/VerificationBadge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useSafeUser } from "@/lib/auth/clerk-hooks";
import { INITIATIVE_BANNERS } from "@/lib/constants/countries";
import { calculateLevelProgress } from "@/lib/constants/levels";
import type { PrototypeProfileSummary } from "@/lib/mock/prototype-data";
import { useSafeSupabaseClient } from "@/lib/supabase/client";
import { ensureCurrentUserProfile } from "@/lib/supabase/profile-sync";
import { cn } from "@/lib/utils";

export interface ProfileHeaderProps {
  readonly profile: PrototypeProfileSummary;
  readonly isOwnProfile?: boolean;
  readonly isFollowingInitial?: boolean;
  readonly onProfileUpdated?: (updated: Partial<PrototypeProfileSummary>) => void;
  readonly className?: string;
}

const COVER_OPTIONS = [
  { label: "Alpine Mountain Peaks", value: "/images/hero-mountains.png" },
  ...INITIATIVE_BANNERS,
] as const;

/**
 * Matches the "User Profile" header card in references/ecoshare-ui-reference.png
 * and persists profile edits (`public.profiles`), follow/unfollow actions (`public.follows`),
 * and direct message initiation (`/messages?to=[username]`).
 */
export function ProfileHeader({
  profile,
  isOwnProfile = false,
  isFollowingInitial = false,
  onProfileUpdated,
  className,
}: ProfileHeaderProps) {
  const supabase = useSafeSupabaseClient();
  const { user, isSignedIn } = useSafeUser();

  const [following, setFollowing] = useState(isFollowingInitial);
  const [followBusy, setFollowBusy] = useState(false);

  // Edit Profile Dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio);
  const [location, setLocation] = useState(profile.location);
  const [coverSrc, setCoverSrc] = useState(profile.coverSrc);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const progress = calculateLevelProgress(profile.totalXp);

  async function handleToggleFollow() {
    if (followBusy) return;
    if (user?.id && profile.userId && user.id === profile.userId) {
      return; // Prevent self-following
    }

    const nextFollowing = !following;
    setFollowing(nextFollowing);

    if (!isSignedIn || !user?.id || !supabase || !profile.userId) {
      return;
    }

    setFollowBusy(true);
    try {
      await ensureCurrentUserProfile(supabase, user);
      if (nextFollowing) {
        await supabase.from("follows").upsert(
          {
            follower_id: user.id,
            following_id: profile.userId,
          },
          { onConflict: "follower_id,following_id" },
        );
      } else {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", profile.userId);
      }
      onProfileUpdated?.({
        followersCount: Math.max(
          0,
          profile.followersCount + (nextFollowing ? 1 : -1),
        ),
      });
    } finally {
      setFollowBusy(false);
    }
  }

  function openEditDialog() {
    setDisplayName(profile.displayName);
    setUsername(profile.username);
    setBio(profile.bio);
    setLocation(profile.location);
    setCoverSrc(profile.coverSrc);
    setSaveError(null);
    setEditOpen(true);
  }

  async function handleSaveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError(null);

    const trimmedName = displayName.trim();
    const cleanedUsername = username
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "");
    const trimmedBio = bio.trim();
    const trimmedLocation = location.trim();

    if (trimmedName.length < 2) {
      setSaveError("Display name must be at least 2 characters.");
      return;
    }
    if (cleanedUsername.length < 3) {
      setSaveError("Username must be at least 3 alphanumeric characters.");
      return;
    }

    setSaving(true);
    try {
      if (supabase && isSignedIn && user?.id) {
        await ensureCurrentUserProfile(supabase, user);
        const { error } = await supabase
          .from("profiles")
          .update({
            display_name: trimmedName,
            username: cleanedUsername,
            bio: trimmedBio.slice(0, 500),
            location: trimmedLocation.slice(0, 100),
            cover_url: coverSrc,
          })
          .eq("user_id", user.id);

        if (error) {
          if (error.message.toLowerCase().includes("unique")) {
            setSaveError("That username is already taken. Please choose another.");
          } else {
            setSaveError(error.message);
          }
          return;
        }
      }

      onProfileUpdated?.({
        displayName: trimmedName,
        username: cleanedUsername,
        bio: trimmedBio,
        location: trimmedLocation,
        coverSrc,
      });
      setSavedNotice("Profile saved to Supabase!");
      setEditOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Card className={cn("overflow-hidden shadow-xs", className)}>
        {/* Nature Cover Banner */}
        <div className="relative h-40 w-full overflow-hidden border-b border-border sm:h-48">
          <Image
            src={profile.coverSrc || "/images/hero-mountains.png"}
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

            <div className="flex flex-wrap items-center gap-2 pt-2">
              {isOwnProfile ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  pill
                  onClick={openEditDialog}
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant={following ? "secondary" : "primary"}
                    size="sm"
                    pill
                    disabled={followBusy}
                    onClick={() => void handleToggleFollow()}
                    aria-pressed={following}
                  >
                    {following ? (
                      <>
                        <UserCheck className="h-4 w-4" aria-hidden="true" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" aria-hidden="true" />
                        Follow
                      </>
                    )}
                  </Button>

                  <Link
                    href={`/messages?to=${encodeURIComponent(profile.username)}`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-xs font-semibold text-foreground shadow-2xs transition-colors hover:bg-background outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    <span>Message</span>
                  </Link>
                </>
              )}
            </div>
          </div>

          {savedNotice ? (
            <div
              role="status"
              className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-secondary/50 px-3 py-1 text-xs font-semibold text-primary-dark"
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              {savedNotice}
            </div>
          ) : null}

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">
                {profile.displayName}
              </h1>
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

            {profile.bio ? (
              <p className="pt-1 text-sm text-foreground leading-relaxed">
                {profile.bio}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-muted-foreground">
              {profile.location ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  {profile.location}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1">
                <Calendar
                  className="h-3.5 w-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
                {profile.joinedLabel}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit EcoShare Profile"
        description="Update your display name, unique @username, biography, location, and cover banner."
      >
        <form onSubmit={(e) => void handleSaveProfile(e)} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="edit-profile-display-name"
                className="mb-1.5 block text-xs font-semibold text-foreground"
              >
                Display Name
              </label>
              <Input
                id="edit-profile-display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>

            <div>
              <label
                htmlFor="edit-profile-username"
                className="mb-1.5 block text-xs font-semibold text-foreground"
              >
                Username (@handle)
              </label>
              <Input
                id="edit-profile-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="edit-profile-location"
                className="mb-1.5 block text-xs font-semibold text-foreground"
              >
                Country / City Location
              </label>
              <Input
                id="edit-profile-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Monterrey, Mexico"
              />
            </div>

            <div>
              <label
                htmlFor="edit-profile-cover"
                className="mb-1.5 block text-xs font-semibold text-foreground"
              >
                Cover Banner Photo
              </label>
              <select
                id="edit-profile-cover"
                value={coverSrc}
                onChange={(e) => setCoverSrc(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-surface px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              >
                {COVER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="edit-profile-bio"
              className="mb-1.5 block text-xs font-semibold text-foreground"
            >
              Environmental Biography
            </label>
            <Textarea
              id="edit-profile-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Share your environmental interests, local initiatives, and goals..."
            />
          </div>

          {saveError ? (
            <p role="alert" className="text-xs font-medium text-destructive">
              {saveError}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              pill
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
