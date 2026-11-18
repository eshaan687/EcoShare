"use client";

import {
  BarChart3,
  Bell,
  Bookmark,
  Home,
  Leaf,
  MessageSquare,
  Search,
  Settings,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { EcoShareLogo } from "@/components/branding/EcoShareLogo";
import { useSafeUser } from "@/lib/auth/clerk-hooks";
import { useSafeSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export interface NavItemDefinition {
  readonly href: string;
  readonly label: string;
  readonly icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  readonly badgeCount?: number;
}

export const PRIMARY_NAV_ITEMS: readonly NavItemDefinition[] = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Search },
  { href: "/communities", label: "Communities", icon: Users },
  { href: "/challenges", label: "Challenges", icon: Trophy },
  { href: "/impact", label: "My Impact", icon: BarChart3 },
] as const;

export const SECONDARY_NAV_ITEMS: readonly NavItemDefinition[] = [
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export interface DesktopSidebarProps {
  readonly className?: string;
}

/**
 * Matches the left navigation column in references/ecoshare-ui-reference.png:
 * - Soft mint-green active state (`bg-secondary/65 text-foreground`) with green icon.
 * - Deep forest-green promotional challenge card at the bottom with white pill CTA.
 * - Live unread notification & message request counts from Supabase.
 */
export function DesktopSidebar({ className }: DesktopSidebarProps) {
  const pathname = usePathname();
  const supabase = useSafeSupabaseClient();
  const { user, isSignedIn } = useSafeUser();
  const userId = user?.id ?? null;

  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (!supabase || !isSignedIn || !userId) return;

    let cancelled = false;
    async function loadUnread() {
      const { count } = await supabase!
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", userId!)
        .eq("is_read", false);
      if (!cancelled) {
        setUnreadNotifications(count ?? 0);
      }
    }

    void Promise.resolve().then(() => loadUnread());

    const channel = supabase
      .channel("sidebar-unread-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          void loadUnread();
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [supabase, isSignedIn, userId]);

  function isRouteActive(href: string): boolean {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside
      aria-label="Primary sidebar navigation"
      className={cn(
        "hidden md:flex md:w-60 lg:w-64 shrink-0 flex-col justify-between rounded-[20px] border border-border/80 bg-surface p-4 shadow-xs h-fit sticky top-4",
        className,
      )}
    >
      <div>
        <div className="px-2.5 pb-5 pt-1">
          <EcoShareLogo size="md" />
        </div>

        <nav aria-label="Main EcoShare navigation" className="space-y-1">
          {PRIMARY_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isRouteActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                  active
                    ? "bg-secondary/65 font-semibold text-foreground"
                    : "font-medium text-foreground/85 hover:bg-background hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0",
                    active ? "text-primary-dark" : "text-muted-foreground",
                  )}
                  aria-hidden={true}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="my-3.5 border-t border-border/80" role="separator" />

        <nav aria-label="Account and activity navigation" className="space-y-1">
          {SECONDARY_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isRouteActive(item.href);
            const badgeCount =
              item.href === "/notifications" ? unreadNotifications : 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                  active
                    ? "bg-secondary/65 font-semibold text-foreground"
                    : "font-medium text-foreground/85 hover:bg-background hover:text-foreground",
                )}
              >
                <span className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0",
                      active ? "text-primary-dark" : "text-muted-foreground",
                    )}
                    aria-hidden={true}
                  />
                  <span>{item.label}</span>
                </span>

                {badgeCount > 0 ? (
                  <span
                    aria-label={`${badgeCount} unread notifications`}
                    className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white"
                  >
                    {badgeCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Promotional Challenge Callout matching reference image */}
      <div className="relative mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-[#15803D] via-[#166534] to-[#14532D] p-4 text-white shadow-xs">
        <Leaf
          className="pointer-events-none absolute -right-2 -top-2 h-16 w-16 rotate-12 text-white/15"
          aria-hidden="true"
        />
        <p className="relative z-10 text-sm font-bold leading-snug text-white">
          Make a bigger impact!
        </p>
        <p className="relative z-10 mt-1 text-xs leading-relaxed text-emerald-50/90">
          Join a global challenge today.
        </p>
        <Link
          href="/challenges"
          className="relative z-10 mt-3.5 inline-flex w-full items-center justify-center rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-[#15803D] shadow-2xs transition-colors hover:bg-emerald-50 outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          View Challenges &rarr;
        </Link>
      </div>
    </aside>
  );
}
