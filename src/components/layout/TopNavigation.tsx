"use client";

import { Show, UserButton, useUser } from "@clerk/nextjs";
import { Bell, ChevronDown, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { CreateActionDialog } from "@/components/impact/CreateActionDialog";
import { Avatar } from "@/components/ui/Avatar";
import { isClerkClientConfigured } from "@/lib/env.client";
import { useSafeSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export interface TopNavigationProps {
  readonly className?: string;
}

function ClerkAuthControls() {
  const { isSignedIn, user } = useUser();

  const displayName =
    isSignedIn && user
      ? user.fullName ||
        user.username ||
        user.primaryEmailAddress?.emailAddress ||
        "EcoShare Member"
      : "Guest";

  const avatarSrc = isSignedIn && user?.imageUrl ? user.imageUrl : undefined;

  return (
    <>
      <Link
        href="/profile"
        aria-label="View EcoShare profile"
        className="inline-flex items-center gap-1 rounded-full pr-1 transition-colors hover:bg-background outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <Avatar
          src={avatarSrc}
          alt={displayName}
          size="sm"
          className="h-9 w-9 border border-border"
        />
        <ChevronDown
          className="h-3.5 w-3.5 text-muted-foreground"
          aria-hidden="true"
        />
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
              className="inline-flex h-9 items-center rounded-full border border-border bg-surface px-3.5 text-xs font-semibold text-foreground transition-colors hover:bg-background outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="hidden lg:inline-flex h-9 items-center rounded-full bg-primary px-3.5 text-xs font-semibold text-white transition-colors hover:bg-primary-dark outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              Get Started
            </Link>
          </div>
        </Show>
      </Suspense>
    </>
  );
}

function GuestAuthControls() {
  return (
    <>
      <Link
        href="/profile"
        aria-label="View EcoShare profile"
        className="inline-flex items-center gap-1 rounded-full pr-1 transition-colors hover:bg-background outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <Avatar
          alt="Guest"
          size="sm"
          className="h-9 w-9 border border-border"
        />
        <ChevronDown
          className="h-3.5 w-3.5 text-muted-foreground"
          aria-hidden="true"
        />
      </Link>

      <div className="flex items-center gap-2 pl-1">
        <Link
          href="/login"
          className="inline-flex h-9 items-center rounded-full border border-border bg-surface px-3.5 text-xs font-semibold text-foreground transition-colors hover:bg-background outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          Log In
        </Link>
        <Link
          href="/signup"
          className="hidden lg:inline-flex h-9 items-center rounded-full bg-primary px-3.5 text-xs font-semibold text-white transition-colors hover:bg-primary-dark outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          Get Started
        </Link>
      </div>
    </>
  );
}

/**
 * Matches the top search and utility bar in references/ecoshare-ui-reference.png:
 * rounded search input ("Search EcoShare..."), circular green "+" create button,
 * notifications bell with live unread badge, profile avatar shortcut, and Clerk authentication controls.
 */
export function TopNavigation({ className }: TopNavigationProps) {
  const router = useRouter();
  const supabase = useSafeSupabaseClient();
  const { user, isSignedIn } = useUser();
  const userId = user?.id ?? null;

  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const clerkConfigured = isClerkClientConfigured();

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
        setUnreadCount(count ?? 0);
      }
    }

    void Promise.resolve().then(() => loadUnread());
    return () => {
      cancelled = true;
    };
  }, [supabase, isSignedIn, userId]);

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
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
          "hidden md:flex items-center justify-between gap-4 rounded-[18px] border border-border/80 bg-surface px-4 py-2.5 shadow-xs",
          className,
        )}
      >
        <form
          role="search"
          onSubmit={handleSearchSubmit}
          className="relative flex-1 max-w-md"
        >
          <Search
            className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search EcoShare..."
            aria-label="Search EcoShare"
            className="h-10 w-full min-w-0 rounded-full border border-border/80 bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          />
        </form>

        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            aria-label="Share an Environmental Action"
            title="Share an Environmental Action"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow-xs transition-colors hover:bg-primary-dark outline-none focus-visible:ring-2 focus-visible:ring-primary/50 cursor-pointer"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
          </button>

          <Link
            href="/notifications"
            aria-label={
              unreadCount > 0
                ? `Notifications (${unreadCount} unread)`
                : "Notifications"
            }
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-background hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            {unreadCount > 0 ? (
              <span
                className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white"
                aria-hidden="true"
              >
                {unreadCount}
              </span>
            ) : null}
          </Link>

          {clerkConfigured ? <ClerkAuthControls /> : <GuestAuthControls />}
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
