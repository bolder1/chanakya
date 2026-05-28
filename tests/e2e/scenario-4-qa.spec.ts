import { test, expect } from "@playwright/test";

test.describe("Scenario 4 — Ask Chanakya NL Q&A", () => {
  test("clicking the Aarav suggestion returns the duplicate-pay narrative", async ({ page }) => {
    await page.goto("/ask");
    await page
      .getByRole("button", { name: /Why did Aarav Mehta's salary double/i })
      .click();

    // Assistant reply should mention the exact spike amount
    await expect(page.getByText(/2[,.]04[,.]800/).first()).toBeVisible();

    // Citation chip linking to the employee detail page
    await expect(page.locator('a[href*="/payroll/employees/EMP-0142"]').first()).toBeVisible();
  });

  test("free-typed gibberish gracefully falls back to chip suggestions", async ({ page }) => {
    await page.goto("/ask");
    const composer = page.getByPlaceholder(/Ask about a salary/i);
    await composer.fill("asdfgh qwerty xyz nonsense");
    await composer.press("Enter");

    await expect(page.getByText(/focused on payroll|focused on these areas|I can answer/i).first()).toBeVisible();

    // Fallback should suggest at least one canned question chip
    await expect(
      page.getByRole("button", { name: /Show me anomalies in payroll|spend on laptops/i }).first(),
    ).toBeVisible();
  });

  test("/ask?q= prefill fires the question automatically", async ({ page }) => {
    await page.goto(`/ask?q=${encodeURIComponent("How much did we spend on laptops in April?")}`);
    await expect(page.getByText(/14[,.]80[,.]000|131%/).first()).toBeVisible();
  });
});
