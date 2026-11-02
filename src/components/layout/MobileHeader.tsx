"use client";

import { Show, UserButton } from "@clerk/nextjs";
import { Menu, Search } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { EcoShareLogo } from "@/components/branding/EcoShareLogo";
import { cn } from "@/lib/utils";

export interface MobileHeaderProps {
  readonly onOpenDrawer: () => void;
  readonly className?: string;
}

/**
 * Matches the mobile top header in references/ecoshare-ui-reference.png:
 * Hamburger menu trigger, EcoShare logo, search icon link, and Clerk user/login control.
 */
export function MobileHeader({ onOpenDrawer, className }: MobileHeaderProps) {
  return (
    <header
      aria-label="Mobile top bar"
      className={cn(
        " sticky top-0 z-30 flex md:hidden items-center justify-between gap-2 border-b border-border bg-surface/95 px-3.5 py-2.5 backdrop-blur-xs",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenDrawer}
          aria-label="Open navigation menu"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-foreground hover:bg-secondary/30"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <EcoShareLogo size="sm" />
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/explore"
          aria-label="Search and explore EcoShare"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-foreground hover:bg-secondary/30"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
        </Link>

        <Suspense
          fallback={
            <div
              className="h-8 w-14 animate-pulse rounded-full bg-border/60"
              aria-hidden="true"
            />
          }
        >
          <Show when="signed-in">
            <UserButton />
          </Show>
          <Show when="signed-out">
            <Link
              href="/login"
              className="inline-flex h-8 items-center rounded-full bg-primary px-3 text-xs font-semibold text-white hover:bg-primary-dark"
            >
              Log In
            </Link>
          </Show>
        </Suspense>
      </div>
    </header>
  );
}
