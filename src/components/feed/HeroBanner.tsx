"use client";

import { Camera } from "lucide-react";
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
 * Photorealistic mountain sunrise background, "Share Actions. Inspire Change.",
 * "Share Your Action" with camera icon, "Explore Challenges" outline button,
 * and subtle decorative leaf line-art in the bottom-right corner.
 */
export function HeroBanner({ className }: HeroBannerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <section
        aria-label="EcoShare Hero Banner"
        className={cn(
          "relative overflow-hidden rounded-[20px] border border-border/80 bg-[#0F291E] text-white shadow-sm",
          className,
        )}
      >
        <Image
          src="/images/hero-mountains.png"
          alt="Sunlight over lush green mountains and river valley"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 720px"
          className="object-cover object-center"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#051F14]/80 via-[#0A2E1F]/50 to-transparent"
          aria-hidden="true"
        />

        {/* Decorative botanical leaf line-art in bottom right matching reference image */}
        <svg
          viewBox="0 0 180 140"
          fill="none"
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-3 right-2 h-32 w-40 opacity-75 sm:h-36 sm:w-44"
        >
          <path
            d="M88 138V58C88 58 92 22 134 14C138 52 114 82 88 86"
            stroke="#4ADE80"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M88 98C66 92 42 68 46 34C78 40 88 70 88 98Z"
            stroke="#4ADE80"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M88 84L118 42M88 96L62 56"
            stroke="#4ADE80"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>

        <div className="relative z-10 p-6 sm:px-8 sm:py-7">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[34px] sm:leading-[1.12]">
            Share Actions.
            <br />
            Inspire Change.
          </h1>
          <p className="mt-2.5 max-w-md text-xs leading-relaxed text-white/90 sm:text-sm">
            A global community for a cleaner, healthier planet.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="primary"
              pill
              onClick={() => setDialogOpen(true)}
              className="shadow-sm px-5 font-semibold"
            >
              <Camera className="h-4 w-4" aria-hidden="true" />
              Share Your Action
            </Button>

            <Link
              href="/challenges"
              className="inline-flex h-10 items-center justify-center rounded-full border border-white/85 bg-black/25 px-5 text-sm font-semibold text-white backdrop-blur-xs transition-colors hover:bg-white/20 outline-none focus-visible:ring-2 focus-visible:ring-white"
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
