"use client";

import { ShieldCheck } from "lucide-react";

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
 * "For You", "Following", and "Verified Impact" (with green shield-check icon).
 */
export function FeedTabs({ activeTab, onTabChange, className }: FeedTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Feed filter tabs"
      className={cn(
        "flex items-center gap-4 border-b border-border/80 bg-surface px-5 pt-2 rounded-t-[16px]",
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
              "relative inline-flex items-center gap-1.5 px-2 py-2.5 text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50 cursor-pointer",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.id === "verified-impact" ? (
              <ShieldCheck
                className="h-4 w-4 text-primary"
                aria-hidden="true"
              />
            ) : null}
            <span>{tab.label}</span>
            {isActive ? (
              <span
                className="absolute inset-x-0 bottom-0 h-[2.5px] rounded-full bg-primary"
                aria-hidden="true"
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
