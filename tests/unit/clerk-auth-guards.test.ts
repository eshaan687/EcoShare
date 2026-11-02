import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  requireAuthenticatedUser,
  requireAuthorizedRole,
  type SupabaseServerClientFactory,
} from "@/lib/auth/guards";
import type { EcoShareRole } from "@/types/database.types";

function createMockRoleSupabaseClient(
  roles: readonly EcoShareRole[],
  error: Error | null = null,
): SupabaseServerClientFactory {
  return async () => ({
    from: () =>
      ({
        select: () => ({
          eq: async () => ({
            data: error ? null : roles.map((role) => ({ role })),
            error,
          }),
        }),
      }) as unknown as ReturnType<
        Awaited<ReturnType<SupabaseServerClientFactory>>["from"]
      >,
  });
}

describe("Clerk server-side authentication and database role authorization guards", () => {
  it("rejects unauthenticated requests when Clerk auth() returns null userId", async () => {
    await expect(
      requireAuthenticatedUser(async () => ({
        userId: null,
        sessionId: null,
      })),
    ).rejects.toThrow("Authentication required");
  });

  it("returns the verified Clerk userId and sessionId when authenticated", async () => {
    const actor = await requireAuthenticatedUser(async () => ({
      userId: "user_2clerkVerifiedId",
      sessionId: "sess_2clerkSession",
    }));

    expect(actor).toEqual({
      userId: "user_2clerkVerifiedId",
      sessionId: "sess_2clerkSession",
    });
  });

  it("authorizes callers whose Clerk userId holds a required role in public.user_roles", async () => {
    const result = await requireAuthorizedRole(["verifier", "admin"], {
      resolveAuth: async () => ({
        userId: "user_2verifierAccount",
        sessionId: "sess_123",
      }),
      getSupabaseClient: createMockRoleSupabaseClient(["user", "verifier"]),
    });

    expect(result.userId).toBe("user_2verifierAccount");
    expect(result.roles).toEqual(["user", "verifier"]);
  });

  it("rejects standard users or moderators attempting verifier/admin operations", async () => {
    await expect(
      requireAuthorizedRole(["verifier", "admin"], {
        resolveAuth: async () => ({
          userId: "user_2moderatorAccount",
          sessionId: "sess_456",
        }),
        getSupabaseClient: createMockRoleSupabaseClient(["user", "moderator"]),
      }),
    ).rejects.toThrow("Insufficient role permissions");
  });

  it("fails closed when querying public.user_roles returns a database error", async () => {
    await expect(
      requireAuthorizedRole(["admin"], {
        resolveAuth: async () => ({
          userId: "user_2adminCandidate",
          sessionId: "sess_789",
        }),
        getSupabaseClient: createMockRoleSupabaseClient(
          [],
          new Error("DB connection failed"),
        ),
      }),
    ).rejects.toThrow("Failed to verify user role permissions");
  });
});
