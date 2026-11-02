import { Lock, MessageSquare } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export default function MessagesPrototypePage() {
  return (
    <div className="space-y-4">
      <Card className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50 text-primary-dark">
              <MessageSquare className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Direct Messages</h1>
              <p className="text-xs text-muted-foreground">
                Private 1:1 member conversations and Supabase Realtime delivery
              </p>
            </div>
          </div>
          <Badge variant="prototype">Milestone 5 Prototype Placeholder</Badge>
        </div>

        <div className="rounded-xl border border-border bg-background/70 p-5 space-y-3">
          <div className="flex items-start gap-2.5">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary-dark" aria-hidden="true" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                No conversations are simulated or persisted in Milestone 1
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Real-time 1:1 messaging (`conversations`, `conversation_participants`,
                and `messages` tables protected by participant-only Row Level Security)
                is scheduled for <strong>Milestone 5 — Notifications and Direct Messaging</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Link
              href="/home"
              className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-xs font-semibold text-white hover:bg-primary-dark"
            >
              Return to Home Feed
            </Link>
            <Link
              href="/communities"
              className="inline-flex h-9 items-center rounded-full border border-border bg-surface px-4 text-xs font-semibold text-foreground hover:bg-background"
            >
              Browse Communities
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
