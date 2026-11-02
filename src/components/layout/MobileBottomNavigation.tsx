"use client";

import { Compass, Home, Plus, User, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { CreateActionDialog } from "@/components/impact/CreateActionDialog";
import { cn } from "@/lib/utils";

/**
 * Matches the mobile bottom navigation bar in references/ecoshare-ui-reference.png:
 * Home | Explore | central green "+" Create button | Communities | Profile.
 */
export function MobileBottomNavigation() {
  const pathname = usePathname();
  const [createOpen, setCreateOpen] = useState(false);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      <nav
        aria-label="Mobile bottom navigation"
        className="fixed inset-x-0 bottom-0 z-30 flex md:hidden items-center justify-around border-t border-border bg-surface/95 px-2 py-1.5 backdrop-blur-xs"
      >
        <Link
          href="/home"
          aria-current={isActive("/home") ? "page" : undefined}
          className={cn(
            "flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors",
            isActive("/home") ? "text-primary-dark" : "text-muted-foreground",
          )}
        >
          <Home className="h-5 w-5" aria-hidden="true" />
          <span>Home</span>
        </Link>

        <Link
          href="/explore"
          aria-current={isActive("/explore") ? "page" : undefined}
          className={cn(
            "flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors",
            isActive("/explore") ? "text-primary-dark" : "text-muted-foreground",
          )}
        >
          <Compass className="h-5 w-5" aria-hidden="true" />
          <span>Explore</span>
        </Link>

        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          aria-label="Share an Environmental Action"
          className="flex h-11 w-11 -mt-4 items-center justify-center rounded-full bg-primary text-white shadow-md ring-4 ring-surface transition-transform active:scale-95"
        >
          <Plus className="h-6 w-6" aria-hidden="true" />
        </button>

        <Link
          href="/communities"
          aria-current={isActive("/communities") ? "page" : undefined}
          className={cn(
            "flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors",
            isActive("/communities")
              ? "text-primary-dark"
              : "text-muted-foreground",
          )}
        >
          <Users className="h-5 w-5" aria-hidden="true" />
          <span>Communities</span>
        </Link>

        <Link
          href="/profile"
          aria-current={isActive("/profile") ? "page" : undefined}
          className={cn(
            "flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors",
            isActive("/profile") ? "text-primary-dark" : "text-muted-foreground",
          )}
        >
          <User className="h-5 w-5" aria-hidden="true" />
          <span>Profile</span>
        </Link>
      </nav>

      <CreateActionDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultMode="impact"
      />
    </>
  );
}
