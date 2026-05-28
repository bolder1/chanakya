import { test, expect } from "@playwright/test";

test.describe("Demo finale — Tour Mode, Audit, Integrations", () => {
  test("/tour renders 4 scenarios with 12 step chips total", async ({ page }) => {
    await page.goto("/tour");
    await expect(page.getByRole("heading", { name: /22-minute Chanakya demo/i })).toBeVisible();

    // Scenario anchors
    for (let n = 1; n <= 4; n++) {
      await expect(page.locator(`#scenario-${n}`)).toBeVisible();
    }

    // Each scenario has 3 step chips → 12 total step chips (anchor links).
    // We assert at least 12 chip-shaped elements inside the scenario sections.
    const stepChips = page.locator('section[id^="scenario-"] a');
    await expect(stepChips).toHaveCount(12);
  });

  test("/audit shows append-only log with entries from prior runs", async ({ page }) => {
    await page.goto("/audit");
    await expect(page.getByRole("heading", { name: /Audit log|Append-only log/i }).first()).toBeVisible();

    // Should have at least one row given prior bulk-acknowledge action
    const rows = page.locator("tbody tr");
    await expect(rows.first()).toBeVisible();
  });

  test("/integrations lists six connectors and exposes the email inbox link", async ({ page }) => {
    await page.goto("/integrations");
    await expect(page.getByRole("heading", { name: "Zoho People" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Email inbox/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Slack alerts/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Open inbox/i })).toBeVisible();
  });

  test("/integrations/email-inbox shows 4 emails from real vendors", async ({ page }) => {
    await page.goto("/integrations/email-inbox");
    // The inbox hero card has the email address as h1; the topbar also shows it
    await expect(page.locator("h1").filter({ hasText: "invoices@chanakya.app" }).first()).toBeVisible();
    await expect(page.getByText("SahyadriTech Billing").first()).toBeVisible();
    await expect(page.getByText("Bharat Logistics — Accounts").first()).toBeVisible();
    await expect(page.getByText("Madhuri Catering AR").first()).toBeVisible();
    await expect(page.getByText("DataDrive Hardware").first()).toBeVisible();
  });
});
