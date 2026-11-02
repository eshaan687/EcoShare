import { describe, expect, it } from "vitest";

describe("Server-only boundary enforcement", () => {
  it("prevents importing SUPABASE_SERVICE_ROLE_KEY admin client in client environment", async () => {
    await expect(import("@/lib/supabase/admin")).rejects.toThrow(
      /This module cannot be imported from a Client Component module/,
    );
  });

  it("prevents importing server-only Supabase client in client environment", async () => {
    await expect(import("@/lib/supabase/server")).rejects.toThrow(
      /This module cannot be imported from a Client Component module/,
    );
  });

  it("prevents importing server-only environment schema in client environment", async () => {
    await expect(import("@/lib/env.server")).rejects.toThrow(
      /This module cannot be imported from a Client Component module/,
    );
  });

  it("prevents importing server-only auth guards in client environment", async () => {
    await expect(import("@/lib/auth/guards")).rejects.toThrow(
      /This module cannot be imported from a Client Component module/,
    );
  });
});
