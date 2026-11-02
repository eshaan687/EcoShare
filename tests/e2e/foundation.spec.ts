import { expect, test } from "@playwright/test";

test.describe("Milestone 0 Foundation Verification", () => {
  test("renders the foundation status screen without horizontal overflow", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Share Actions. Inspire Change.",
      }),
    ).toBeVisible();

    await expect(page.getByText("For You")).toBeVisible();
    await expect(page.getByText("Following")).toBeVisible();
    await expect(page.getByText("Verified Impact")).toBeVisible();
    await expect(page.getByText("Planet Protector")).toBeVisible();
    await expect(page.getByText("Earth Champion")).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(() => {
      return (
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth
      );
    });
    expect(hasHorizontalOverflow).toBe(false);
  });

  test("returns healthy status from /api/health", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.milestone).toBe(0);
  });
});
