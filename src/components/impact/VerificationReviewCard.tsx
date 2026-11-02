"use client";

import { Check, MapPin, ShieldAlert, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { PrototypeVerificationReviewItem } from "@/lib/mock/prototype-data";
import { cn } from "@/lib/utils";

export interface VerificationReviewCardProps {
  readonly items: readonly PrototypeVerificationReviewItem[];
  readonly className?: string;
}

/**
 * Matches the "Verification Review" admin/verifier panel in the bottom-left/center of
 * references/ecoshare-ui-reference.png (Pending (12) | Approved | Rejected tabs,
 * Sofia M. Cleanup Activity preview, Approve & Reject buttons).
 *
 * Strictly labeled as a Milestone 1 UI preview: real verifier role checks and
 * atomic `approve_impact_submission` RPC execution are wired in Milestone 4.
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
    <Card className={cn("p-5", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-base font-bold text-foreground">Verification Review</h3>
          <p className="text-xs text-muted-foreground">
            Verifier workflow preview (Database RPC enforced in Milestone 4)
          </p>
        </div>
        <Badge variant="prototype">Verifier Queue Preview</Badge>
      </div>

      {/* Queue Filter Tabs matching reference image: Pending (12) | Approved | Rejected */}
      <div
        role="tablist"
        aria-label="Verification review status tabs"
        className="mb-4 flex items-center gap-1.5 border-b border-border pb-2"
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
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              activeQueueTab === tab.id
                ? "bg-primary text-white"
                : "text-muted-foreground hover:bg-background hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {firstItem ? (
        <div className="rounded-xl border border-border bg-background/60 p-3.5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative h-20 w-full overflow-hidden rounded-xl border border-border sm:w-28 shrink-0">
              <Image
                src={firstItem.thumbnailSrc}
                alt={firstItem.activityTitle}
                fill
                sizes="112px"
                className="object-cover"
              />
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <p className="text-sm font-bold text-foreground">
                  {firstItem.submitterName}{" "}
                  <span className="font-normal text-xs text-muted-foreground">
                    · {firstItem.submittedRelative}
                  </span>
                </p>
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
              </div>
              <p className="text-xs font-semibold text-primary-dark">{firstItem.activityTitle}</p>
              <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                {firstItem.location}
              </p>
            </div>
          </div>

          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <ShieldAlert className="h-3.5 w-3.5 text-primary-dark" aria-hidden="true" />
              Local UI state only — no XP awarded in Milestone 1
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="primary"
                onClick={() =>
                  setLocalDecisionById((prev) => ({
                    ...prev,
                    [firstItem.id]: "approved",
                  }))
                }
              >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                Approve
              </Button>
              <Button
                type="button"
                size="sm"
                variant="danger"
                onClick={() =>
                  setLocalDecisionById((prev) => ({
                    ...prev,
                    [firstItem.id]: "rejected",
                  }))
                }
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                Reject
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
