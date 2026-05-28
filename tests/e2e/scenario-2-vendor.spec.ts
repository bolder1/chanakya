import { test, expect } from "@playwright/test";

test.describe("Scenario 2 — Vendor invoice anomalies", () => {
  test("/vendors/anomalies shows the 6 invoice anomalies", async ({ page }) => {
    await page.goto("/vendors/anomalies");
    await expect(page.getByRole("heading", { name: /Vendor invoice anomalies/i })).toBeVisible();

    await expect(page.getByText(/Bharat Logistics.*invoice header/i).first()).toBeVisible();
    await expect(page.getByText(/NorthStar.*two invoices/i).first()).toBeVisible();
    await expect(page.getByText(/DataDrive.*price drift/i).first()).toBeVisible();
    await expect(page.getByText(/Kaveri Travel House/i).first()).toBeVisible();
    await expect(page.getByText(/Sahyadri.*GST/i).first()).toBeVisible();
    await expect(page.getByText(/Madhuri Catering.*GSTIN/i).first()).toBeVisible();
  });

  test("Bharat Logistics vendor page shows the missing-line anomaly", async ({ page }) => {
    await page.goto("/vendors/VEN-022");
    // Vendor's full legal name is the h1 on the page
    await expect(page.getByText("Bharat Logistics Pvt Ltd").first()).toBeVisible();
    await expect(page.getByText(/Bharat Logistics.*invoice header/i).first()).toBeVisible();
  });

  test("DataDrive vendor detail renders monthly spend chart", async ({ page }) => {
    await page.goto("/vendors/VEN-014");
    await expect(page.getByText("DataDrive Hardware Solutions Pvt Ltd").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /Monthly spend/i })).toBeVisible();
    await expect(page.locator(".recharts-surface").first()).toBeVisible();
  });
});
