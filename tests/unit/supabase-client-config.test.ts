import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockCreateSupabaseClient = vi.fn();
vi.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) => mockCreateSupabaseClient(...args),
}));

const mockAuth = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({
  auth: () => mockAuth(),
}));

import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

describe("Supabase Client Architecture & Clerk Token Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Browser Supabase Client", () => {
    it("initializes browser client with publishable key and Clerk accessToken callback", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://testproj.supabase.co");
      vi.stubEnv(
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
        "sb_pub_key_test_12345",
      );

      mockCreateSupabaseClient.mockReturnValue({
        client: "mockBrowserClient",
      });

      const getAccessToken = vi.fn().mockResolvedValue("clerk_jwt_token_abc");
      const client = createBrowserClient(getAccessToken);

      expect(client).toBeDefined();
      expect(mockCreateSupabaseClient).toHaveBeenCalledWith(
        "https://testproj.supabase.co",
        "sb_pub_key_test_12345",
        expect.objectContaining({
          accessToken: expect.any(Function),
        }),
      );

      // Verify the accessToken callback resolves the provided token
      const passedOptions = mockCreateSupabaseClient.mock.calls[0]?.[2] as
        | { accessToken: () => Promise<string | null> }
        | undefined;
      expect(passedOptions?.accessToken).toBeDefined();
      const token = await passedOptions!.accessToken();
      expect(token).toBe("clerk_jwt_token_abc");
      expect(getAccessToken).toHaveBeenCalledTimes(1);
    });

    it("falls back to NEXT_PUBLIC_SUPABASE_ANON_KEY if publishable key is not set", () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://testproj.supabase.co");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "sb_anon_key_legacy_fallback");

      mockCreateSupabaseClient.mockReturnValue({ client: "mockClient" });

      createBrowserClient();

      expect(mockCreateSupabaseClient).toHaveBeenCalledWith(
        "https://testproj.supabase.co",
        "sb_anon_key_legacy_fallback",
        expect.any(Object),
      );
    });

    it("throws a descriptive error when Supabase configuration is missing", () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

      expect(() => createBrowserClient()).toThrow(
        "Supabase browser client is not configured",
      );
    });
  });

  describe("Server Supabase Client", () => {
    it("initializes server client and invokes Clerk auth().getToken()", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://testproj.supabase.co");
      vi.stubEnv(
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
        "sb_pub_key_test_12345",
      );

      mockAuth.mockResolvedValue({
        userId: "user_2testServerUser",
        getToken: vi.fn().mockResolvedValue("server_clerk_jwt_xyz"),
      });

      mockCreateSupabaseClient.mockReturnValue({ client: "mockServerClient" });

      const client = await createServerClient();
      expect(client).toBeDefined();

      const passedOptions = mockCreateSupabaseClient.mock.calls[0]?.[2] as
        | { accessToken: () => Promise<string | null> }
        | undefined;
      expect(passedOptions?.accessToken).toBeDefined();
      const token = await passedOptions!.accessToken();
      expect(token).toBe("server_clerk_jwt_xyz");
    });
  });

  describe("Admin Supabase Client", () => {
    it("initializes admin client with SUPABASE_SERVICE_ROLE_KEY and disables session persistence", () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://testproj.supabase.co");
      vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service_role_secret_key_abc");

      mockCreateSupabaseClient.mockReturnValue({ client: "mockAdminClient" });

      const adminClient = createAdminClient();
      expect(adminClient).toBeDefined();

      expect(mockCreateSupabaseClient).toHaveBeenCalledWith(
        "https://testproj.supabase.co",
        "service_role_secret_key_abc",
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        },
      );
    });

    it("throws an error when SUPABASE_SERVICE_ROLE_KEY is absent", () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://testproj.supabase.co");
      vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

      expect(() => createAdminClient()).toThrow(
        "Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
      );
    });
  });
});
