import { test as setup, expect } from "@playwright/test";
import path from "node:path";
import { mkdirSync } from "node:fs";

const AUTH_DIR = path.join("tests", "e2e", ".auth");
const CFO_STATE = path.join(AUTH_DIR, "cfo.json");

setup("authenticate as CFO", async ({ page }) => {
  mkdirSync(AUTH_DIR, { recursive: true });

  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();

  await page.getByLabel("Email").fill("cfo@miniorange.test");
  await page.getByLabel("Password").fill("demo");
  await page.getByRole("button", { name: /^Sign in$/ }).click();

  // Successful login lands on /dashboard
  await page.waitForURL("**/dashboard", { timeout: 10_000 });
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  await page.context().storageState({ path: CFO_STATE });
});
