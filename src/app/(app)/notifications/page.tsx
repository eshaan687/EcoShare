"use client";

import {
  Bell,
  Check,
  CheckCircle2,
  Heart,
  MessageCircle,
  Sparkles,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useSafeUser } from "@/lib/auth/clerk-hooks";
import { useSafeSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface NotificationItem {
  readonly id: string;
  readonly type: string;
  readonly title: string;
  readonly description: string;
  readonly timeLabel: string;
  readonly linkUrl: string;
  readonly isRead: boolean;
}

interface SupabaseNotificationRow {
  id: string;
  type: string;
  title: string;
  message: string;
  link_url: string;
  is_read: boolean;
  created_at: string;
}

function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getNotificationIcon(type: string) {
  if (type === "like") return Heart;
  if (type === "comment" || type === "reply" || type === "message_request" || type === "message_accepted") {
    return MessageCircle;
  }
  if (type === "follow") return UserPlus;
  if (type === "impact_approved" || type === "badge_awarded") return Sparkles;
  return CheckCircle2;
}

export default function NotificationsPage() {
  const supabase = useSafeSupabaseClient();
  const { user, isSignedIn } = useSafeUser();
  const userId = user?.id ?? null;

  const [notifications, setNotifications] = useState<
    readonly NotificationItem[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!supabase || !userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", userId)
        .order("created_at", { ascending: false })
        .limit(30);

      if (!error && data) {
        const rows = data as unknown as SupabaseNotificationRow[];
        setNotifications(
          rows.map((r) => ({
            id: r.id,
            type: r.type,
            title: r.title,
            description: r.message,
            timeLabel: formatRelativeTime(r.created_at),
            linkUrl: r.link_url || "/home",
            isRead: r.is_read,
          })),
        );
      }
    } finally {
      setLoading(false);
    }
  }, [supabase, userId]);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(async () => {
      if (!cancelled) {
        await fetchNotifications();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [fetchNotifications]);

  useEffect(() => {
    if (!supabase || !userId) return;

    const channel = supabase
      .channel("ecoshare-realtime-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          void fetchNotifications();
        },
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === "SUBSCRIBED");
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, userId, fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  async function handleMarkRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    if (supabase && isSignedIn && userId) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id)
        .eq("recipient_id", userId);
    }
  }

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    if (supabase && isSignedIn && userId) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("recipient_id", userId)
        .eq("is_read", false);
    }
  }

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
                Real-time alerts for likes, comments, follows, message requests, and impact verification decisions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={unreadCount > 0 ? "verified" : "neutral"}>
              {unreadCount} Unread
            </Badge>
            {isRealtimeConnected ? (
              <Badge variant="verified">Realtime</Badge>
            ) : null}
            {unreadCount > 0 ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                pill
                onClick={() => void handleMarkAllRead()}
              >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                Mark all read
              </Button>
            ) : null}
          </div>
        </div>

        {!isSignedIn ? (
          <div className="rounded-xl border border-border bg-background/60 p-6 text-center space-y-2">
            <p className="text-sm font-bold text-foreground">
              Sign in to view your notifications
            </p>
            <p className="text-xs text-muted-foreground">
              Receive real-time alerts when people like, comment, follow you, or review your environmental impact submissions.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex h-8 items-center rounded-full bg-primary px-4 text-xs font-semibold text-white hover:bg-primary-dark"
              >
                Log In
              </Link>
            </div>
          </div>
        ) : loading && notifications.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            Loading notifications...
          </p>
        ) : notifications.length === 0 ? (
          <div className="rounded-xl border border-border bg-background/60 p-8 text-center space-y-2">
            <p className="text-sm font-bold text-foreground">
              No notifications yet
            </p>
            <p className="text-xs text-muted-foreground">
              When members interact with your posts, follow you, send a message request, or verify your impact evidence, alerts will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {notifications.map((item) => {
              const Icon = getNotificationIcon(item.type);
              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-start justify-between gap-3 rounded-xl border p-3.5 transition-colors",
                    item.isRead
                      ? "border-border bg-background/50 opacity-80"
                      : "border-primary/35 bg-secondary/20",
                  )}
                >
                  <Link
                    href={item.linkUrl}
                    onClick={() => void handleMarkRead(item.id)}
                    className="flex flex-1 items-start gap-3 min-w-0"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/50 text-primary-dark">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-foreground">
                          {item.title}
                        </p>
                        {!item.isRead ? (
                          <span
                            className="h-2 w-2 rounded-full bg-primary"
                            aria-label="Unread notification"
                          />
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </Link>

                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">
                      {item.timeLabel}
                    </span>
                    {!item.isRead ? (
                      <button
                        type="button"
                        onClick={() => void handleMarkRead(item.id)}
                        className="rounded-md px-2 py-1 text-[11px] font-semibold text-primary-dark hover:bg-secondary/50 cursor-pointer"
                      >
                        Read
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
