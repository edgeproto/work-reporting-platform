# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> admin onboarding and reporting flow
- Location: e2e/smoke.spec.ts:78:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'User Management' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: 'User Management' })

```

```yaml
- heading "500" [level=1]
- heading "Internal Server Error." [level=2]
- alert
```

# Test source

```ts
  1   | import { expect, test } from "@playwright/test";
  2   | 
  3   | const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@localhost";
  4   | const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin12345";
  5   | const MEMBER_PASSWORD = "smoke-member-pass";
  6   | const MANAGER_PASSWORD = "smoke-manager-pass";
  7   | 
  8   | const runId = Date.now();
  9   | const memberEmail = `smoke-member-${runId}@localhost`;
  10  | const managerEmail = `smoke-manager-${runId}@localhost`;
  11  | const planTitle = `Smoke test item ${runId}`;
  12  | 
  13  | async function logout(page: import("@playwright/test").Page) {
  14  |   const signOut = page.getByRole("button", { name: "Sign out" });
  15  |   if (await signOut.isVisible()) {
  16  |     await signOut.click();
  17  |     await expect(page).toHaveURL("/login");
  18  |   }
  19  | }
  20  | 
  21  | async function login(
  22  |   page: import("@playwright/test").Page,
  23  |   email: string,
  24  |   password: string,
  25  | ) {
  26  |   await logout(page);
  27  |   await page.goto("/login");
  28  |   await page.getByLabel("Email").fill(email);
  29  |   await page.getByLabel("Password").fill(password);
  30  |   await page.getByRole("button", { name: "Sign in" }).click();
  31  |   await expect(page).toHaveURL("/");
  32  | }
  33  | 
  34  | function tokenFromLink(link: string): string {
  35  |   const url = new URL(link);
  36  |   const token = url.searchParams.get("token");
  37  |   if (!token) {
  38  |     throw new Error(`Password-set link is missing a token: ${link}`);
  39  |   }
  40  |   return token;
  41  | }
  42  | 
  43  | async function setPasswordFromLink(
  44  |   page: import("@playwright/test").Page,
  45  |   link: string,
  46  |   password: string,
  47  | ) {
  48  |   const token = tokenFromLink(link);
  49  |   await page.goto(`/set-password?token=${token}`);
  50  |   await page.getByLabel("Password", { exact: true }).fill(password);
  51  |   await page.getByLabel("Confirm password").fill(password);
  52  |   await page.getByRole("button", { name: "Set password" }).click();
  53  |   await expect(page).toHaveURL(/\/login\?passwordSet=1/);
  54  | }
  55  | 
  56  | async function createUserAndSetPassword(
  57  |   page: import("@playwright/test").Page,
  58  |   name: string,
  59  |   email: string,
  60  |   role: "MEMBER" | "MANAGER" | "ADMIN",
  61  |   password: string,
  62  | ) {
  63  |   await page.getByTestId("create-user-name").fill(name);
  64  |   await page.getByTestId("create-user-email").fill(email);
  65  |   await page.getByTestId("create-user-role").selectOption(role);
  66  |   await page.getByTestId("create-user-submit").click();
  67  |   await expect(page).toHaveURL(/createdLink=/, { timeout: 10_000 });
  68  | 
  69  |   const linkParam = new URL(page.url()).searchParams.get("createdLink");
  70  |   if (!linkParam) {
  71  |     throw new Error("Password-set link missing from URL after user creation.");
  72  |   }
  73  |   const link = decodeURIComponent(linkParam);
  74  | 
  75  |   await setPasswordFromLink(page, link, password);
  76  | }
  77  | 
  78  | test("admin onboarding and reporting flow", async ({ page }) => {
  79  |   await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  80  | 
  81  |   await page.goto("/admin/users");
> 82  |   await expect(page.getByRole("heading", { name: "User Management" })).toBeVisible();
      |                                                                        ^ Error: expect(locator).toBeVisible() failed
  83  | 
  84  |   await createUserAndSetPassword(
  85  |     page,
  86  |     "Smoke Member",
  87  |     memberEmail,
  88  |     "MEMBER",
  89  |     MEMBER_PASSWORD,
  90  |   );
  91  | 
  92  |   await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  93  |   await page.goto("/admin/users");
  94  | 
  95  |   await createUserAndSetPassword(
  96  |     page,
  97  |     "Smoke Manager",
  98  |     managerEmail,
  99  |     "MANAGER",
  100 |     MANAGER_PASSWORD,
  101 |   );
  102 | 
  103 |   // Member files a daily plan with a private item from Home
  104 |   await login(page, memberEmail, MEMBER_PASSWORD);
  105 |   await page.goto("/");
  106 |   const dailySection = page.getByTestId("home-section-daily");
  107 |   await expect(dailySection).toBeVisible();
  108 |   await dailySection.getByRole("button", { name: "Submit plan" }).click();
  109 |   await expect(page.getByRole("heading", { name: "Daily Plan" })).toBeVisible();
  110 | 
  111 |   await page.getByLabel("Title").fill(planTitle);
  112 |   await page.getByLabel("Visibility").selectOption("PRIVATE");
  113 |   await page.getByRole("button", { name: "Add item" }).click();
  114 |   await expect(page.getByText(planTitle)).toBeVisible();
  115 | 
  116 |   await page.getByRole("button", { name: "Submit plan" }).click();
  117 |   await expect(page.getByText("This plan has been submitted")).toBeVisible();
  118 | 
  119 |   // Member files a daily report and checks off the plan item
  120 |   await page.goto("/");
  121 |   await page
  122 |     .getByTestId("home-section-daily")
  123 |     .getByRole("button", { name: "Submit report" })
  124 |     .click();
  125 |   await expect(page.getByRole("heading", { name: "Daily Report" })).toBeVisible();
  126 | 
  127 |   await page
  128 |     .getByRole("button", { name: new RegExp(`Check off ${planTitle}`) })
  129 |     .click();
  130 |   const hoursInput = page
  131 |     .locator("li")
  132 |     .filter({ hasText: planTitle })
  133 |     .getByLabel("Hours");
  134 |   await hoursInput.fill("2");
  135 |   await hoursInput.blur();
  136 |   await expect(
  137 |     page.getByRole("button", { name: "Submit report" }),
  138 |   ).toBeEnabled();
  139 |   await page.getByRole("button", { name: "Submit report" }).click();
  140 |   await expect(page.getByText("This report has been submitted")).toBeVisible();
  141 | 
  142 |   // Manager sees member hours and private entry on dashboard detail
  143 |   await login(page, managerEmail, MANAGER_PASSWORD);
  144 |   await page.goto("/dashboard");
  145 |   await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  146 |   await expect(page.getByRole("link", { name: "Smoke Member" })).toBeVisible();
  147 |   await page.getByRole("link", { name: "Smoke Member" }).click();
  148 |   await expect(page.getByRole("heading", { name: "Smoke Member" })).toBeVisible();
  149 |   const privateEntry = page
  150 |     .locator("li")
  151 |     .filter({ hasText: planTitle })
  152 |     .filter({ hasText: "Private" })
  153 |     .first();
  154 |   await expect(privateEntry).toBeVisible();
  155 |   await expect(page.getByText("2.0")).toBeVisible();
  156 | });
  157 | 
```