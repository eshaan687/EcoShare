import { Bell, CheckCircle2, Sparkles, Users } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

const SAMPLE_NOTIFICATION_PREVIEWS = [
  {
    id: "notif-1",
    title: "Sample Verification Update (Preview Only)",
    description:
      "Your Fundidora Park cleanup submission would appear here once reviewed by an authorised verifier in Milestone 4.",
    timeLabel: "Sample · 2h ago",
    icon: CheckCircle2,
  },
  {
    id: "notif-2",
    title: "Sample Challenge Milestone (Preview Only)",
    description:
      "Clean Oceans Challenge community progress notifications will be delivered via Supabase Realtime in Milestone 5.",
    timeLabel: "Sample · 5h ago",
    icon: Sparkles,
  },
  {
    id: "notif-3",
    title: "Sample Community Activity (Preview Only)",
    description:
      "Beach Cleanup Volunteers posted a new weekend coastal cleanup schedule.",
    timeLabel: "Sample · 1d ago",
    icon: Users,
  },
] as const;

export default function NotificationsPrototypePage() {
  return (
    <div className="space-y-4">
      <Card className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50 text-primary-dark">
              <Bell className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Notifications</h1>
              <p className="text-xs text-muted-foreground">
                Activity alerts for likes, comments, follows, and impact verification decisions
              </p>
            </div>
          </div>
          <Badge variant="prototype">Milestone 5 Prototype Placeholder</Badge>
        </div>

        <p className="text-xs text-muted-foreground">
          The 3 items below are static UI layout placeholders corresponding to the
          sidebar badge (`3`) in the EcoShare design reference. Live notification
          persistence and read-state tracking will be implemented in{" "}
          <strong>Milestone 5</strong>.
        </p>

        <div className="space-y-2.5">
          {SAMPLE_NOTIFICATION_PREVIEWS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background/60 p-3.5"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/50 text-primary-dark">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{item.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {item.timeLabel}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
