"use client";

import {
  Bell,
  Bookmark,
  Compass,
  Home,
  Leaf,
  MessageSquare,
  Settings,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { EcoShareLogo } from "@/components/branding/EcoShareLogo";
import { cn } from "@/lib/utils";

export interface NavItemDefinition {
  readonly href: string;
  readonly label: string;
  readonly icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  readonly badgeCount?: number;
}

export const PRIMARY_NAV_ITEMS: readonly NavItemDefinition[] = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/communities", label: "Communities", icon: Users },
  { href: "/challenges", label: "Challenges", icon: Trophy },
  { href: "/impact", label: "My Impact", icon: ShieldCheck },
] as const;

export const SECONDARY_NAV_ITEMS: readonly NavItemDefinition[] = [
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/notifications", label: "Notifications", icon: Bell, badgeCount: 3 },
  { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export interface DesktopSidebarProps {
  readonly className?: string;
}

/**
 * Matches the left navigation column in references/ecoshare-ui-reference.png:
 * EcoShare logo, primary & secondary navigation groups, Notifications badge,
 * and the bottom green challenge callout card.
 */
export function DesktopSidebar({ className }: DesktopSidebarProps) {
  const pathname = usePathname();

  function isRouteActive(href: string): boolean {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside
      aria-label="Primary sidebar navigation"
      className={cn(
        "hidden md:flex md:w-60 lg:w-64 shrink-0 flex-col justify-between rounded-[20px] border border-border bg-surface p-4 shadow-xs h-fit sticky top-4",
        className,
      )}
    >
      <div>
        <div className="px-2 pb-4 pt-1">
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
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                  active
                    ? "bg-primary text-white shadow-xs"
                    : "text-foreground hover:bg-secondary/35 hover:text-primary-dark",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    active ? "text-white" : "text-primary-dark",
                  )}
                  aria-hidden={true}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="my-3 border-t border-border" role="separator" />

        <nav aria-label="Account and activity navigation" className="space-y-1">
          {SECONDARY_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isRouteActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-white font-semibold shadow-xs"
                    : "text-muted-foreground hover:bg-secondary/30 hover:text-foreground",
                )}
              >
                <span className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      active ? "text-white" : "text-muted-foreground",
                    )}
                    aria-hidden={true}
                  />
                  <span>{item.label}</span>
                </span>

                {item.badgeCount ? (
                  <span
                    aria-label={`${item.badgeCount} sample notifications`}
                    className={cn(
                      "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold",
                      active
                        ? "bg-white text-primary-dark"
                        : "bg-primary text-white",
                    )}
                  >
                    {item.badgeCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Promotional Challenge Callout matching reference image */}
      <div className="mt-6 rounded-2xl border border-secondary bg-gradient-to-br from-secondary/50 via-secondary/25 to-surface p-4">
        <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
          <Leaf className="h-4 w-4" aria-hidden="true" />
        </div>
        <p className="text-xs font-semibold leading-snug text-foreground">
          Make a bigger impact! Join a global challenge today.
        </p>
        <Link
          href="/challenges"
          className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-primary px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          View Challenges &rarr;
        </Link>
      </div>
    </aside>
  );
}
