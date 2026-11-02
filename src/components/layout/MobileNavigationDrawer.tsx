"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { EcoShareLogo } from "@/components/branding/EcoShareLogo";
import {
  PRIMARY_NAV_ITEMS,
  SECONDARY_NAV_ITEMS,
} from "@/components/layout/DesktopSidebar";
import { cn } from "@/lib/utils";

export interface MobileNavigationDrawerProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

/**
 * Accessible slide-over navigation drawer for mobile viewports (< 768px)
 * so every primary and secondary route is reachable on 360px/390px/430px screens.
 */
export function MobileNavigationDrawer({
  open,
  onClose,
}: MobileNavigationDrawerProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (!open) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile navigation drawer"
    >
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 flex h-full w-72 max-w-[85vw] flex-col justify-between border-r border-border bg-surface p-4 shadow-xl overflow-y-auto">
        <div>
          <div className="flex items-center justify-between border-b border-border pb-3">
            <EcoShareLogo size="sm" />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation menu"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-background hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <nav aria-label="Mobile primary navigation" className="mt-4 space-y-1">
            {[...PRIMARY_NAV_ITEMS, ...SECONDARY_NAV_ITEMS].map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
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
                        "h-[18px] w-[18px]",
                        active ? "text-primary-dark" : "text-muted-foreground",
                      )}
                      aria-hidden={true}
                    />
                    <span>{item.label}</span>
                  </span>
                  {item.badgeCount ? (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white">
                      {item.badgeCount}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-6 border-t border-border pt-4 flex flex-col gap-2">
          <Link
            href="/login"
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-border bg-background text-xs font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center rounded-xl bg-primary text-xs font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
