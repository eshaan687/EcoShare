"use client";

import { useState } from "react";

import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { MobileBottomNavigation } from "@/components/layout/MobileBottomNavigation";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { MobileNavigationDrawer } from "@/components/layout/MobileNavigationDrawer";
import { RightContextualPanel } from "@/components/layout/RightContextualPanel";
import { TopNavigation } from "@/components/layout/TopNavigation";

export interface AppShellProps {
  readonly children: React.ReactNode;
}

/**
 * Responsive 3-column desktop / 2-column tablet / single-column mobile shell
 * matching references/ecoshare-ui-reference.png.
 */
export function AppShell({ children }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Mobile Header (< 768px) */}
      <MobileHeader onOpenDrawer={() => setDrawerOpen(true)} />
      <MobileNavigationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      {/* Main Responsive Shell Container */}
      <div className="mx-auto flex w-full max-w-[1440px] flex-1 gap-4 px-3 py-3 pb-20 sm:px-4 md:gap-5 md:px-6 md:py-5 md:pb-8">
        {/* Left Navigation Column (Tablet & Desktop >= 768px) */}
        <DesktopSidebar />

        {/* Central Content + Right Contextual Column */}
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <TopNavigation />

          <div className="flex min-w-0 flex-1 gap-5">
            <main
              id="main-content"
              className="min-w-0 flex-1 space-y-4"
            >
              {children}
            </main>

            {/* Right Contextual Panel (Desktop >= 1280px) */}
            <RightContextualPanel />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation (< 768px) */}
      <MobileBottomNavigation />
    </div>
  );
}
