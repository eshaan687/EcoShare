"use client";

import { CheckCircle2, Settings, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useSafeUser } from "@/lib/auth/clerk-hooks";
import { useSafeSupabaseClient } from "@/lib/supabase/client";
import { ensureCurrentUserProfile } from "@/lib/supabase/profile-sync";

export default function SettingsPage() {
  const supabase = useSafeSupabaseClient();
  const { isSignedIn, user } = useSafeUser();
  const userId = user?.id ?? null;

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [bio, setBio] = useState("");
  const [allowMessagesFrom, setAllowMessagesFrom] = useState("everyone");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase || !userId || !user) return;
    let cancelled = false;
    void Promise.resolve().then(async () => {
      await ensureCurrentUserProfile(supabase, user);
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (!cancelled && data) {
        setDisplayName(data.display_name || "");
        setUsername(data.username || "");
        setLocation(data.location || "");
        setWebsite(data.website || "");
        setBio(data.bio || "");
        setAllowMessagesFrom(data.allow_messages_from || "everyone");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [supabase, userId, user]);

  async function handleSaveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    if (!supabase || !isSignedIn || !user) return;

    setSaving(true);
    try {
      await ensureCurrentUserProfile(supabase, user);
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim() || "EcoShare Member",
          username: username
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, ""),
          location: location.trim() || null,
          website: website.trim() || null,
          bio: bio.trim() || null,
          allow_messages_from: allowMessagesFrom,
        })
        .eq("user_id", user.id);

      if (error) {
        setFeedback(`Could not save settings: ${error.message}`);
        return;
      }
      setFeedback("Profile & privacy settings saved to Supabase!");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50 text-primary-dark">
              <Settings className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Account &amp; Profile Settings
              </h1>
              <p className="text-xs text-muted-foreground">
                Clerk authentication identity, EcoShare profile details, and messaging privacy
              </p>
            </div>
          </div>
          <Badge variant={isSignedIn ? "verified" : "prototype"}>
            {isSignedIn ? "Connected to Supabase" : "Guest Mode"}
          </Badge>
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
                {user.fullName ||
                  user.username ||
                  user.primaryEmailAddress?.emailAddress}
              </strong>{" "}
              (Clerk ID: <code>{user.id}</code>). Changes below persist directly
              to <code>public.profiles</code>.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                You are currently browsing in Guest Mode. Sign in with
                Clerk to manage your account credentials and profile settings.
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

        {isSignedIn ? (
          <form onSubmit={(e) => void handleSaveSettings(e)} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="settings-display-name"
                  className="mb-1.5 block text-xs font-semibold text-foreground"
                >
                  Display Name
                </label>
                <Input
                  id="settings-display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="settings-username"
                  className="mb-1.5 block text-xs font-semibold text-foreground"
                >
                  Username (@handle)
                </label>
                <Input
                  id="settings-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="settings-location"
                  className="mb-1.5 block text-xs font-semibold text-foreground"
                >
                  Country / Region
                </label>
                <Input
                  id="settings-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Monterrey, Mexico"
                />
              </div>

              <div>
                <label
                  htmlFor="settings-website"
                  className="mb-1.5 block text-xs font-semibold text-foreground"
                >
                  Website (optional)
                </label>
                <Input
                  id="settings-website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="settings-messaging-privacy"
                className="mb-1.5 block text-xs font-semibold text-foreground"
              >
                Who Can Send You Message Requests
              </label>
              <select
                id="settings-messaging-privacy"
                value={allowMessagesFrom}
                onChange={(e) => setAllowMessagesFrom(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-surface px-3 text-sm text-foreground"
              >
                <option value="everyone">Everyone on EcoShare</option>
                <option value="following">Only people I follow</option>
                <option value="none">No one (disable new message requests)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="settings-bio"
                className="mb-1.5 block text-xs font-semibold text-foreground"
              >
                Biography
              </label>
              <Textarea
                id="settings-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Share your environmental goals and community initiatives..."
              />
            </div>

            {feedback ? (
              <div
                role="status"
                className="inline-flex items-center gap-1.5 rounded-xl bg-secondary/40 px-3.5 py-2 text-xs font-semibold text-primary-dark"
              >
                <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>{feedback}</span>
              </div>
            ) : null}

            <div className="flex justify-end border-t border-border pt-3">
              <Button type="submit" variant="primary" pill disabled={saving}>
                {saving ? "Saving..." : "Save Profile Settings"}
              </Button>
            </div>
          </form>
        ) : null}
      </Card>
    </div>
  );
}
