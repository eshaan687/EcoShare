import { describe, expect, it } from "vitest";
import {
  isClerkClientConfigured,
  isSupabaseClientConfigured,
  parseClientEnv,
} from "@/lib/env.client";

describe("EcoShare Clerk + Supabase environment validation", () => {
  it("defaults URLs and treats Clerk and Supabase as unconfigured when keys are blank", () => {
    const env = parseClientEnv({
      NEXT_PUBLIC_APP_URL: "",
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "",
      NEXT_PUBLIC_CLERK_SIGN_IN_URL: "",
      NEXT_PUBLIC_CLERK_SIGN_UP_URL: "",
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
    });

    expect(env.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
    expect(env.NEXT_PUBLIC_CLERK_SIGN_IN_URL).toBe("/login");
    expect(env.NEXT_PUBLIC_CLERK_SIGN_UP_URL).toBe("/signup");
    expect(isClerkClientConfigured(env)).toBe(false);
    expect(isSupabaseClientConfigured(env)).toBe(false);
  });

  it("validates configured Clerk publishable key and Supabase URL + anon key", () => {
    const env = parseClientEnv({
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_example_placeholder",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-anon-key-placeholder",
    });

    expect(isClerkClientConfigured(env)).toBe(true);
    expect(isSupabaseClientConfigured(env)).toBe(true);
  });

  it("validates standardized NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and aliases anon key", () => {
    const env = parseClientEnv({
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_standard",
      NEXT_PUBLIC_SUPABASE_URL: "https://standard.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_key_standard",
    });

    expect(isSupabaseClientConfigured(env)).toBe(true);
    expect(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBe(
      "sb_publishable_key_standard",
    );
    expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe(
      "sb_publishable_key_standard",
    );
  });

  it("rejects malformed NEXT_PUBLIC_SUPABASE_URL", () => {
    expect(() =>
      parseClientEnv({
        NEXT_PUBLIC_SUPABASE_URL: "not-a-valid-url",
      }),
    ).toThrow();
  });
});
