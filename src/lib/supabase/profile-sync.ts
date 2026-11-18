"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export interface ClerkUserProfileInput {
  readonly id: string;
  readonly username?: string | null;
  readonly fullName?: string | null;
  readonly firstName?: string | null;
  readonly imageUrl?: string | null;
  readonly primaryEmailAddress?: { readonly emailAddress: string } | null;
}

function buildSafeUsername(user: ClerkUserProfileInput): string {
  const raw =
    user.username ||
    user.primaryEmailAddress?.emailAddress.split("@")[0] ||
    user.firstName ||
    `eco_${user.id.slice(-8)}`;

  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
  const padded = cleaned.length < 3 ? `${cleaned}_eco` : cleaned;
  return `${padded.slice(0, 22)}_${user.id.slice(-6).replace(/[^a-zA-Z0-9]/g, "")}`;
}

/**
 * Ensures the signed-in Clerk user has a corresponding row in `public.profiles`
 * so foreign keys on `posts`, `messages`, and `conversation_participants` succeed
 * even in local development without an active webhook tunnel.
 */
export async function ensureCurrentUserProfile(
  supabase: SupabaseClient<Database>,
  user: ClerkUserProfileInput,
): Promise<void> {
  const { data: existing } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return;
  }

  const displayName =
    user.fullName?.trim() ||
    user.firstName?.trim() ||
    user.username?.trim() ||
    user.primaryEmailAddress?.emailAddress.split("@")[0] ||
    "EcoShare Member";

  await supabase.from("profiles").insert({
    user_id: user.id,
    username: buildSafeUsername(user),
    display_name: displayName,
    avatar_url: user.imageUrl ?? "/images/avatar-alex.png",
    location: "Global EcoShare Community",
    total_xp: 0,
    level: 1,
    is_deleted: false,
  });
}
