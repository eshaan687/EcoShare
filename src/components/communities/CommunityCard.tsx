"use client";

import { Globe, Users } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { PrototypeCommunity } from "@/lib/mock/prototype-data";
import { cn } from "@/lib/utils";

export interface CommunityCardProps {
  readonly community: PrototypeCommunity;
  readonly className?: string;
}

export function CommunityCard({ community, className }: CommunityCardProps) {
  const [joinedPreview, setJoinedPreview] = useState(false);

  return (
    <Card className={cn("overflow-hidden flex flex-col", className)}>
      <div className="relative h-32 w-full overflow-hidden border-b border-border">
        <Image
          src={community.bannerSrc}
          alt={community.name}
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          className="object-cover"
        />
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <Badge variant="verified">{community.category}</Badge>
          <Badge variant="prototype">Sample Community</Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-foreground">{community.name}</h3>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Globe className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Public
            </span>
          </div>

          <p className="mt-1.5 text-sm text-muted-foreground">{community.description}</p>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Users className="h-4 w-4 text-primary" aria-hidden="true" />
            {(community.membersCount + (joinedPreview ? 1 : 0)).toLocaleString()} members
          </span>

          <Button
            type="button"
            size="sm"
            variant={joinedPreview ? "secondary" : "primary"}
            pill
            onClick={() => setJoinedPreview((prev) => !prev)}
            aria-pressed={joinedPreview}
          >
            {joinedPreview ? "Joined (Preview)" : "Join Community"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
