"use client";

import { useSafeAuth, useSafeUser } from "@/lib/auth/clerk-hooks";
import {
  INITIATIVE_BANNERS,
  WORLD_COUNTRIES,
} from "@/lib/constants/countries";
import { dispatchPostCreatedEvent } from "@/lib/realtime/use-realtime-feed";
import { useSafeSupabaseClient } from "@/lib/supabase/client";
import { ensureCurrentUserProfile } from "@/lib/supabase/profile-sync";
import {
  CheckCircle2,
  Image as ImageIcon,
  Info,
  Lock,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Upload,
  Video,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/utils";

export const IMPACT_SUBMITTED_EVENT = "ecoshare:impact-submitted";

export function dispatchImpactSubmittedEvent() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(IMPACT_SUBMITTED_EVENT));
  }
}

const CATEGORY_XP_REWARDS: Readonly<Record<string, number>> = {
  "Community Cleanup": 75,
  "Tree Planting": 100,
  "Recycling Initiatives": 50,
  "Ocean Conservation": 75,
  "Wildlife Conservation": 75,
  "Sustainable Living": 50,
};

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // 100 MB

export interface CreateActionDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly defaultMode?: "post" | "impact";
  readonly defaultCategory?: string;
  readonly defaultTitle?: string;
}

/**
 * Matches the "Share an Environmental Action" modal in the bottom-left panel of
 * references/ecoshare-ui-reference.png and connects both Community Posts AND
 * Impact Evidence Submissions (with Supabase Storage uploads, country, and date) in real time.
 */
