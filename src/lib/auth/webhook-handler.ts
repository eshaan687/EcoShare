import type { SupabaseClient } from "@supabase/supabase-js";
import { Webhook } from "svix";
import type { Database } from "@/types/database.types";

export interface ClerkUserWebhookData {
  id: string;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
  email_addresses?: Array<{ email_address: string; id: string }>;
  unsafe_metadata?: Record<string, unknown>;
  public_metadata?: Record<string, unknown>;
  deleted?: boolean;
}

export interface ClerkWebhookEvent {
  type: "user.created" | "user.updated" | "user.deleted" | string;
  data: ClerkUserWebhookData;
}

export interface WebhookHeaders {
  "svix-id"?: string | null;
  "svix-timestamp"?: string | null;
  "svix-signature"?: string | null;
}

/**
 * Verifies Svix webhook signatures using the configured webhook secret.
 * Throws an error if headers are missing or signature is invalid.
 */
export function verifyClerkWebhookSignature(
  rawBody: string,
  headers: WebhookHeaders,
  secret: string,
): ClerkWebhookEvent {
  const svixId = headers["svix-id"];
  const svixTimestamp = headers["svix-timestamp"];
  const svixSignature = headers["svix-signature"];

  if (!svixId || !svixTimestamp || !svixSignature) {
    throw new Error("Missing required Svix webhook verification headers");
  }

  const wh = new Webhook(secret);
  wh.verify(rawBody, {
    "svix-id": svixId,
    "svix-timestamp": svixTimestamp,
    "svix-signature": svixSignature,
  });

  return JSON.parse(rawBody) as ClerkWebhookEvent;
}

/**
 * Sanitizes a username for public profiles to conform to constraint: ^[a-zA-Z0-9_-]{3,30}$
 */
export function sanitizeUsername(
  rawUsername?: string | null,
  userId = "user",
): string {
  if (rawUsername) {
    const cleaned = rawUsername.replace(/[^a-zA-Z0-9_-]/g, "");
    if (cleaned.length >= 3 && cleaned.length <= 30) {
      return cleaned;
    }
  }
  const cleanId = userId.replace(/[^a-zA-Z0-9_-]/g, "");
  const suffix = cleanId.slice(-8) || Math.random().toString(36).slice(2, 10);
  return `user_${suffix}`.slice(0, 30);
}

/**
 * Formats a display name from Clerk first/last name or fallback.
 */
export function formatDisplayName(
  firstName?: string | null,
  lastName?: string | null,
  fallback = "EcoShare Member",
): string {
  const parts = [firstName?.trim(), lastName?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : fallback;
}

export interface WebhookProcessResult {
  success: boolean;
  duplicate?: boolean;
  action: "created" | "updated" | "deleted" | "ignored";
  userId?: string;
}

/**
 * Processes a verified Clerk webhook event against the database with idempotency.
 * Uses the Supabase client (typically admin client) to manage profiles and user roles.
 */
export async function processClerkWebhookEvent(
  event: ClerkWebhookEvent,
  svixId: string,
  supabase: SupabaseClient<Database>,
): Promise<WebhookProcessResult> {
  // 1. Idempotency check: see if this svixId was already processed
  const { data: existingEvent, error: checkError } = await supabase
    .from("processed_webhook_events")
    .select("event_id")
    .eq("event_id", svixId)
    .maybeSingle();

  if (checkError) {
    throw new Error(`Failed to check webhook idempotency: ${checkError.message}`);
  }

  if (existingEvent) {
    return {
      success: true,
      duplicate: true,
      action: "ignored",
      userId: event.data.id,
    };
  }

  const userId = event.data.id;
  let action: WebhookProcessResult["action"] = "ignored";

  switch (event.type) {
    case "user.created": {
      const username = sanitizeUsername(event.data.username, userId);
      const displayName = formatDisplayName(
        event.data.first_name,
        event.data.last_name,
        username,
      );

      // Create or upsert profile
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: userId,
            username,
            display_name: displayName,
            avatar_url: event.data.image_url || null,
            total_xp: 0,
            level: 1,
            is_deleted: false,
          },
          { onConflict: "user_id" },
        );

      if (profileError) {
        throw new Error(`Failed to synchronize profile: ${profileError.message}`);
      }

      // Assign default 'user' role ONLY. Never assign elevated roles from webhook metadata!
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert(
          {
            user_id: userId,
            role: "user",
          },
          { onConflict: "user_id,role" },
        );

      if (roleError) {
        throw new Error(`Failed to assign default user role: ${roleError.message}`);
      }

      action = "created";
      break;
    }

    case "user.updated": {
      const username = sanitizeUsername(event.data.username, userId);
      const displayName = formatDisplayName(
        event.data.first_name,
        event.data.last_name,
        username,
      );

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          username,
          display_name: displayName,
          avatar_url: event.data.image_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (updateError) {
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }

      action = "updated";
      break;
    }

    case "user.deleted": {
      // Privacy-preserving account deletion:
      // Strip all personal identifiable information (PII) while preserving the profile row
      // in an anonymized tombstone state so verification audit logs and historical references
      // remain structurally valid.
      const anonymizedSuffix = Math.random().toString(36).slice(2, 10);
      const anonymizedUsername = `user_former_${anonymizedSuffix}`.slice(0, 30);

      const { error: deleteError } = await supabase
        .from("profiles")
        .update({
          username: anonymizedUsername,
          display_name: "EcoShare Former Member",
          avatar_url: null,
          bio: null,
          location: null,
          website: null,
          is_deleted: true,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (deleteError) {
        throw new Error(`Failed to anonymize profile on deletion: ${deleteError.message}`);
      }

      // Clean up assigned roles for deleted user
      await supabase.from("user_roles").delete().eq("user_id", userId);

      action = "deleted";
      break;
    }

    default:
      action = "ignored";
      break;
  }

  // 2. Record this event as processed in the idempotency log
  const { error: recordError } = await supabase
    .from("processed_webhook_events")
    .insert({
      event_id: svixId,
      event_type: event.type,
    });

  if (recordError) {
    // If concurrent webhook already inserted, that's fine
    if (!recordError.message.includes("duplicate key")) {
      throw new Error(`Failed to log processed webhook event: ${recordError.message}`);
    }
  }

  return {
    success: true,
    action,
    userId,
  };
}
