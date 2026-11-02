"use client";

import { Show, UserButton } from "@clerk/nextjs";
import { Bell, Plus, Search, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";

import { CreateActionDialog } from "@/components/impact/CreateActionDialog";
import { cn } from "@/lib/utils";

export interface TopNavigationProps {
  readonly className?: string;
}

/**
 * Matches the top search and utility bar in references/ecoshare-ui-reference.png:
 * search input ("Search EcoShare..."), green "+" create button, notifications bell,
 * profile shortcut, and Clerk authentication controls.
 */
export function TopNavigation({ className }: TopNavigationProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed.length > 0) {
      router.push(`/explore?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/explore");
    }
  }

  return (
    <>
      <header
        aria-label="Desktop utility bar"
        className={cn(
          "hidden md:flex items-center justify-between gap-4 rounded-[16px] border border-border bg-surface px-4 py-2.5 shadow-xs",
          className,
        )}
      >
        <form
          onSubmit={handleSearchSubmit}
          role="search"
          aria-label="Search EcoShare"
          className="relative min-w-0 flex-1 max-w-md"
        >
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search EcoShare..."
            aria-label="Search EcoShare"
            className="h-10 w-full min-w-0 rounded-full border border-border bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          />
        </form>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            aria-label="Share an Environmental Action"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-3 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span className="hidden lg:inline">Share Action</span>
          </button>

          <Link
            href="/notifications"
            aria-label="Notifications (3 sample items)"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-secondary/35"
          >
            <Bell className="h-4 w-4" aria-hidden="true" />
            <span
              className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white"
              aria-hidden="true"
            >
              3
            </span>
          </Link>

          <Link
            href="/profile"
            aria-label="View EcoShare profile"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-secondary/35"
          >
            <User className="h-4 w-4" aria-hidden="true" />
          </Link>

          <Suspense
            fallback={
              <div
                className="h-8 w-20 animate-pulse rounded-full bg-border/60"
                aria-hidden="true"
              />
            }
          >
            <Show when="signed-in">
              <UserButton />
            </Show>
            <Show when="signed-out">
              <div className="flex items-center gap-2 pl-1">
                <Link
                  href="/login"
                  className="inline-flex h-9 items-center rounded-full border border-border bg-surface px-3.5 text-xs font-semibold text-foreground transition-colors hover:bg-background"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex h-9 items-center rounded-full bg-primary-dark px-3.5 text-xs font-semibold text-white transition-colors hover:bg-primary"
                >
                  Get Started
                </Link>
              </div>
            </Show>
          </Suspense>
        </div>
      </header>

      <CreateActionDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultMode="impact"
      />
    </>
  );
}
