"use client";

import { Plus, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { LevelCard } from "@/components/gamification/LevelCard";
import { CreateActionDialog } from "@/components/impact/CreateActionDialog";
import { VerificationBadge } from "@/components/impact/VerificationBadge";
import { VerificationReviewCard } from "@/components/impact/VerificationReviewCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  PROTOTYPE_USER_PROFILE,
  PROTOTYPE_VERIFICATION_QUEUE,
} from "@/lib/mock/prototype-data";

export default function ImpactPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      <Card className="p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50 text-primary-dark">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">
                My Environmental Impact
              </h1>
              <Badge variant="prototype">Milestone 4 Preview</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Submit real-world environmental evidence and track human verification status
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="primary"
          pill
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Submit Impact Evidence
        </Button>
      </Card>

      {/* Level Progression Card matching reference image */}
      <LevelCard totalXp={PROTOTYPE_USER_PROFILE.totalXp} />

      {/* Verification State Machine Preview */}
      <Card className="p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-foreground">
            Impact Verification Lifecycle
          </h2>
          <Badge variant="prototype">Workflow Architecture</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          In EcoShare, likes and ordinary posts never grant Environmental XP. Every
          impact submission progresses through this verified state machine:
        </p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-background/60 p-3">
            <p className="text-xs font-bold text-foreground">1. Draft</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Prepare photos/videos, category, and location metadata.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background/60 p-3">
            <p className="text-xs font-bold text-foreground">2. Submitted</p>
            <p className="mt-1 text-[11px] text-muted-foreground break-words">
              Evidence stored privately in <code>private-impact-evidence</code>.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background/60 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-foreground">3. Under Review</p>
              <VerificationBadge status="pending" label="Pending" />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Inspected by authorised verifiers via short-lived signed URLs.
            </p>
          </div>
          <div className="rounded-xl border border-secondary bg-secondary/20 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-primary-dark">4. Approved</p>
              <VerificationBadge status="verified" label="Verified" />
            </div>
            <p className="mt-1 text-[11px] text-primary-dark">
              Atomic database transaction awards XP and updates level/badges.
            </p>
          </div>
        </div>
      </Card>

      {/* Verifier Queue Review Component from references/ecoshare-ui-reference.png */}
      <VerificationReviewCard items={PROTOTYPE_VERIFICATION_QUEUE} />

      <CreateActionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultMode="impact"
      />
    </div>
  );
}
