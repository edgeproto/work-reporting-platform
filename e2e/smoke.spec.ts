import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@localhost";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin12345";
const MEMBER_PASSWORD = "smoke-member-pass";
const MANAGER_PASSWORD = "smoke-manager-pass";

const runId = Date.now();
const memberEmail = `smoke-member-${runId}@localhost`;
const managerEmail = `smoke-manager-${runId}@localhost`;
const taskTitle = `Smoke test task ${runId}`;

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

async function waitForPasswordLink(
  page: import("@playwright/test").Page,
  email: string,
): Promise<string> {
  const row = page.getByTestId(`user-row-${email}`);
  await expect(row).toBeVisible();

  const rowLink = row.getByTestId(`password-link-${email}`);
  if (await rowLink.isVisible()) {
    return rowLink.inputValue();
  }

  await row.getByTestId(`generate-link-${email}`).click();
  await expect(rowLink).toBeVisible();
  return rowLink.inputValue();
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

  let link: string | null = null;
  const createdLink = page
    .getByTestId("created-user-link")
    .getByTestId("password-set-link");
  if (await createdLink.isVisible({ timeout: 3000 }).catch(() => false)) {
    link = await createdLink.inputValue();
  } else {
    link = await waitForPasswordLink(page, email);
  }

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

  await page.goto("/admin/users");

  await createUserAndSetPassword(
    page,
    "Smoke Manager",
    managerEmail,
    "MANAGER",
    MANAGER_PASSWORD,
  );

  // Member files a daily plan with a private task
  await login(page, memberEmail, MEMBER_PASSWORD);
  await page.goto("/my-plans");
  await page.getByRole("button", { name: "New plan" }).click();
  await expect(page.getByRole("heading", { name: "Daily Plan" })).toBeVisible();

  await page.getByLabel("Task title").fill(taskTitle);
  await page.getByLabel("Visibility").selectOption("PRIVATE");
  await page.getByRole("button", { name: "Add task" }).click();
  await expect(page.getByText(taskTitle)).toBeVisible();

  await page.getByRole("button", { name: "Submit plan" }).click();
  await expect(page.getByText("This plan has been submitted")).toBeVisible();

  // Member files a daily report and checks off the plan item
  await page.goto("/my-reports");
  await page.getByRole("button", { name: "New report" }).click();
  await expect(page.getByRole("heading", { name: "Daily Report" })).toBeVisible();

  await page
    .getByRole("button", { name: new RegExp(`Check off ${taskTitle}`) })
    .click();
  await page
    .locator("li")
    .filter({ hasText: taskTitle })
    .getByLabel("Hours")
    .fill("2");
  await page.getByRole("button", { name: "Submit report" }).click();
  await expect(page.getByText("This report has been submitted")).toBeVisible();

  // Manager sees the private entry on the team dashboard
  await login(page, managerEmail, MANAGER_PASSWORD);
  await page.goto("/team");
  await expect(
    page.getByRole("heading", { name: "Team Dashboard" }),
  ).toBeVisible();
  const timelineEntry = page
    .locator("li")
    .filter({ hasText: taskTitle })
    .filter({ hasText: "Private" })
    .first();
  await expect(timelineEntry).toBeVisible();
});
