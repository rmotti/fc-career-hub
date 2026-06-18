import { test, expect } from "./fixtures";

// Smoke coverage for the public surface — these render without a backend
// (the boot-time session probe fails fast and the guards fall through to the
// public routes), so they stay green in CI without API credentials.
test.describe("public pages", () => {
  test("landing page loads", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/FC Career Hub/);
    await expect(page.getByText("FC Career Hub").first()).toBeVisible();
    await expect(page.locator('a[href="/register"]').first()).toBeVisible();
  });

  test("login page renders the sign-in form", async ({ page }) => {
    await page.goto("/login");

    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});
