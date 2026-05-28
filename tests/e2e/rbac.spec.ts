import { test, expect } from "@playwright/test";

test.describe("RBAC", () => {
  test("CFO sidebar shows everything except Settings", async ({ page }) => {
    await page.goto("/dashboard");

    const sidebar = page.locator("aside").first();
    await expect(sidebar.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Anomalies" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Payroll" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Vendors" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Spend" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: /Ask/ })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Uploads" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Integrations" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Audit" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Demo tour" })).toBeVisible();

    // CFO does NOT have settings.users
    await expect(sidebar.getByRole("link", { name: "Settings" })).toHaveCount(0);
  });

  test("topbar shows the logged-in user's name and role", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("header").getByText("Surajit Roy")).toBeVisible();
    await expect(page.locator("header").getByText(/CFO.*FINANCE/i)).toBeVisible();
  });
});
