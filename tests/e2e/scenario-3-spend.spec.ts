import { test, expect } from "@playwright/test";

test.describe("Scenario 3 — External spend variance", () => {
  test("/spend shows category cards including Laptops with variance", async ({ page }) => {
    await page.goto("/spend");
    await expect(page.getByRole("heading", { name: "Laptops" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Vegetables & Pantry" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Conference Catering" })).toBeVisible();
  });

  test("/spend/anomalies lists all 4 spend anomalies", async ({ page }) => {
    await page.goto("/spend/anomalies");
    // The page-level h1 includes a count: "Spend anomalies — N" — match that
    await expect(page.getByRole("heading", { name: /Spend anomalies\s+—/i })).toBeVisible();

    await expect(page.getByText(/Laptops.*\+131%/i).first()).toBeVisible();
    await expect(page.getByText(/Tomato.*\+86%|tomatoes|Annapurna/i).first()).toBeVisible();
    await expect(page.getByText(/Off-contract catering|Tasty Bites/i).first()).toBeVisible();
    await expect(page.getByText(/split purchase|NorthStar.*9 days/i).first()).toBeVisible();
  });

  test("category drill renders monthly trend chart", async ({ page }) => {
    await page.goto("/spend");
    await page.getByRole("link", { name: /Laptops/i }).first().click();
    await page.waitForURL("**/spend/categories/**");
    await expect(page.getByRole("heading", { name: /Monthly spend/i })).toBeVisible();
    await expect(page.locator(".recharts-surface").first()).toBeVisible();
  });
});
