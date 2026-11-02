import { Leaf, ShieldCheck } from "lucide-react";
import {
  isClerkClientConfigured,
  isSupabaseClientConfigured,
  parseClientEnv,
} from "@/lib/env.client";
import { ECOSHARE_FEED_TABS } from "@/lib/constants/design-tokens";
import { ECOSHARE_LEVELS } from "@/lib/constants/levels";

export default function FoundationPage() {
  const env = parseClientEnv();
  const clerkReady = isClerkClientConfigured(env);
  const supabaseReady = isSupabaseClientConfigured(env);

  return (
    <main className="mx-auto flex min-h-screen max-w-[1200px] flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-card border border-border bg-surface p-6 shadow-xs sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 items-center justify-center rounded-pill bg-secondary text-primary-dark"
            >
              <Leaf className="h-5 w-5" />
            </span>
            <div>
              <span className="text-xl font-bold tracking-tight text-text-primary">
                EcoShare
              </span>
              <p className="text-xs text-text-secondary">
                Milestone 0 — Project Foundation Verification
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-pill bg-secondary/50 px-3 py-1 text-xs font-semibold text-primary-dark">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Foundation Active
          </span>
        </div>

        <section className="mt-6 space-y-3">
          <h1 className="text-[32px] leading-[1.2] font-bold text-text-primary">
            Share Actions. Inspire Change.
          </h1>
          <p className="max-w-2xl text-base leading-[1.5] text-text-secondary">
            A global community for a cleaner, healthier planet. This screen
            verifies the Milestone 0 engineering foundation (Next.js 16 App
            Router, Tailwind CSS 4 design tokens, Inter typography, Clerk
            authentication, and Supabase third-party token integration) prior to
            Milestone 1 UI implementation.
          </p>
        </section>

        <section
          aria-label="Foundation status summary"
          className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div className="rounded-control border border-border bg-background p-4">
            <h2 className="text-base font-semibold text-text-primary">
              Clerk + Supabase Integration
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              {clerkReady && supabaseReady
                ? "Clerk authentication and Supabase client configured."
                : "Awaiting Clerk and Supabase development keys in .env.local."}
            </p>
          </div>

          <div className="rounded-control border border-border bg-background p-4">
            <h2 className="text-base font-semibold text-text-primary">
              Approved Feed Tabs
            </h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {ECOSHARE_FEED_TABS.map((tab) => (
                <li
                  key={tab.id}
                  className="rounded-pill border border-border bg-surface px-3 py-1 text-xs font-medium text-text-primary"
                >
                  {tab.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-control border border-border bg-background p-4">
            <h2 className="text-base font-semibold text-text-primary">
              Authoritative XP Levels
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              {ECOSHARE_LEVELS.length} levels configured (Level 4:{" "}
              <span className="font-medium text-text-primary">
                Planet Protector
              </span>{" "}
              at 350 XP; Level 5:{" "}
              <span className="font-medium text-text-primary">
                Earth Champion
              </span>{" "}
              at 700 XP).
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
