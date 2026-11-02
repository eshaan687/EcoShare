import { describe, expect, it } from "vitest";
import { sanitizeRedirectPath } from "@/lib/security/redirect";
import { isProtectedRequestPath } from "@/lib/supabase/proxy";

describe("Next.js 16 proxy route protection classification", () => {
  it("allows public browsing of canonical discovery and approved impact routes", () => {
    expect(isProtectedRequestPath("/")).toBe(false);
    expect(isProtectedRequestPath("/explore")).toBe(false);
    expect(isProtectedRequestPath("/communities")).toBe(false);
    expect(isProtectedRequestPath("/communities/ocean-cleanups")).toBe(false);
    expect(isProtectedRequestPath("/challenges")).toBe(false);
    expect(isProtectedRequestPath("/u/alexr")).toBe(false);
    expect(isProtectedRequestPath("/impact/123e4567-e89b-12d3-a456-426614174000")).toBe(
      false,
    );
  });

  it("requires authentication for private shell and administrative routes", () => {
    expect(isProtectedRequestPath("/home")).toBe(true);
    expect(isProtectedRequestPath("/impact")).toBe(true);
    expect(isProtectedRequestPath("/create")).toBe(true);
    expect(isProtectedRequestPath("/messages")).toBe(true);
    expect(isProtectedRequestPath("/notifications")).toBe(true);
    expect(isProtectedRequestPath("/bookmarks")).toBe(true);
    expect(isProtectedRequestPath("/profile")).toBe(true);
    expect(isProtectedRequestPath("/profile/edit")).toBe(true);
    expect(isProtectedRequestPath("/settings")).toBe(true);
    expect(isProtectedRequestPath("/admin")).toBe(true);
    expect(isProtectedRequestPath("/admin/submissions")).toBe(true);
  });

  it("blocks open redirect attempts in sanitizeRedirectPath", () => {
    expect(sanitizeRedirectPath("/home")).toBe("/home");
    expect(sanitizeRedirectPath("/communities/beach-cleanups")).toBe(
      "/communities/beach-cleanups",
    );
    expect(sanitizeRedirectPath("https://evil.example.com")).toBe("/home");
    expect(sanitizeRedirectPath("//evil.example.com")).toBe("/home");
    expect(sanitizeRedirectPath("/\\evil.example.com")).toBe("/home");
    expect(sanitizeRedirectPath(null)).toBe("/home");
  });
});
