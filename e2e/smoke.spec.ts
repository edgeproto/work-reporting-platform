import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@localhost";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin12345";
const MEMBER_PASSWORD = "smoke-member-pass";
const MANAGER_PASSWORD = "smoke-manager-pass";

const runId = Date.now();
const memberEmail = `smoke-member-${runId}@localhost`;
const managerEmail = `smoke-manager-${runId}@localhost`;
const planTitle = `Smoke test item ${runId}`;

async function logout(page: import("@playwright/test").Page) {
  const signOut = page.getByRole("button", { name: "Sign out" });
  if (await signOut.isVisible()) {
    await signOut.click();
    await expect(page).toHaveURL("/login");
  }
}

async function login(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
) {
  await logout(page);
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/");
}

function tokenFromLink(link: string): string {
  const url = new URL(link);
  const token = url.searchParams.get("token");
  if (!token) {
    throw new Error(`Password-set link is missing a token: ${link}`);
  }
  return token;
}

async function setPasswordFromLink(
  page: import("@playwright/test").Page,
  link: string,
  password: string,
) {
  const token = tokenFromLink(link);
  await page.goto(`/set-password?token=${token}`);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Set password" }).click();
  await expect(page).toHaveURL(/\/login\?passwordSet=1/);
}

async function createUserAndSetPassword(
  page: import("@playwright/test").Page,
  name: string,
  email: string,
  role: "MEMBER" | "MANAGER" | "ADMIN",
  password: string,
) {
  await page.getByTestId("create-user-name").fill(name);
  await page.getByTestId("create-user-email").fill(email);
  await page.getByTestId("create-user-role").selectOption(role);
  await page.getByTestId("create-user-submit").click();
  await expect(page).toHaveURL(/createdLink=/, { timeout: 10_000 });

  const linkParam = new URL(page.url()).searchParams.get("createdLink");
  if (!linkParam) {
    throw new Error("Password-set link missing from URL after user creation.");
  }
  const link = decodeURIComponent(linkParam);

  await setPasswordFromLink(page, link, password);
}

test("admin onboarding and reporting flow", async ({ page }) => {
  await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);

  await page.goto("/admin/users");
  await expect(page.getByRole("heading", { name: "User Management" })).toBeVisible();

  await createUserAndSetPassword(
    page,
    "Smoke Member",
    memberEmail,
    "MEMBER",
    MEMBER_PASSWORD,
  );

  await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.goto("/admin/users");

  await createUserAndSetPassword(
    page,
    "Smoke Manager",
    managerEmail,
    "MANAGER",
    MANAGER_PASSWORD,
  );

  // Member files a daily plan with a private item from Home
  await login(page, memberEmail, MEMBER_PASSWORD);
  await page.goto("/");
  const dailySection = page.getByTestId("home-section-daily");
  await expect(dailySection).toBeVisible();
  await dailySection.getByRole("button", { name: "Submit plan" }).click();
  await expect(page.getByRole("heading", { name: "Daily Plan" })).toBeVisible();

  await page.getByLabel("Title").fill(planTitle);
  await page.getByLabel("Visibility").selectOption("PRIVATE");
  await page.getByRole("button", { name: "Add item" }).click();
  await expect(page.getByText(planTitle)).toBeVisible();

  await page.getByRole("button", { name: "Submit plan" }).click();
  await expect(page.getByText("This plan has been submitted")).toBeVisible();

  // Member files a daily report and checks off the plan item
  await page.goto("/");
  await page
    .getByTestId("home-section-daily")
    .getByRole("button", { name: "Submit report" })
    .click();
  await expect(page.getByRole("heading", { name: "Daily Report" })).toBeVisible();

  await page
    .getByRole("button", { name: new RegExp(`Check off ${planTitle}`) })
    .click();
  const hoursInput = page
    .locator("li")
    .filter({ hasText: planTitle })
    .getByLabel("Hours");
  await hoursInput.fill("2");
  await hoursInput.blur();
  await expect(
    page.getByRole("button", { name: "Submit report" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Submit report" }).click();
  await expect(page.getByText("This report has been submitted")).toBeVisible();

  // Manager sees member hours and private entry on dashboard detail
  await login(page, managerEmail, MANAGER_PASSWORD);
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Smoke Member" })).toBeVisible();
  await page.getByRole("link", { name: "Smoke Member" }).click();
  await expect(page.getByRole("heading", { name: "Smoke Member" })).toBeVisible();
  const privateEntry = page
    .locator("li")
    .filter({ hasText: planTitle })
    .filter({ hasText: "Private" })
    .first();
  await expect(privateEntry).toBeVisible();
  await expect(page.getByText("2.0")).toBeVisible();
});
