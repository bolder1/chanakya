import { test, expect } from "@playwright/test";

test.describe("Scenario 1 — Salary anomaly (EMP-0142 duplicate net pay)", () => {
  test("dashboard surfaces the CRITICAL anomaly on EMP-0142", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText(/EMP-0142/).first()).toBeVisible();
    await expect(page.getByText(/2[,.]04[,.]800/).first()).toBeVisible();
  });

  test("payroll anomaly inbox lists payroll-domain anomalies for Apr 2026", async ({ page }) => {
    await page.goto("/payroll/2026-04/anomalies");
    await expect(
      page.getByRole("heading", { name: /Payroll anomalies.*Apr 2026/i }),
    ).toBeVisible();
    // Should include the duplicate-pay anomaly
    await expect(page.getByText(/EMP-0142 net pay 2× the trailing-12 median/i)).toBeVisible();
  });

  test("employee detail renders chart + full salary breakdown + anomalies", async ({ page }) => {
    await page.goto("/payroll/employees/EMP-0142");
    await expect(page.getByRole("heading", { name: "Aarav Mehta" })).toBeVisible();

    // 18-month chart is a recharts SVG
    await expect(page.locator(".recharts-surface").first()).toBeVisible();

    // Real MiniOrange column names present
    await expect(page.getByText(/^BASIC$/).first()).toBeVisible();
    await expect(page.getByText(/Provident Fund/).first()).toBeVisible();
    await expect(page.getByText(/PROF TAX/).first()).toBeVisible();
    await expect(page.getByText(/GUEST HOUSE\/OTHER/).first()).toBeVisible();
    await expect(page.getByText(/REIMBURSEMENT/).first()).toBeVisible();

    // Anomalies block is present
    await expect(page.getByRole("heading", { name: /Anomalies on EMP-0142/i })).toBeVisible();
  });

  test("explain drawer opens with the duplicate-run narrative", async ({ page }) => {
    await page.goto("/payroll/2026-04/anomalies");

    // Click the first Explain button (CRITICAL anomaly is sorted first)
    const explainBtn = page.getByRole("button", { name: "Explain" }).first();
    await explainBtn.click();

    const drawer = page.locator("aside.fixed").last();
    await expect(drawer.getByText(/duplicate.*net.*pay|CORRECTION run/i).first()).toBeVisible();
    await expect(drawer.getByRole("button", { name: /Acknowledge/i })).toBeVisible();
  });
});
