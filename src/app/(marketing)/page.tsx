import { Show, UserButton } from "@clerk/nextjs";
import {
  Award,
  CheckCircle2,
  Compass,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { EcoShareLogo } from "@/components/branding/EcoShareLogo";
import { PrototypeBanner } from "@/components/branding/PrototypeBanner";
import { VerificationBadge } from "@/components/impact/VerificationBadge";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ECOSHARE_LEVELS } from "@/lib/constants/levels";

export default function WelcomeOnboardingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Marketing Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <EcoShareLogo size="md" href="/" />

          <nav
            aria-label="Public discovery navigation"
            className="hidden md:flex items-center gap-6 text-sm font-semibold text-muted-foreground"
          >
            <Link href="/home" className="hover:text-primary-dark transition-colors">
              Home Feed Preview
            </Link>
            <Link href="/explore" className="hover:text-primary-dark transition-colors">
              Explore
            </Link>
            <Link
              href="/communities"
              className="hover:text-primary-dark transition-colors"
            >
              Communities
            </Link>
            <Link
              href="/challenges"
              className="hover:text-primary-dark transition-colors"
            >
              Challenges
            </Link>
          </nav>

          <div className="flex items-center gap-2.5">
            <Suspense
              fallback={
                <div
                  className="h-9 w-24 animate-pulse rounded-full bg-border/60"
                  aria-hidden="true"
                />
              }
            >
              <Show when="signed-in">
                <Link
                  href="/home"
                  className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-xs font-semibold text-white hover:bg-primary-dark"
                >
                  Open Feed
                </Link>
                <UserButton />
              </Show>
              <Show when="signed-out">
                <Link
                  href="/login"
                  className="inline-flex h-9 items-center rounded-full border border-border bg-surface px-4 text-xs font-semibold text-foreground hover:bg-background"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-xs font-semibold text-white hover:bg-primary-dark"
                >
                  Get Started
                </Link>
              </Show>
            </Suspense>
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 sm:px-6 sm:py-10 space-y-10">
        <PrototypeBanner />

        {/* Onboarding & Welcome Hero Section matching mobile onboarding screen in reference image */}
        <section
          aria-labelledby="welcome-heading"
          className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12"
        >
          {/* Left Column: Mission & Value Proposition */}
          <div className="space-y-5 lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-secondary bg-secondary/35 px-3.5 py-1.5 text-xs font-semibold text-primary-dark">
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span>Global Environmental Social Network</span>
            </div>

            <h1
              id="welcome-heading"
              className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl leading-[1.12]"
            >
              Connect for a Greener Tomorrow.
            </h1>

            <p className="text-xl font-bold text-primary-dark sm:text-2xl">
              Share Actions. Inspire Change.
            </p>

            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
              Join a global community taking action for the planet. Share your
              eco-friendly efforts, participate in environmental challenges, and build
              a trusted reputation backed by human-verified real-world impact.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/signup"
                className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-primary-dark"
              >
                Get Started
              </Link>
              <Link
                href="/home"
                className="inline-flex h-11 items-center justify-center rounded-full border border-primary/40 bg-secondary/30 px-6 text-sm font-semibold text-primary-dark transition-colors hover:bg-secondary/50"
              >
                Preview Home Feed &rarr;
              </Link>
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-surface px-5 text-sm font-semibold text-foreground transition-colors hover:bg-background"
              >
                Already have an account? Log In
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-surface p-3.5">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span>Human-Verified Impact</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Likes never equal environmental XP. Authorised verifiers review real evidence.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-3.5">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Users className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span>Action Communities</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Collaborate in beach cleanups, urban gardening, and zero-waste collectives.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-3.5">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Award className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span>6 Reputation Levels</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Progress from Eco Starter (0 XP) to Planet Legend (1500 XP).
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Official Onboarding Card matching the right-side phone screen in reference image */}
          <div className="lg:col-span-5 flex justify-center">
            <Card className="w-full max-w-sm overflow-hidden rounded-[24px] border-2 border-border bg-surface shadow-md">
              <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                <EcoShareLogo size="sm" href="/" />
                <Badge variant="verified">Onboarding</Badge>
              </div>

              <div className="relative h-56 w-full overflow-hidden">
                <Image
                  src="/images/hero-mountains.png"
                  alt="Mountain valley sunrise with evergreen forest and river"
                  fill
                  priority
                  sizes="384px"
                  className="object-cover"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent"
                  aria-hidden="true"
                />
              </div>

              <div className="space-y-4 px-6 pb-6 pt-3 text-center">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary-dark">
                    Connect for a Greener Tomorrow
                  </p>
                  <h2 className="text-xl font-bold text-foreground">
                    Share Actions. Inspire Change.
                  </h2>
                </div>

                <p className="text-xs leading-relaxed text-muted-foreground">
                  Join a global community taking action for the planet. Share your
                  eco-friendly efforts, participate in challenges, and make a real
                  impact!
                </p>

                {/* Carousel indicator dots matching reference onboarding card */}
                <div className="flex items-center justify-center gap-1.5 py-1" aria-hidden="true">
                  <span className="h-2 w-5 rounded-full bg-primary" />
                  <span className="h-2 w-2 rounded-full bg-border" />
                  <span className="h-2 w-2 rounded-full bg-border" />
                </div>

                <div className="space-y-2.5 pt-1">
                  <Link
                    href="/signup"
                    className="inline-flex h-11 w-full items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-primary-dark"
                  >
                    Get Started
                  </Link>

                  <p className="text-xs text-muted-foreground">
                    Already have an account?{" "}
                    <Link
                      href="/login"
                      className="font-semibold text-primary-dark hover:underline"
                    >
                      Log In
                    </Link>
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Feature & Reputation Architecture Highlights */}
        <section
          aria-labelledby="features-heading"
          className="space-y-4 border-t border-border pt-8"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="features-heading" className="text-xl font-bold text-foreground">
                Explore the EcoShare Platform
              </h2>
              <p className="text-sm text-muted-foreground">
                Every core destination is available in Milestone 1 UI Preview mode.
              </p>
            </div>
            <VerificationBadge status="verified" label="Verified Impact Architecture" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5 flex flex-col justify-between">
              <div>
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50 text-primary-dark">
                  <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold text-foreground">Home Feed</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Browse For You, Following, and Verified Impact streams with interactive preview tabs.
                </p>
              </div>
              <Link
                href="/home"
                className="mt-4 inline-flex text-xs font-semibold text-primary-dark hover:underline"
              >
                Open Home Feed &rarr;
              </Link>
            </Card>

            <Card className="p-5 flex flex-col justify-between">
              <div>
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50 text-primary-dark">
                  <Compass className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold text-foreground">Explore &amp; Search</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Filter trending environmental initiatives by category and search keywords.
                </p>
              </div>
              <Link
                href="/explore"
                className="mt-4 inline-flex text-xs font-semibold text-primary-dark hover:underline"
              >
                Explore Topics &rarr;
              </Link>
            </Card>

            <Card className="p-5 flex flex-col justify-between">
              <div>
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50 text-primary-dark">
                  <Users className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold text-foreground">Communities</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Join local and global environmental groups coordinating real-world action.
                </p>
              </div>
              <Link
                href="/communities"
                className="mt-4 inline-flex text-xs font-semibold text-primary-dark hover:underline"
              >
                Browse Communities &rarr;
              </Link>
            </Card>

            <Card className="p-5 flex flex-col justify-between">
              <div>
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50 text-primary-dark">
                  <Trophy className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold text-foreground">Challenges</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Take on time-bound environmental challenges and submit evidence for XP.
                </p>
              </div>
              <Link
                href="/challenges"
                className="mt-4 inline-flex text-xs font-semibold text-primary-dark hover:underline"
              >
                View Challenges &rarr;
              </Link>
            </Card>
          </div>
        </section>

        {/* Authoritative Level Structure Overview */}
        <section aria-labelledby="levels-heading" className="pb-6">
          <Card className="p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 id="levels-heading" className="text-sm font-bold text-foreground">
                Verified Environmental XP Progression (PRD §8.2)
              </h2>
              <Badge variant="prototype">Authoritative Thresholds</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
              {ECOSHARE_LEVELS.map((lvl) => (
                <div
                  key={lvl.level}
                  className="rounded-xl border border-border bg-background/60 p-3 text-center"
                >
                  <p className="text-xs font-bold text-primary-dark">
                    Level {lvl.level}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-foreground">
                    {lvl.name}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {lvl.xpRequired} XP
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
