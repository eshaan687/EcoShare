"use client";

import { Trophy } from "lucide-react";
import { useState } from "react";

import { ChallengeCard } from "@/components/challenges/ChallengeCard";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PROTOTYPE_CHALLENGES } from "@/lib/mock/prototype-data";
import { cn } from "@/lib/utils";

const CHALLENGE_CATEGORIES = [
  "All",
  "Community Cleanup",
  "Tree Planting",
  "Recycling Initiatives",
] as const;

export default function ChallengesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const visibleChallenges = PROTOTYPE_CHALLENGES.filter(
    (challenge) =>
      selectedCategory === "All" || challenge.category === selectedCategory,
  );

  return (
    <div className="space-y-4">
      <Card className="p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50 text-primary-dark">
              <Trophy className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Environmental Challenges
              </h1>
              <p className="text-xs text-muted-foreground">
                Join structured challenges and submit real-world evidence to earn verified XP
              </p>
            </div>
          </div>
          <Badge variant="prototype">Milestone 4 Preview</Badge>
        </div>

        <div
          role="group"
          aria-label="Filter challenges by category"
          className="flex flex-wrap items-center gap-2 pt-1"
        >
          {CHALLENGE_CATEGORIES.map((category) => {
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
        {visibleChallenges.map((challenge) => (
          <ChallengeCard key={challenge.id} challenge={challenge} />
        ))}
      </div>
    </div>
  );
}
