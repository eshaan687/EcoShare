import { describe, expect, it, vi } from "vitest";
import { Webhook } from "svix";
import {
  formatDisplayName,
  processClerkWebhookEvent,
  sanitizeUsername,
  verifyClerkWebhookSignature,
  type ClerkWebhookEvent,
} from "@/lib/auth/webhook-handler";
import type { Database } from "@/types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

const TEST_SECRET = "whsec_MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTI=";

function signPayload(payload: string, secret = TEST_SECRET) {
  const wh = new Webhook(secret);
  const timestamp = new Date();
  const msgId = `msg_${Math.random().toString(36).slice(2, 10)}`;
  const signature = wh.sign(msgId, timestamp, payload);
  return {
    "svix-id": msgId,
    "svix-timestamp": Math.floor(timestamp.getTime() / 1000).toString(),
    "svix-signature": signature,
  };
}

describe("Clerk Webhook Signature Verification & Sanitization", () => {
  it("rejects when required Svix headers are missing", () => {
    expect(() =>
      verifyClerkWebhookSignature("{}", {}, TEST_SECRET),
    ).toThrow("Missing required Svix webhook verification headers");

    expect(() =>
      verifyClerkWebhookSignature(
        "{}",
        { "svix-id": "msg_123", "svix-timestamp": "12345" },
        TEST_SECRET,
      ),
    ).toThrow("Missing required Svix webhook verification headers");
  });

  it("verifies and parses a legitimately signed Svix webhook payload", () => {
    const rawPayload = JSON.stringify({
      type: "user.created",
      data: {
        id: "user_2testCreatedId",
        first_name: "Jane",
        last_name: "Goodall",
        username: "janegoodall",
      },
    });

    const headers = signPayload(rawPayload, TEST_SECRET);
    const event = verifyClerkWebhookSignature(rawPayload, headers, TEST_SECRET);

    expect(event.type).toBe("user.created");
    expect(event.data.id).toBe("user_2testCreatedId");
    expect(event.data.first_name).toBe("Jane");
  });

  it("rejects tampered payloads with invalid signatures", () => {
    const legitimatePayload = JSON.stringify({
      type: "user.created",
      data: { id: "user_2realUser" },
    });
    const headers = signPayload(legitimatePayload, TEST_SECRET);

    const tamperedPayload = JSON.stringify({
      type: "user.created",
      data: { id: "user_2tamperedHackerUser" },
    });

    expect(() =>
      verifyClerkWebhookSignature(tamperedPayload, headers, TEST_SECRET),
    ).toThrow();
  });

  it("sanitizes username and enforces length boundaries", () => {
    expect(sanitizeUsername("alex_chen", "user_123")).toBe("alex_chen");
    expect(sanitizeUsername("alex!@#chen$$$", "user_123")).toBe("alexchen");
    expect(sanitizeUsername("", "user_abc12345")).toBe("user_abc12345");
    expect(sanitizeUsername(null, "user_longidentifier12345")).toBe("user_ier12345");
  });

  it("formats display name or falls back appropriately", () => {
    expect(formatDisplayName("Marcus", "Vance")).toBe("Marcus Vance");
    expect(formatDisplayName("Marcus", null)).toBe("Marcus");
    expect(formatDisplayName(null, null, "Custom Fallback")).toBe("Custom Fallback");
  });
});

