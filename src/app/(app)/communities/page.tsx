"use client";

import { Users } from "lucide-react";
import { useState } from "react";

import { CommunityCard } from "@/components/communities/CommunityCard";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PROTOTYPE_COMMUNITIES } from "@/lib/mock/prototype-data";
import { cn } from "@/lib/utils";

const COMMUNITY_CATEGORIES = [
  "All",
  "Ocean Conservation",
  "Tree Planting",
  "Recycling Initiatives",
] as const;

export default function CommunitiesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const visibleCommunities = PROTOTYPE_COMMUNITIES.filter(
    (community) =>
      selectedCategory === "All" || community.category === selectedCategory,
  );

  return (
    <div className="space-y-4">
      <Card className="p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50 text-primary-dark">
              <Users className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Environmental Communities
              </h1>
              <p className="text-xs text-muted-foreground">
                Collaborate with local and global groups dedicated to verified ecological action
              </p>
            </div>
          </div>
          <Badge variant="prototype">Milestone 3 Preview</Badge>
        </div>

        <div
          role="group"
          aria-label="Filter communities by category"
          className="flex flex-wrap items-center gap-2 pt-1"
        >
          {COMMUNITY_CATEGORIES.map((category) => {
            const active = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "bg-primary text-white shadow-xs"
                    : "border border-border bg-background text-muted-foreground hover:text-foreground",
                )}
              >
                {category}
              </button>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {visibleCommunities.map((community) => (
          <CommunityCard key={community.id} community={community} />
        ))}
      </div>
    </div>
  );
}