export function CreateActionDialog({
  open,
  onOpenChange,
  defaultMode = "impact",
  defaultCategory = "Community Cleanup",
  defaultTitle = "",
}: CreateActionDialogProps) {
  const { isSignedIn } = useSafeAuth();
  const { user } = useSafeUser();
  const supabase = useSafeSupabaseClient();
  const [mode, setMode] = useState<"post" | "impact">(defaultMode);
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState("United States");
  const [activityDate, setActivityDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [category, setCategory] = useState(defaultCategory);
  const [evidenceUrl, setEvidenceUrl] = useState<string>(
    INITIATIVE_BANNERS[2].value,
  );
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewNotice, setPreviewNotice] = useState<string | null>(null);

  const rewardXp = CATEGORY_XP_REWARDS[category] ?? 75;

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (
      !file.type.startsWith("image/") &&
      !file.type.startsWith("video/")
    ) {
      setPreviewNotice(
        "Unsupported file type: Please upload an image (JPEG, PNG, WebP) or video (MP4, WebM).",
      );
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setPreviewNotice("File exceeds the 100 MB maximum size limit.");
      return;
    }

    setUploadedFileName(file.name);

    if (supabase && isSignedIn && user?.id) {
      setUploadingFile(true);
      try {
        const bucket =
          mode === "impact" ? "private-impact-evidence" : "public-post-media";
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storagePath = `${user.id}/${Date.now()}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(storagePath, file, { upsert: false });

        if (!uploadError) {
          if (bucket === "public-post-media") {
            const { data: pub } = supabase.storage
              .from(bucket)
              .getPublicUrl(storagePath);
            if (pub?.publicUrl) {
              setEvidenceUrl(pub.publicUrl);
            }
          } else {
            const { data: signed } = await supabase.storage
              .from(bucket)
              .createSignedUrl(storagePath, 3600);
            if (signed?.signedUrl) {
              setEvidenceUrl(signed.signedUrl);
            }
          }
          setPreviewNotice(
            `Uploaded "${file.name}" to Supabase Storage (${bucket}).`,
          );
          return;
        }
      } finally {
        setUploadingFile(false);
      }
    }

    setPreviewNotice(`Selected media file "${file.name}" ready for submission.`);
  }

  async function handlePreviewSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isSignedIn || !user) {
      setPreviewNotice(
        "Sign in required: Please sign in via Clerk (/login) to submit posts or environmental evidence.",
      );
      return;
    }

    const trimmedDesc = description.trim();
    if (trimmedDesc.length < 5) {
      setPreviewNotice(
        "Please describe the environmental action you completed (at least 5 characters).",
      );
      return;
    }

    if (mode === "post" && supabase) {
      setIsSubmitting(true);
      try {
        await ensureCurrentUserProfile(supabase, user);
        const { data: insertedPost, error } = await supabase
          .from("posts")
          .insert({
            author_id: user.id,
            content: trimmedDesc,
            category,
            location: location.trim() || null,
            is_verified_impact: false,
          })
          .select("id")
          .single();

        if (error) {
          setPreviewNotice(`Could not publish post: ${error.message}`);
          return;
        }

        if (insertedPost?.id && evidenceUrl) {
          await supabase.from("post_media").insert({
            post_id: insertedPost.id,
            media_type: "image",
            url: evidenceUrl,
            alt_text: trimmedDesc.slice(0, 100),
            has_verified_badge: false,
          });
        }

        dispatchPostCreatedEvent();
        setDescription("");
        setLocation("");
        setUploadedFileName(null);
        setPreviewNotice(
          "Published to Supabase Realtime Feed! Your community post is now live.",
        );
        return;
      } finally {
        setIsSubmitting(false);
      }
    }

    if (mode === "impact" && supabase) {
      setIsSubmitting(true);
      try {
        await ensureCurrentUserProfile(supabase, user);
        const computedTitle =
          title.trim() ||
          `${category} Action (${location.trim() || country})`;

        const { error } = await supabase.from("impact_submissions").insert({
          user_id: user.id,
          title: computedTitle.slice(0, 150),
          description: trimmedDesc,
          category,
          country,
          activity_date: activityDate,
          location: location.trim() ? `${location.trim()}, ${country}` : country,
          evidence_url: evidenceUrl,
          status: "submitted",
          reward_xp: rewardXp,
        });

        if (error) {
          setPreviewNotice(`Could not submit impact evidence: ${error.message}`);
          return;
        }

        dispatchImpactSubmittedEvent();
        setTitle("");
        setDescription("");
        setLocation("");
        setUploadedFileName(null);
        setPreviewNotice(
          `Impact Evidence submitted to Supabase Verifier Queue (+${rewardXp} XP upon approval)! Open the Verification Review panel below to approve it live.`,
        );
        return;
      } finally {
        setIsSubmitting(false);
      }
    }

    setPreviewNotice(
      mode === "impact"
        ? "Impact Submission queued: Evidence requires human verifier approval before awarding Environmental XP."
        : "Community Post published locally.",
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setPreviewNotice(null);
        onOpenChange(nextOpen);
      }}
      title="Share an Environmental Action"
      description="Choose between an ordinary community post or a verified environmental impact submission."
    >
      <form onSubmit={(e) => void handlePreviewSubmit(e)} className="space-y-4">
        {/* Mode Selector Tabs matching reference image */}
        <div
          role="tablist"
          aria-label="Submission mode"
          className="grid grid-cols-1 gap-2.5 sm:grid-cols-2"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "post"}
            onClick={() => {
              setMode("post");
              setPreviewNotice(null);
            }}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50 cursor-pointer",
              mode === "post"
                ? "border-primary bg-secondary/45 text-foreground shadow-2xs"
                : "border-border bg-background/70 text-muted-foreground hover:text-foreground",
            )}
          >
            <MessageSquare className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span>Community Post</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === "impact"}
            onClick={() => {
              setMode("impact");
              setPreviewNotice(null);
            }}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50 cursor-pointer",
              mode === "impact"
                ? "border-primary bg-secondary/45 text-foreground shadow-2xs"
                : "border-border bg-background/70 text-muted-foreground hover:text-foreground",
            )}
          >
            <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="text-left leading-tight">
              <strong className="block text-foreground">Impact Submission</strong>
              <span className="text-[11px] font-normal text-muted-foreground">
                (Get points &amp; verified · +{rewardXp} XP)
              </span>
            </span>
          </button>
        </div>

        {!isSignedIn ? (
          <div className="flex flex-col gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs text-amber-950 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
              <span>
                You are browsing in <strong>Guest Preview Mode</strong>. Sign in to create posts or
                submit environmental impact evidence.
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/login"
                className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-xs font-semibold text-white hover:bg-primary-dark"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-8 items-center rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground hover:bg-background"
              >
                Sign Up
              </Link>
            </div>
          </div>
        ) : null}

        {mode === "impact" ? (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label
                htmlFor="action-title"
                className="mb-1 block text-xs font-semibold text-foreground"
              >
                Impact Activity Title
              </label>
              <Input
                id="action-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g., Collected 12kg of plastic litter along Riverfront Park"
              />
            </div>

            <div>
              <label
                htmlFor="action-date"
                className="mb-1 block text-xs font-semibold text-foreground"
              >
                Activity Date
              </label>
              <Input
                id="action-date"
                type="date"
                value={activityDate}
                onChange={(event) => setActivityDate(event.target.value)}
              />
            </div>
          </div>
        ) : null}

        {/* Photo / Video Evidence Selector + Supabase Storage Upload */}
        <div className="rounded-2xl border border-border bg-background/80 p-3.5 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <ImageIcon className="h-4 w-4 text-primary" aria-hidden="true" />
              <Video className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>Upload photos or videos (max 5 · 100 MB each)</span>
            </div>
            <Badge variant={mode === "impact" ? "verified" : "prototype"}>
              {mode === "impact"
                ? `private-impact-evidence · +${rewardXp} XP`
                : "public-post-media"}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label
              htmlFor="action-media-upload"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground hover:bg-background cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span>{uploadingFile ? "Uploading..." : "Choose Photo / Video File"}</span>
              <input
                id="action-media-upload"
                type="file"
                accept="image/*,video/*"
                onChange={(e) => void handleFileSelect(e)}
                className="sr-only"
              />
            </label>
            {uploadedFileName ? (
              <span className="text-xs font-medium text-primary-dark truncate">
                Attached: {uploadedFileName}
              </span>
            ) : null}
          </div>

          <div className="grid grid-cols-5 gap-2">
            {INITIATIVE_BANNERS.map((banner) => {
              const selected = evidenceUrl === banner.value;
              return (
                <button
                  key={banner.value}
                  type="button"
                  onClick={() => setEvidenceUrl(banner.value)}
                  className={cn(
                    "relative h-14 overflow-hidden rounded-xl border-2 transition-all cursor-pointer",
                    selected
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border opacity-75 hover:opacity-100",
                  )}
                  title={banner.label}
                >
                  <Image
                    src={banner.value}
                    alt={banner.label}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Description matching reference image */}
        <div>
          <label htmlFor="action-description" className="sr-only">
            Action Description
          </label>
          <Textarea
            id="action-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe what you did... (e.g., cleaned a park, recycled waste, planted trees)"
            rows={3}
          />
        </div>

        {/* Category, Country & Location */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <div>
            <label
              htmlFor="action-category"
              className="mb-1 flex items-center justify-between text-xs font-semibold text-foreground"
            >
              <span>Category</span>
              {mode === "impact" ? (
                <span className="inline-flex items-center gap-0.5 text-[11px] text-primary-dark">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />+{rewardXp} XP
                </span>
              ) : null}
            </label>
            <select
              id="action-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-10 w-full rounded-[8px] border border-border bg-surface px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <option value="Community Cleanup">Community Cleanup (+75 XP)</option>
              <option value="Tree Planting">Tree Planting (+100 XP)</option>
              <option value="Ocean Conservation">Ocean Conservation (+75 XP)</option>
              <option value="Wildlife Conservation">Wildlife Conservation (+75 XP)</option>
              <option value="Recycling Initiatives">Recycling Initiatives (+50 XP)</option>
              <option value="Sustainable Living">Sustainable Living (+50 XP)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="action-country"
              className="mb-1 block text-xs font-semibold text-foreground"
            >
              Country / Region
            </label>
            <select
              id="action-country"
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              className="h-10 w-full rounded-[8px] border border-border bg-surface px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              {WORLD_COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="action-location"
              className="mb-1 block text-xs font-semibold text-foreground"
            >
              Add location (optional)
            </label>
            <div className="relative">
              <MapPin
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="action-location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Add location (optional)"
                className="pl-9"
              />
            </div>
          </div>
        </div>

        {previewNotice ? (
          <div
            role="status"
            className="flex items-start gap-2 rounded-xl border border-primary/40 bg-secondary/30 p-3 text-xs text-foreground"
          >
            {isSignedIn ? (
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-primary-dark"
                aria-hidden="true"
              />
            ) : (
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
            )}
            <span>{previewNotice}</span>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3 border-t border-border pt-3.5">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setPreviewNotice(null);
              onOpenChange(false);
            }}
            className="w-full"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting
              ? "Submitting..."
              : mode === "impact"
                ? `Submit for Verification (+${rewardXp} XP)`
                : "Publish Post"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
