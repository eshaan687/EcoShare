"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { CreateActionDialog } from "@/components/impact/CreateActionDialog";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface HeroBannerProps {
  readonly className?: string;
}

/**
 * Matches the central hero banner in references/ecoshare-ui-reference.png:
 * "Share Actions. Inspire Change." with "Share Your Action" and "Explore Challenges" CTAs.
 */
export function HeroBanner({ className }: HeroBannerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <section
        aria-label="EcoShare Hero Banner"
        className={cn(
          "relative overflow-hidden rounded-[20px] border border-border bg-primary-dark text-white shadow-xs",
          className,
        )}
      >
        <Image
          src="/images/hero-mountains.svg"
          alt="Sunlight over lush green mountains and river valley"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 720px"
          className="object-cover"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#064E3B]/90 via-[#065F46]/75 to-[#15803D]/40"
          aria-hidden="true"
        />

        <div className="relative z-10 p-6 sm:p-7">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[28px] leading-tight">
            Share Actions. Inspire Change.
          </h1>
          <p className="mt-2 max-w-xl text-xs leading-relaxed text-emerald-50/95 sm:text-sm">
            Join our community dedicated to making a positive impact on the planet. Share your
            eco-friendly actions, take on challenges, and connect with like-minded individuals!
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="primary"
              pill
              onClick={() => setDialogOpen(true)}
              className="shadow-sm"
            >
              Share Your Action
            </Button>

            <Link
              href="/challenges"
              className="inline-flex h-10 items-center justify-center rounded-full border border-white/80 bg-white/15 px-4 text-sm font-semibold text-white backdrop-blur-xs transition-colors hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Explore Challenges
            </Link>
          </div>
        </div>
      </section>

      <CreateActionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultMode="impact"
      />
    </>
  );
}
