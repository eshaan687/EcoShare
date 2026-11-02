import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  ECOSHARE_COLORS,
  ECOSHARE_FEED_TABS,
} from "@/lib/constants/design-tokens";

describe("EcoShare design tokens and Tailwind CSS 4 configuration", () => {
  it("preserves exact approved hex colors and feed tabs", () => {
    expect(ECOSHARE_COLORS).toEqual({
      primary: "#22C55E",
      primaryDark: "#15803D",
      secondary: "#A7F3D0",
      background: "#F8FAFC",
      surface: "#FFFFFF",
      textPrimary: "#0F172A",
      textSecondary: "#64748B",
      border: "#E2E8F0",
      success: "#10B981",
      warning: "#F59E0B",
      error: "#EF4444",
    });

    expect(ECOSHARE_FEED_TABS.map((t) => t.label)).toEqual([
      "For You",
      "Following",
      "Verified Impact",
    ]);
  });

  it("maps --ecoshare-* raw tokens to --color-* in globals.css without circular self-reference", () => {
    const cssPath = path.resolve(process.cwd(), "src/app/globals.css");
    const css = fs.readFileSync(cssPath, "utf8");

    expect(css).toContain("--ecoshare-primary: #22C55E;");
    expect(css).toContain("--color-primary: var(--ecoshare-primary);");
    expect(css).not.toContain("--color-primary: var(--color-primary);");
  });
});
