"use client";

import { Check, Inbox, MoreHorizontal, Sparkles, X } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { PrototypeVerificationReviewItem } from "@/lib/mock/prototype-data";
import { cn } from "@/lib/utils";

export interface VerificationReviewCardProps {
  readonly items: readonly PrototypeVerificationReviewItem[];
  readonly onReviewDecision?: (
    submissionId: string,
    decision: "approved" | "rejected",
  ) => Promise<void> | void;
  readonly isRealtimeConnected?: boolean;
  readonly className?: string;
}

/**
 * Matches the "Verification Review" admin/verifier panel in the bottom-second-from-left of
 * references/ecoshare-ui-reference.png and connects to Supabase Realtime impact_submissions
 * + review_impact_submission RPC for live human verification and XP awarding.
 */
export function VerificationReviewCard({
  items,
  onReviewDecision,
  isRealtimeConnected = false,
  className,
}: VerificationReviewCardProps) {
  const [activeQueueTab, setActiveQueueTab] = useState<
    "pending" | "approved" | "rejected"
  >("pending");
  const [localDecisionById, setLocalDecisionById] = useState<
    Record<string, "pending" | "approved" | "rejected">
  >({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  const itemsWithEffectiveStatus = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        effectiveStatus: localDecisionById[item.id] ?? item.status,
      })),
    [items, localDecisionById],
  );

  const pendingCount = itemsWithEffectiveStatus.filter(
    (item) => item.effectiveStatus === "pending",
  ).length;
  const approvedCount = itemsWithEffectiveStatus.filter(
    (item) => item.effectiveStatus === "approved",
  ).length;
  const rejectedCount = itemsWithEffectiveStatus.filter(
    (item) => item.effectiveStatus === "rejected",
  ).length;

  const filteredItems = useMemo(() => {
    const matching = itemsWithEffectiveStatus.filter(
      (item) => item.effectiveStatus === activeQueueTab,
    );
    if (matching.length === 0 && !onReviewDecision && itemsWithEffectiveStatus.length > 0) {
      return itemsWithEffectiveStatus;
    }
    return matching;
  }, [itemsWithEffectiveStatus, activeQueueTab, onReviewDecision]);

  async function handleDecision(
    item: PrototypeVerificationReviewItem,
    decision: "approved" | "rejected",
  ) {
    setLocalDecisionById((prev) => ({
      ...prev,
      [item.id]: decision,
    }));

    const xpAmount = item.rewardXp ?? 75;
    if (decision === "approved") {
      setFeedbackBanner(
        `Verified "${item.activityTitle}"! Awarded +${xpAmount} Environmental XP to ${item.submitterName} & published Verified Impact post.`,
      );
    } else {
      setFeedbackBanner(
        `Marked "${item.activityTitle}" as rejected. No Environmental XP was awarded.`,
      );
    }

    if (onReviewDecision) {
      setBusyId(item.id);
      try {
        await onReviewDecision(item.id, decision);
      } finally {
        setBusyId(null);
      }
    }
  }

  return (
    <Card className={cn("p-5 shadow-xs", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
        <div className="flex items-center gap-2">
          <Inbox className="h-4 w-4 text-foreground" aria-hidden="true" />
          <h3 className="text-base font-bold text-foreground">Verification Review</h3>
        </div>
        <Badge variant={isRealtimeConnected ? "verified" : "prototype"}>
          {isRealtimeConnected ? "Live Verifier Queue" : "Verifier Queue"}
        </Badge>
      </div>

      {feedbackBanner ? (
        <div
          role="status"
          className="mb-3.5 flex items-center justify-between gap-2 rounded-xl border border-primary/30 bg-secondary/40 px-3.5 py-2 text-xs font-medium text-primary-dark"
        >
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            {feedbackBanner}
          </span>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground"
            aria-label="Dismiss review notification"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {/* Queue Filter Tabs matching reference image: Pending | Approved | Rejected */}
      <div
        role="tablist"
        aria-label="Verification review status tabs"
        className="mb-4 grid grid-cols-3 gap-1.5 rounded-xl bg-background p-1"
      >
        {(
          [
            { id: "pending", label: `Pending (${pendingCount})` },
            { id: "approved", label: `Approved (${approvedCount})` },
            { id: "rejected", label: `Rejected (${rejectedCount})` },
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

      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-border/80 bg-surface p-6 text-center">
          <p className="text-sm font-semibold text-foreground">
            No {activeQueueTab} impact submissions right now
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {activeQueueTab === "pending"
              ? "Click \"+ Submit Impact Evidence\" above to submit a new real-world environmental action to this live queue."
              : `Switch tabs above to inspect other submissions.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const currentStatus = item.effectiveStatus;
            const isBusy = busyId === item.id;
            const rewardXp = item.rewardXp ?? 75;

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-border/80 bg-surface p-4 shadow-2xs"
              >
                <div className="flex items-start gap-3.5">
                  <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl border border-border/70">
                    <Image
                      src={item.thumbnailSrc || "/images/cleanup-park.png"}
                      alt={item.activityTitle}
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          Submitted by {item.submitterName}{" "}
                          <span className="font-normal text-muted-foreground">
                            ({item.submitterHandle})
                          </span>
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {item.submittedRelative} · {item.category}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="verified">+{rewardXp} XP</Badge>
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
                            ? onReviewDecision
                              ? "Approved"
                              : "Preview: Approved"
                            : currentStatus === "rejected"
                              ? onReviewDecision
                                ? "Rejected"
                                : "Preview: Rejected"
                              : "Pending Review"}
                        </Badge>
                        <MoreHorizontal
                          className="h-4 w-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                      </div>
                    </div>

                    <p className="pt-1 text-sm font-bold text-foreground">
                      {item.activityTitle}
                    </p>
                    {item.description ? (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                    ) : null}
                    <p className="text-xs font-medium text-muted-foreground">
                      📍 {item.location}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={isBusy || currentStatus === "approved"}
                    onClick={() => void handleDecision(item, "approved")}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-primary-dark disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 cursor-pointer"
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                    <span>
                      {currentStatus === "approved"
                        ? `Approved (+${rewardXp} XP)`
                        : `Approve (+${rewardXp} XP)`}
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={isBusy || currentStatus === "rejected"}
                    onClick={() => void handleDecision(item, "rejected")}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-error/30 bg-error/10 px-4 text-xs font-semibold text-error transition-colors hover:bg-error/20 disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-error/50 cursor-pointer"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    <span>{currentStatus === "rejected" ? "Rejected" : "Reject"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