describe("Clerk Webhook Synchronization & Idempotency", () => {
  it("processes user.created event by creating profile and assigning default 'user' role ONLY", async () => {
    const upsertedProfiles: unknown[] = [];
    const upsertedRoles: unknown[] = [];
    const insertedEvents: unknown[] = [];

    const mockSupabase = {
      from: (table: string) => {
        if (table === "processed_webhook_events") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
            insert: async (row: unknown) => {
              insertedEvents.push(row);
              return { error: null };
            },
          };
        }
        if (table === "profiles") {
          return {
            upsert: async (row: unknown) => {
              upsertedProfiles.push(row);
              return { error: null };
            },
          };
        }
        if (table === "user_roles") {
          return {
            upsert: async (row: unknown) => {
              upsertedRoles.push(row);
              return { error: null };
            },
          };
        }
        throw new Error(`Unexpected table ${table}`);
      },
    } as unknown as SupabaseClient<Database>;

    const event: ClerkWebhookEvent = {
      type: "user.created",
      data: {
        id: "user_2newEcoUser",
        username: "eco_warrior",
        first_name: "Elena",
        last_name: "Rostova",
        image_url: "https://example.com/avatar.jpg",
        public_metadata: { role: "admin" }, // Attacker trying to inject admin role in Clerk metadata!
      },
    };

    const result = await processClerkWebhookEvent(
      event,
      "evt_svix_msg_101",
      mockSupabase,
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe("created");

    // Profile check
    expect(upsertedProfiles).toHaveLength(1);
    expect(upsertedProfiles[0]).toMatchObject({
      user_id: "user_2newEcoUser",
      username: "eco_warrior",
      display_name: "Elena Rostova",
      total_xp: 0,
      level: 1,
      is_deleted: false,
    });

    // Security check: Must assign default 'user' role only, strictly ignoring metadata role!
    expect(upsertedRoles).toHaveLength(1);
    expect(upsertedRoles[0]).toEqual({
      user_id: "user_2newEcoUser",
      role: "user",
    });

    // Idempotency check: Processed event recorded
    expect(insertedEvents).toHaveLength(1);
    expect(insertedEvents[0]).toMatchObject({
      event_id: "evt_svix_msg_101",
      event_type: "user.created",
    });
  });

  it("handles duplicate event delivery idempotently without mutations", async () => {
    const upsertProfileSpy = vi.fn();

    const mockSupabase = {
      from: (table: string) => {
        if (table === "processed_webhook_events") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { event_id: "evt_duplicate_202" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "profiles") {
          return { upsert: upsertProfileSpy };
        }
        throw new Error(`Unexpected table ${table}`);
      },
    } as unknown as SupabaseClient<Database>;

    const event: ClerkWebhookEvent = {
      type: "user.created",
      data: { id: "user_2existingUser" },
    };

    const result = await processClerkWebhookEvent(
      event,
      "evt_duplicate_202",
      mockSupabase,
    );

    expect(result.success).toBe(true);
    expect(result.duplicate).toBe(true);
    expect(result.action).toBe("ignored");
    expect(upsertProfileSpy).not.toHaveBeenCalled();
  });

  it("processes user.deleted by anonymizing profile and preserving audit log integrity", async () => {
    let updatedProfileData: unknown = null;
    let deletedRoleUserId: unknown = null;

    const mockSupabase = {
      from: (table: string) => {
        if (table === "processed_webhook_events") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
            insert: async () => ({ error: null }),
          };
        }
        if (table === "profiles") {
          return {
            update: (data: unknown) => {
              updatedProfileData = data;
              return {
                eq: async () => ({ error: null }),
              };
            },
          };
        }
        if (table === "user_roles") {
          return {
            delete: () => ({
              eq: async (_col: string, val: unknown) => {
                deletedRoleUserId = val;
                return { error: null };
              },
            }),
          };
        }
        throw new Error(`Unexpected table ${table}`);
      },
    } as unknown as SupabaseClient<Database>;

    const event: ClerkWebhookEvent = {
      type: "user.deleted",
      data: { id: "user_2deleteMe" },
    };

    const result = await processClerkWebhookEvent(
      event,
      "evt_delete_303",
      mockSupabase,
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe("deleted");

    // Check PII anonymization
    expect(updatedProfileData).toMatchObject({
      display_name: "EcoShare Former Member",
      avatar_url: null,
      bio: null,
      location: null,
      website: null,
      is_deleted: true,
    });
    expect(deletedRoleUserId).toBe("user_2deleteMe");
  });
});
