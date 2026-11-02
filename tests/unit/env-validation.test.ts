import { describe, expect, it } from "vitest";
import { isSupabaseClientConfigured, parseClientEnv } from "@/lib/env.client";

describe("EcoShare environment validation", () => {
  it("defaults NEXT_PUBLIC_APP_URL and treats Supabase as unconfigured when keys are blank", () => {
    const env = parseClientEnv({
      NEXT_PUBLIC_APP_URL: "",
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
    });

    expect(env.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
    expect(isSupabaseClientConfigured(env)).toBe(false);
  });

  it("validates configured Supabase URL and anon key", () => {
    const env = parseClientEnv({
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-anon-key-placeholder",
    });

    expect(isSupabaseClientConfigured(env)).toBe(true);
  });

  it("rejects malformed NEXT_PUBLIC_SUPABASE_URL", () => {
    expect(() =>
      parseClientEnv({
        NEXT_PUBLIC_SUPABASE_URL: "not-a-valid-url",
      }),
    ).toThrow();
  });
});
