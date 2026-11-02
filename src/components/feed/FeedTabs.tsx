"use client";

import { CheckCircle2 } from "lucide-react";

import {
  ECOSHARE_FEED_TABS,
  type EcoShareFeedTabId,
} from "@/lib/constants/design-tokens";
import { cn } from "@/lib/utils";

export interface FeedTabsProps {
  readonly activeTab: EcoShareFeedTabId;
  readonly onTabChange: (tab: EcoShareFeedTabId) => void;
  readonly className?: string;
}

/**
 * Matches the feed tab bar in references/ecoshare-ui-reference.png:
 * "For You", "Following", and "Verified Impact" (with green checkmark icon).
 */
export function FeedTabs({ activeTab, onTabChange, className }: FeedTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Feed filter tabs"
      className={cn(
        "flex items-center gap-2 border-b border-border bg-surface px-4 pt-2 rounded-t-[16px]",
        className,
      )}
    >
      {ECOSHARE_FEED_TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              isActive
                ? "text-primary-dark"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.id === "verified-impact" ? (
              <CheckCircle2
                className={cn(
                  "h-4 w-4",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
                aria-hidden="true"
              />
            ) : null}
            <span>{tab.label}</span>
            {isActive ? (
              <span
                className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary"
                aria-hidden="true"
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
