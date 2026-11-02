"use client";

import { Check, Inbox, MoreHorizontal, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { PrototypeVerificationReviewItem } from "@/lib/mock/prototype-data";
import { cn } from "@/lib/utils";

export interface VerificationReviewCardProps {
  readonly items: readonly PrototypeVerificationReviewItem[];
  readonly className?: string;
}

/**
 * Matches the "Verification Review" admin/verifier panel in the bottom-second-from-left of
 * references/ecoshare-ui-reference.png:
 * - Pill tabs: Pending (12) | Approved | Rejected
 * - Sofia M. Cleanup Activity card with realistic park cleanup photo
 * - Side-by-side "✓ Approve" (green) and "✕ Reject" (soft red) buttons
 */
export function VerificationReviewCard({ items, className }: VerificationReviewCardProps) {
  const [activeQueueTab, setActiveQueueTab] = useState<"pending" | "approved" | "rejected">(
    "pending",
  );
  const [localDecisionById, setLocalDecisionById] = useState<
    Record<string, "pending" | "approved" | "rejected">
  >({});

  const firstItem = items[0];
  const currentStatus = firstItem
    ? (localDecisionById[firstItem.id] ?? firstItem.status)
    : "pending";

  return (
    <Card className={cn("p-5 shadow-xs", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
        <div className="flex items-center gap-2">
          <Inbox className="h-4 w-4 text-foreground" aria-hidden="true" />
          <h3 className="text-base font-bold text-foreground">Verification Review</h3>
        </div>
        <Badge variant="prototype">Verifier Queue Preview</Badge>
      </div>

      {/* Queue Filter Tabs matching reference image: Pending (12) | Approved | Rejected */}
      <div
        role="tablist"
        aria-label="Verification review status tabs"
        className="mb-4 grid grid-cols-3 gap-1.5 rounded-xl bg-background p-1"
      >
        {(
          [
            { id: "pending", label: "Pending (12)" },
            { id: "approved", label: "Approved" },
            { id: "rejected", label: "Rejected" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeQueueTab === tab.id}
            onClick={() => setActiveQueueTab(tab.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50 cursor-pointer",
              activeQueueTab === tab.id
                ? "bg-secondary/75 text-primary-dark shadow-2xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {firstItem ? (
        <div className="rounded-2xl border border-border/80 bg-surface p-4 shadow-2xs">
          <div className="flex items-start gap-3.5">
            <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl border border-border/70">
              <Image
                src={firstItem.thumbnailSrc}
                alt={firstItem.activityTitle}
                fill
                sizes="112px"
                className="object-cover"
              />
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    Submitted by {firstItem.submitterName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {firstItem.submittedRelative}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant={
                      currentStatus === "approved"
                        ? "verified"
                        : currentStatus === "rejected"
                          ? "error"
                          : "warning"
                    }
                  >
                    {currentStatus === "approved"
                      ? "Preview: Approved"
                      : currentStatus === "rejected"
                        ? "Preview: Rejected"
                        : "Pending Review"}
                  </Badge>
                  <MoreHorizontal
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>
              </div>

              <p className="pt-1 text-sm font-bold text-foreground">
                {firstItem.activityTitle}
              </p>
              <p className="text-xs text-muted-foreground">{firstItem.location}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() =>
                setLocalDecisionById((prev) => ({
                  ...prev,
                  [firstItem.id]: "approved",
                }))
              }
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-primary-dark outline-none focus-visible:ring-2 focus-visible:ring-primary/50 cursor-pointer"
            >
              <Check className="h-4 w-4" aria-hidden="true" />
              <span>Approve</span>
            </button>
            <button
              type="button"
              onClick={() =>
                setLocalDecisionById((prev) => ({
                  ...prev,
                  [firstItem.id]: "rejected",
                }))
              }
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-error/30 bg-error/10 px-4 text-xs font-semibold text-error transition-colors hover:bg-error/20 outline-none focus-visible:ring-2 focus-visible:ring-error/50 cursor-pointer"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              <span>Reject</span>
            </button>
          </div>
          <p className="mt-2.5 text-center text-[11px] text-muted-foreground">
            Local UI preview state only — no XP awarded or persisted in Milestone 1
          </p>
        </div>
      ) : null}
    </Card>
  );
}
