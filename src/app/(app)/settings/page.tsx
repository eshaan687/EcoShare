"use client";

import { useUser } from "@clerk/nextjs";
import { Settings, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export default function SettingsPrototypePage() {
  const { isSignedIn, user } = useUser();

  return (
    <div className="space-y-4">
      <Card className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50 text-primary-dark">
              <Settings className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Account &amp; Profile Settings</h1>
              <p className="text-xs text-muted-foreground">
                Clerk authentication identity and EcoShare profile preferences
              </p>
            </div>
          </div>
          <Badge variant="prototype">Milestone 2 Preview</Badge>
        </div>

        <div className="rounded-xl border border-border bg-background/60 p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
            <span>Clerk Session Status</span>
          </div>
          {isSignedIn && user ? (
            <p className="text-xs text-muted-foreground">
              Signed in as{" "}
              <strong className="text-foreground">
                {user.fullName || user.username || user.primaryEmailAddress?.emailAddress}
              </strong>{" "}
              (Clerk ID: <code>{user.id}</code>). Profile bio, location, and avatar
              persistence in `public.profiles` will be enabled in Milestone 2.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                You are currently browsing in Guest Preview Mode. Sign in with Clerk to
                manage your account credentials and profile settings.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Link
                  href="/login"
                  className="inline-flex h-8 items-center rounded-full bg-primary px-3.5 text-xs font-semibold text-white hover:bg-primary-dark"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex h-8 items-center rounded-full border border-border bg-surface px-3.5 text-xs font-semibold text-foreground hover:bg-background"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
