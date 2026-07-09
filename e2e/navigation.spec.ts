import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@localhost";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin12345";

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/");
}

test.describe("navigation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("home hub loads", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("can open team feed dashboard", async ({ page }) => {
    await page.getByRole("link", { name: /team feed|dashboard/i }).first().click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("can open my feed", async ({ page }) => {
    await page.getByRole("link", { name: /my feed/i }).first().click();
    await expect(page).toHaveURL(/\/my-feed/);
  });
});

test.describe("dashboard filters", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/dashboard");
  });

  test("loads roster table", async ({ page }) => {
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("accepts daily period type in URL", async ({ page }) => {
    await page.goto("/dashboard?type=DAILY&date=2025-06-01");
    await expect(page).toHaveURL(/type=DAILY/);
    await expect(page.getByRole("table")).toBeVisible();
  });
});
