import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@localhost";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin12345";

test.describe("authentication", () => {
  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("rejects invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("nobody@localhost");
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/login");
    await expect(page.getByText(/invalid|unable/i)).toBeVisible();
  });

  test("admin can sign in and reach home", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/");
  });
});

test.describe("protected routes", () => {
  test("redirects unauthenticated user to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
