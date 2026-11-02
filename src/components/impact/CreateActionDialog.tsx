"use client";

import { useAuth } from "@clerk/nextjs";
import {
  CheckCircle2,
  Image as ImageIcon,
  Info,
  Lock,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/utils";

export interface CreateActionDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly defaultMode?: "post" | "impact";
}

/**
 * Matches the "Share an Environmental Action" modal in the bottom-left panel of
 * references/ecoshare-ui-reference.png:
 * - Segmented mode tabs ("Community Post" vs "Impact Submission (Get points & verified)")
 * - Photo/video upload box ("Upload photos or videos (max 5 · 100 MB each)")
 * - Description textarea ("Describe what you did... (e.g., cleaned a park, recycled waste, planted trees)")
 * - Optional location row ("Add location (optional)")
 * - Cancel and "Submit for Verification" footer actions
 */
export function CreateActionDialog({
  open,
  onOpenChange,
  defaultMode = "impact",
}: CreateActionDialogProps) {
  const { isSignedIn } = useAuth();
  const [mode, setMode] = useState<"post" | "impact">(defaultMode);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("Community Cleanup");
  const [previewNotice, setPreviewNotice] = useState<string | null>(null);

  function handlePreviewSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isSignedIn) {
      setPreviewNotice(
        "Sign in required: Please sign in via Clerk (/login) to submit posts or environmental evidence.",
      );
      return;
    }

    setPreviewNotice(
      mode === "impact"
        ? "Milestone 1 UI Preview: Impact Submission workflow validated locally. Private evidence upload (private-impact-evidence) and verifier queue persistence will be enabled in Milestone 4."
        : "Milestone 1 UI Preview: Community Post form validated locally. Database persistence will be enabled in Milestone 2.",
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
      <form onSubmit={handlePreviewSubmit} className="space-y-4">
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
                (Get points &amp; verified)
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

        {/* Photo / Video Upload Placeholder matching reference image */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-background/80 px-4 py-6 text-center">
          <div className="mb-2 flex items-center justify-center gap-2 text-muted-foreground">
            <ImageIcon className="h-5 w-5" aria-hidden="true" />
            <Video className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            Upload photos or videos
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            (max 5 · 100 MB each)
          </p>
          <div className="mt-2">
            <Badge variant="prototype">
              {mode === "impact"
                ? "Target Bucket: private-impact-evidence"
                : "Target Bucket: public-post-media"}
            </Badge>
          </div>
        </div>

        {/* Description matching reference image */}
        <div>
          <label
            htmlFor="action-description"
            className="sr-only"
          >
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

        {/* Category & Location matching reference image */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="action-category"
              className="mb-1 block text-xs font-semibold text-foreground"
            >
              Environmental Category
            </label>
            <select
              id="action-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-10 w-full rounded-[8px] border border-border bg-surface px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <option value="Community Cleanup">Community Cleanup</option>
              <option value="Tree Planting">Tree Planting</option>
              <option value="Recycling Initiatives">Recycling Initiatives</option>
              <option value="Ocean Conservation">Ocean Conservation</option>
              <option value="Sustainable Living">Sustainable Living</option>
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
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-dark" aria-hidden="true" />
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
          <Button type="submit" variant="primary" className="w-full">
            {mode === "impact" ? "Submit for Verification" : "Publish Post"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
