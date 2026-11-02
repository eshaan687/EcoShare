import { expect, test } from "@playwright/test";

const ARTIFACT_DIR =
  "/Users/eshaan/.gemini/antigravity/brain/ddcedf4a-33a9-4080-a236-8a1f24fa5577";

test.describe("Milestone 1 UI Foundation & Responsive Verification", () => {
  test("renders Welcome & Onboarding page (/) without horizontal overflow", async ({
    page,
  }, testInfo) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /Connect for a Greener Tomorrow/i,
      }),
    ).toBeVisible();

    await expect(
      page.getByText("Share Actions. Inspire Change.").first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Get Started" }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Log In/i }).first(),
    ).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(() => {
      return (
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth
      );
    });
    expect(hasHorizontalOverflow).toBe(false);

    if (testInfo.project.name === "desktop-1440") {
      await page.screenshot({
        path: `${ARTIFACT_DIR}/milestone1-welcome-desktop-1440.png`,
        fullPage: true,
      });
    }
    if (testInfo.project.name === "mobile-390") {
      await page.screenshot({
        path: `${ARTIFACT_DIR}/milestone1-welcome-mobile-390.png`,
        fullPage: true,
      });
    }
  });

  test("renders /home feed in guest preview mode with working tabs, action dialog, and zero horizontal overflow", async ({
    page,
  }, testInfo) => {
    await page.goto("/home");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Share Actions. Inspire Change.",
      }),
    ).toBeVisible();

    await expect(page.getByRole("tab", { name: "For You" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Following" })).toBeVisible();
    await expect(
      page.getByRole("tab", { name: /Verified Impact/i }),
    ).toBeVisible();

    await expect(page.getByText("Sofia M.")).toBeVisible();
    await expect(
      page.getByText(/Cleaned up litter at Fundidora Park today/i),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Log In/i }).first(),
    ).toBeVisible();

    // Capture reference screenshots before interacting with tabs/dialogs
    if (testInfo.project.name === "desktop-1440") {
      await page.screenshot({
        path: `${ARTIFACT_DIR}/milestone1-home-desktop-1440.png`,
        fullPage: true,
      });
    }
    if (testInfo.project.name === "mobile-390") {
      await page.screenshot({
        path: `${ARTIFACT_DIR}/milestone1-home-mobile-390.png`,
        fullPage: false,
      });
    }

    // Switch to "Verified Impact" tab and verify non-verified discussion post is filtered out
    await page.getByRole("tab", { name: /Verified Impact/i }).click();
    await expect(page.getByText("Sofia M.")).toBeVisible();
    await expect(page.getByText("Elena K.")).toHaveCount(0);

    // Switch back to "For You"
    await page.getByRole("tab", { name: "For You" }).click();
    await expect(page.getByText("Elena K.")).toBeVisible();

    // Open "Share Your Action" dialog and verify guest sign-in prompt & submission modes
    await page.getByRole("button", { name: "Share Your Action" }).click();
    await expect(
      page.getByRole("dialog", { name: "Share an Environmental Action" }),
    ).toBeVisible();
    await expect(page.getByText(/Guest Preview Mode/i)).toBeVisible();

    if (testInfo.project.name === "desktop-1440") {
      await page.screenshot({
        path: `${ARTIFACT_DIR}/milestone1-create-dialog-desktop-1440.png`,
      });
    }

    await page.getByRole("button", { name: "Close dialog" }).click();

    // Verify mobile navigation drawer and bottom nav on mobile viewports (< 768px)
    const viewport = page.viewportSize();
    if (viewport && viewport.width < 768) {
      await expect(
        page.getByRole("navigation", { name: "Mobile bottom navigation" }),
      ).toBeVisible();

      await page.getByRole("button", { name: "Open navigation menu" }).click();
      await expect(
        page.getByRole("dialog", { name: "Mobile navigation drawer" }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Close navigation menu" }).click();
    }

    const hasHorizontalOverflow = await page.evaluate(() => {
      return (
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth
      );
    });
    expect(hasHorizontalOverflow).toBe(false);
  });

  test("renders Explore, Communities, Challenges, Impact, Profile, and prototype sidebar routes without overflow", async ({
    page,
  }, testInfo) => {
    const routesToVerify = [
      { path: "/explore", heading: /Explore EcoShare/i },
      { path: "/communities", heading: /Environmental Communities/i },
      { path: "/challenges", heading: /Environmental Challenges/i },
      { path: "/impact", heading: /My Environmental Impact/i },
      { path: "/messages", heading: /Direct Messages/i },
      { path: "/notifications", heading: /Notifications/i },
      { path: "/bookmarks", heading: /Saved Bookmarks/i },
      { path: "/settings", heading: /Account & Profile Settings/i },
      { path: "/profile", heading: /Alex R\./i },
      { path: "/u/sofiam", heading: /Sofia M\./i },
    ] as const;

    for (const route of routesToVerify) {
      await page.goto(route.path);
      await expect(
        page.getByRole("heading", { level: 1, name: route.heading }),
      ).toBeVisible();

      const hasHorizontalOverflow = await page.evaluate(() => {
        return (
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth
        );
      });
      expect(hasHorizontalOverflow).toBe(false);

      if (
        route.path === "/profile" &&
        testInfo.project.name === "desktop-1440"
      ) {
        await page.screenshot({
          path: `${ARTIFACT_DIR}/milestone1-profile-desktop-1440.png`,
          fullPage: true,
        });
      }
      if (
        route.path === "/impact" &&
        testInfo.project.name === "desktop-1440"
      ) {
        await page.screenshot({
          path: `${ARTIFACT_DIR}/milestone1-impact-desktop-1440.png`,
          fullPage: true,
        });
      }
    }
  });

  test("returns healthy status from /api/health", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.milestone).toBe(1);
    expect(typeof body.clerkConfigured).toBe("boolean");
    expect(typeof body.supabaseConfigured).toBe("boolean");
  });

  test("protects private administrative and mutation routes via proxy by redirecting unauthenticated requests to sign-in", async ({
    request,
  }) => {
    const response = await request.get("/admin", { maxRedirects: 0 });
    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.status()).toBeLessThan(400);
    expect(response.headers()["location"]).toMatch(/\/(sign-in|login)/);
  });
});
