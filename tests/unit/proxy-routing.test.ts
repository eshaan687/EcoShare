import { describe, expect, it } from "vitest";
import { isProtectedRequestPath } from "@/lib/auth/proxy";
import { sanitizeRedirectPath } from "@/lib/security/redirect";

describe("Next.js 16 Clerk proxy route protection classification", () => {
  it("allows guest preview browsing of canonical discovery, /home, and prototype shell routes", () => {
    expect(isProtectedRequestPath("/")).toBe(false);
    expect(isProtectedRequestPath("/home")).toBe(false);
    expect(isProtectedRequestPath("/explore")).toBe(false);
    expect(isProtectedRequestPath("/communities")).toBe(false);
    expect(isProtectedRequestPath("/communities/ocean-cleanups")).toBe(false);
    expect(isProtectedRequestPath("/challenges")).toBe(false);
    expect(isProtectedRequestPath("/impact")).toBe(false);
    expect(isProtectedRequestPath("/messages")).toBe(false);
    expect(isProtectedRequestPath("/notifications")).toBe(false);
    expect(isProtectedRequestPath("/bookmarks")).toBe(false);
    expect(isProtectedRequestPath("/settings")).toBe(false);
    expect(isProtectedRequestPath("/profile")).toBe(false);
    expect(isProtectedRequestPath("/u/alexr")).toBe(false);
    expect(
      isProtectedRequestPath("/impact/123e4567-e89b-12d3-a456-426614174000"),
    ).toBe(false);
  });

  it("strictly requires authentication for mutation and administrative routes", () => {
    expect(isProtectedRequestPath("/create")).toBe(true);
    expect(isProtectedRequestPath("/profile/edit")).toBe(true);
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
