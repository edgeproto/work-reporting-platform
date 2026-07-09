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

Locator: getByRole('link', { name: 'Smoke Member' })
Expected: visible
Error: strict mode violation: getByRole('link', { name: 'Smoke Member' }) resolved to 10 elements:
    1) <a class="font-medium hover:underline" href="/dashboard/cmrcbs62n000ayfvtn4e33hd5?date=2026-07-05">Smoke Member</a> aka getByRole('link', { name: 'Smoke Member' }).first()
    2) <a class="font-medium hover:underline" href="/dashboard/cmr8dbabm00008xvti6tzw28e?date=2026-07-05">Smoke Member</a> aka getByRole('link', { name: 'Smoke Member' }).nth(1)
    3) <a class="font-medium hover:underline" href="/dashboard/cmr8ded7g00048xvt4u7eqgiy?date=2026-07-05">Smoke Member</a> aka getByRole('link', { name: 'Smoke Member' }).nth(2)
    4) <a class="font-medium hover:underline" href="/dashboard/cmr8di7lw00068xvtegdosanp?date=2026-07-05">Smoke Member</a> aka getByRole('link', { name: 'Smoke Member' }).nth(3)
    5) <a class="font-medium hover:underline" href="/dashboard/cmr8dj3t4000e8xvtbn1kolu3?date=2026-07-05">Smoke Member</a> aka getByRole('link', { name: 'Smoke Member' }).nth(4)
    6) <a class="font-medium hover:underline" href="/dashboard/cmr8djiez000n8xvtp4qr266i?date=2026-07-05">Smoke Member</a> aka getByRole('link', { name: 'Smoke Member' }).nth(5)
    7) <a class="font-medium hover:underline" href="/dashboard/cmrabokid0007cfvtzqshprow?date=2026-07-05">Smoke Member</a> aka locator('tr:nth-child(17) > td:nth-child(2) > .font-medium')
    8) <a class="font-medium hover:underline" href="/dashboard/cmrabq1480009cfvt7ywrgfaf?date=2026-07-05">Smoke Member</a> aka locator('tr:nth-child(18) > td:nth-child(2) > .font-medium')
    9) <a class="font-medium hover:underline" href="/dashboard/cmrac4fh5000dcfvtteypr1u7?date=2026-07-05">Smoke Member</a> aka locator('tr:nth-child(19) > td:nth-child(2) > .font-medium')
    10) <a class="font-medium hover:underline" href="/dashboard/cmrac7o50000mcfvty5cjtxau?date=2026-07-05">Smoke Member</a> aka locator('tr:nth-child(20) > td:nth-child(2) > .font-medium')

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('link', { name: 'Smoke Member' })

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - complementary [ref=e3]:
    - generic [ref=e4]:
      - link "Status Reports" [ref=e5] [cursor=pointer]:
        - /url: /
      - button "Collapse sidebar" [expanded] [ref=e6]:
        - img
    - navigation "Main" [ref=e8]:
      - link "Home" [ref=e9] [cursor=pointer]:
        - /url: /
        - img [ref=e10]
        - generic [ref=e13]: Home
      - link "Dashboard" [ref=e14] [cursor=pointer]:
        - /url: /dashboard
        - img [ref=e15]
        - generic [ref=e20]: Dashboard
      - link "Settings" [ref=e21] [cursor=pointer]:
        - /url: /settings
        - img [ref=e22]
        - generic [ref=e25]: Settings
    - generic [ref=e26]:
      - combobox "Language" [ref=e27]:
        - option "English" [selected]
        - option "한국어"
      - generic [ref=e28]:
        - generic [ref=e29]: S
        - generic [ref=e30]:
          - paragraph [ref=e31]: Smoke Manager
          - paragraph [ref=e32]: Manager
      - button "Sign out" [ref=e34]
  - main [ref=e35]:
    - generic [ref=e37]:
      - generic [ref=e38]:
        - heading "Dashboard" [level=1] [ref=e39]
        - paragraph [ref=e40]: Team roster for Week 2 of July 2026 · Sun, Jul 5 – Sat, Jul 11.
      - generic [ref=e41]:
        - heading "Period" [level=2] [ref=e42]
        - generic [ref=e43]:
          - generic [ref=e44]:
            - generic [ref=e45]: Type
            - combobox "Type" [ref=e46]:
              - option "Daily"
              - option "Weekly" [selected]
              - option "Monthly"
          - generic [ref=e47]:
            - generic [ref=e48]:
              - generic [ref=e49]: Month
              - textbox "Month" [ref=e50]: 2026-07
            - generic [ref=e51]:
              - generic [ref=e52]: Week
              - combobox "Week" [ref=e53]:
                - 'option "Week 1: Sun, Jun 28 – Sat, Jul 4"'
                - 'option "Week 2: Sun, Jul 5 – Sat, Jul 11" [selected]'
                - 'option "Week 3: Sun, Jul 12 – Sat, Jul 18"'
                - 'option "Week 4: Sun, Jul 19 – Sat, Jul 25"'
                - 'option "Week 1: Sun, Jul 26 – Sat, Aug 1"'
      - generic [ref=e54]:
        - heading "Members" [level=2] [ref=e55]
        - table [ref=e58]:
          - rowgroup [ref=e59]:
            - row "Expand row Name Role Plan Report Plan complete % Hours" [ref=e60]:
              - columnheader "Expand row" [ref=e61]
              - columnheader "Name" [ref=e62]:
                - link "Name" [ref=e63] [cursor=pointer]:
                  - /url: /dashboard?date=2026-07-05&dir=desc
                  - text: Name
                  - generic [ref=e64]: ↑
              - columnheader "Role" [ref=e65]
              - columnheader "Plan" [ref=e66]
              - columnheader "Report" [ref=e67]
              - columnheader "Plan complete %" [ref=e68]:
                - link "Plan complete %" [ref=e69] [cursor=pointer]:
                  - /url: /dashboard?date=2026-07-05&sort=completion&dir=desc
              - columnheader "Hours" [ref=e70]:
                - link "Hours" [ref=e71] [cursor=pointer]:
                  - /url: /dashboard?date=2026-07-05&sort=hours&dir=desc
          - rowgroup [ref=e72]:
            - row "Debug User Member No plan filed. No report filed. — 0.0" [ref=e73]:
              - cell [ref=e74]
              - cell "Debug User" [ref=e75]:
                - link "Debug User" [ref=e76] [cursor=pointer]:
                  - /url: /dashboard/cmrablzs3000066vto1t9x6fe?date=2026-07-05
              - cell "Member" [ref=e77]
              - cell "No plan filed." [ref=e78]:
                - paragraph [ref=e79]: No plan filed.
              - cell "No report filed." [ref=e80]:
                - paragraph [ref=e81]: No report filed.
              - cell "—" [ref=e82]
              - cell "0.0" [ref=e83]
            - row "Erwin Member No plan filed. No report filed. — 0.0" [ref=e84]:
              - cell [ref=e85]
              - cell "Erwin" [ref=e86]:
                - link "Erwin" [ref=e87] [cursor=pointer]:
                  - /url: /dashboard/cmrby0c030000wlvtytblina1?date=2026-07-05
              - cell "Member" [ref=e88]
              - cell "No plan filed." [ref=e89]:
                - paragraph [ref=e90]: No plan filed.
              - cell "No report filed." [ref=e91]:
                - paragraph [ref=e92]: No report filed.
              - cell "—" [ref=e93]
              - cell "0.0" [ref=e94]
            - row "PW Test Member No plan filed. No report filed. — 0.0" [ref=e95]:
              - cell [ref=e96]
              - cell "PW Test" [ref=e97]:
                - link "PW Test" [ref=e98] [cursor=pointer]:
                  - /url: /dashboard/cmrac46yy000bcfvtwc7enaem?date=2026-07-05
              - cell "Member" [ref=e99]
              - cell "No plan filed." [ref=e100]:
                - paragraph [ref=e101]: No plan filed.
              - cell "No report filed." [ref=e102]:
                - paragraph [ref=e103]: No report filed.
              - cell "—" [ref=e104]
              - cell "0.0" [ref=e105]
            - row "Smoke Manager Manager No plan filed. No report filed. — 0.0" [ref=e106]:
              - cell [ref=e107]
              - cell "Smoke Manager" [ref=e108]:
                - link "Smoke Manager" [ref=e109] [cursor=pointer]:
                  - /url: /dashboard/cmr8djjrj000p8xvtlmpz8izb?date=2026-07-05
              - cell "Manager" [ref=e110]
              - cell "No plan filed." [ref=e111]:
                - paragraph [ref=e112]: No plan filed.
              - cell "No report filed." [ref=e113]:
                - paragraph [ref=e114]: No report filed.
              - cell "—" [ref=e115]
              - cell "0.0" [ref=e116]
            - row "Smoke Manager Manager No plan filed. No report filed. — 0.0" [ref=e117]:
              - cell [ref=e118]
              - cell "Smoke Manager" [ref=e119]:
                - link "Smoke Manager" [ref=e120] [cursor=pointer]:
                  - /url: /dashboard/cmrac4hpe000fcfvtzs54tn7v?date=2026-07-05
              - cell "Manager" [ref=e121]
              - cell "No plan filed." [ref=e122]:
                - paragraph [ref=e123]: No plan filed.
              - cell "No report filed." [ref=e124]:
                - paragraph [ref=e125]: No report filed.
              - cell "—" [ref=e126]
              - cell "0.0" [ref=e127]
            - row "Smoke Manager Manager No plan filed. No report filed. — 0.0" [ref=e128]:
              - cell [ref=e129]
              - cell "Smoke Manager" [ref=e130]:
                - link "Smoke Manager" [ref=e131] [cursor=pointer]:
                  - /url: /dashboard/cmrac7qeo000ocfvtl4nb3nf2?date=2026-07-05
              - cell "Manager" [ref=e132]
              - cell "No plan filed." [ref=e133]:
                - paragraph [ref=e134]: No plan filed.
              - cell "No report filed." [ref=e135]:
                - paragraph [ref=e136]: No report filed.
              - cell "—" [ref=e137]
              - cell "0.0" [ref=e138]
            - row "Smoke Manager Manager No plan filed. No report filed. — 0.0" [ref=e139]:
              - cell [ref=e140]
              - cell "Smoke Manager" [ref=e141]:
                - link "Smoke Manager" [ref=e142] [cursor=pointer]:
                  - /url: /dashboard/cmrcbs8xi000cyfvtx7ouc6j8?date=2026-07-05
              - cell "Manager" [ref=e143]
              - cell "No plan filed." [ref=e144]:
                - paragraph [ref=e145]: No plan filed.
              - cell "No report filed." [ref=e146]:
                - paragraph [ref=e147]: No report filed.
              - cell "—" [ref=e148]
              - cell "0.0" [ref=e149]
            - row "Smoke Manager Manager No plan filed. No report filed. — 0.0" [ref=e150]:
              - cell [ref=e151]
              - cell "Smoke Manager" [ref=e152]:
                - link "Smoke Manager" [ref=e153] [cursor=pointer]:
                  - /url: /dashboard/cmr8dbaiz00028xvteqq6o631?date=2026-07-05
              - cell "Manager" [ref=e154]
              - cell "No plan filed." [ref=e155]:
                - paragraph [ref=e156]: No plan filed.
              - cell "No report filed." [ref=e157]:
                - paragraph [ref=e158]: No report filed.
              - cell "—" [ref=e159]
              - cell "0.0" [ref=e160]
            - row "Smoke Manager Manager No plan filed. No report filed. — 0.0" [ref=e161]:
              - cell [ref=e162]
              - cell "Smoke Manager" [ref=e163]:
                - link "Smoke Manager" [ref=e164] [cursor=pointer]:
                  - /url: /dashboard/cmr8di90u00088xvtejazxt3p?date=2026-07-05
              - cell "Manager" [ref=e165]
              - cell "No plan filed." [ref=e166]:
                - paragraph [ref=e167]: No plan filed.
              - cell "No report filed." [ref=e168]:
                - paragraph [ref=e169]: No report filed.
              - cell "—" [ref=e170]
              - cell "0.0" [ref=e171]
            - row "Smoke Manager Manager No plan filed. No report filed. — 0.0" [ref=e172]:
              - cell [ref=e173]
              - cell "Smoke Manager" [ref=e174]:
                - link "Smoke Manager" [ref=e175] [cursor=pointer]:
                  - /url: /dashboard/cmr8dj57c000g8xvt76fwe4j0?date=2026-07-05
              - cell "Manager" [ref=e176]
              - cell "No plan filed." [ref=e177]:
                - paragraph [ref=e178]: No plan filed.
              - cell "No report filed." [ref=e179]:
                - paragraph [ref=e180]: No report filed.
              - cell "—" [ref=e181]
              - cell "0.0" [ref=e182]
            - row "Smoke Member Member No plan filed. No report filed. — 0.0" [ref=e183]:
              - cell [ref=e184]
              - cell "Smoke Member" [ref=e185]:
                - link "Smoke Member" [ref=e186] [cursor=pointer]:
                  - /url: /dashboard/cmrcbs62n000ayfvtn4e33hd5?date=2026-07-05
              - cell "Member" [ref=e187]
              - cell "No plan filed." [ref=e188]:
                - paragraph [ref=e189]: No plan filed.
              - cell "No report filed." [ref=e190]:
                - paragraph [ref=e191]: No report filed.
              - cell "—" [ref=e192]
              - cell "0.0" [ref=e193]
            - row "Smoke Member Member No plan filed. No report filed. — 0.0" [ref=e194]:
              - cell [ref=e195]
              - cell "Smoke Member" [ref=e196]:
                - link "Smoke Member" [ref=e197] [cursor=pointer]:
                  - /url: /dashboard/cmr8dbabm00008xvti6tzw28e?date=2026-07-05
              - cell "Member" [ref=e198]
              - cell "No plan filed." [ref=e199]:
                - paragraph [ref=e200]: No plan filed.
              - cell "No report filed." [ref=e201]:
                - paragraph [ref=e202]: No report filed.
              - cell "—" [ref=e203]
              - cell "0.0" [ref=e204]
            - row "Smoke Member Member No plan filed. No report filed. — 0.0" [ref=e205]:
              - cell [ref=e206]
              - cell "Smoke Member" [ref=e207]:
                - link "Smoke Member" [ref=e208] [cursor=pointer]:
                  - /url: /dashboard/cmr8ded7g00048xvt4u7eqgiy?date=2026-07-05
              - cell "Member" [ref=e209]
              - cell "No plan filed." [ref=e210]:
                - paragraph [ref=e211]: No plan filed.
              - cell "No report filed." [ref=e212]:
                - paragraph [ref=e213]: No report filed.
              - cell "—" [ref=e214]
              - cell "0.0" [ref=e215]
            - row "Smoke Member Member No plan filed. No report filed. — 0.0" [ref=e216]:
              - cell [ref=e217]
              - cell "Smoke Member" [ref=e218]:
                - link "Smoke Member" [ref=e219] [cursor=pointer]:
                  - /url: /dashboard/cmr8di7lw00068xvtegdosanp?date=2026-07-05
              - cell "Member" [ref=e220]
              - cell "No plan filed." [ref=e221]:
                - paragraph [ref=e222]: No plan filed.
              - cell "No report filed." [ref=e223]:
                - paragraph [ref=e224]: No report filed.
              - cell "—" [ref=e225]
              - cell "0.0" [ref=e226]
            - row "Smoke Member Member No plan filed. No report filed. — 0.0" [ref=e227]:
              - cell [ref=e228]
              - cell "Smoke Member" [ref=e229]:
                - link "Smoke Member" [ref=e230] [cursor=pointer]:
                  - /url: /dashboard/cmr8dj3t4000e8xvtbn1kolu3?date=2026-07-05
              - cell "Member" [ref=e231]
              - cell "No plan filed." [ref=e232]:
                - paragraph [ref=e233]: No plan filed.
              - cell "No report filed." [ref=e234]:
                - paragraph [ref=e235]: No report filed.
              - cell "—" [ref=e236]
              - cell "0.0" [ref=e237]
            - row "Smoke Member Member No plan filed. No report filed. — 0.0" [ref=e238]:
              - cell [ref=e239]
              - cell "Smoke Member" [ref=e240]:
                - link "Smoke Member" [ref=e241] [cursor=pointer]:
                  - /url: /dashboard/cmr8djiez000n8xvtp4qr266i?date=2026-07-05
              - cell "Member" [ref=e242]
              - cell "No plan filed." [ref=e243]:
                - paragraph [ref=e244]: No plan filed.
              - cell "No report filed." [ref=e245]:
                - paragraph [ref=e246]: No report filed.
              - cell "—" [ref=e247]
              - cell "0.0" [ref=e248]
            - row "Smoke Member Member No plan filed. No report filed. — 0.0" [ref=e249]:
              - cell [ref=e250]
              - cell "Smoke Member" [ref=e251]:
                - link "Smoke Member" [ref=e252] [cursor=pointer]:
                  - /url: /dashboard/cmrabokid0007cfvtzqshprow?date=2026-07-05
              - cell "Member" [ref=e253]
              - cell "No plan filed." [ref=e254]:
                - paragraph [ref=e255]: No plan filed.
              - cell "No report filed." [ref=e256]:
                - paragraph [ref=e257]: No report filed.
              - cell "—" [ref=e258]
              - cell "0.0" [ref=e259]
            - row "Smoke Member Member No plan filed. No report filed. — 0.0" [ref=e260]:
              - cell [ref=e261]
              - cell "Smoke Member" [ref=e262]:
                - link "Smoke Member" [ref=e263] [cursor=pointer]:
                  - /url: /dashboard/cmrabq1480009cfvt7ywrgfaf?date=2026-07-05
              - cell "Member" [ref=e264]
              - cell "No plan filed." [ref=e265]:
                - paragraph [ref=e266]: No plan filed.
              - cell "No report filed." [ref=e267]:
                - paragraph [ref=e268]: No report filed.
              - cell "—" [ref=e269]
              - cell "0.0" [ref=e270]
            - row "Smoke Member Member No plan filed. No report filed. — 0.0" [ref=e271]:
              - cell [ref=e272]
              - cell "Smoke Member" [ref=e273]:
                - link "Smoke Member" [ref=e274] [cursor=pointer]:
                  - /url: /dashboard/cmrac4fh5000dcfvtteypr1u7?date=2026-07-05
              - cell "Member" [ref=e275]
              - cell "No plan filed." [ref=e276]:
                - paragraph [ref=e277]: No plan filed.
              - cell "No report filed." [ref=e278]:
                - paragraph [ref=e279]: No report filed.
              - cell "—" [ref=e280]
              - cell "0.0" [ref=e281]
            - row "Smoke Member Member No plan filed. No report filed. — 0.0" [ref=e282]:
              - cell [ref=e283]
              - cell "Smoke Member" [ref=e284]:
                - link "Smoke Member" [ref=e285] [cursor=pointer]:
                  - /url: /dashboard/cmrac7o50000mcfvty5cjtxau?date=2026-07-05
              - cell "Member" [ref=e286]
              - cell "No plan filed." [ref=e287]:
                - paragraph [ref=e288]: No plan filed.
              - cell "No report filed." [ref=e289]:
                - paragraph [ref=e290]: No report filed.
              - cell "—" [ref=e291]
              - cell "0.0" [ref=e292]
            - row "Vu Pham Member No plan filed. No report filed. — 0.0" [ref=e293]:
              - cell [ref=e294]
              - cell "Vu Pham" [ref=e295]:
                - link "Vu Pham" [ref=e296] [cursor=pointer]:
                  - /url: /dashboard/cmrabe35x0005cfvthlgclok8?date=2026-07-05
              - cell "Member" [ref=e297]
              - cell "No plan filed." [ref=e298]:
                - paragraph [ref=e299]: No plan filed.
              - cell "No report filed." [ref=e300]:
                - paragraph [ref=e301]: No report filed.
              - cell "—" [ref=e302]
              - cell "0.0" [ref=e303]
            - row "Vu Pham Member No plan filed. No report filed. — 0.0" [ref=e304]:
              - cell [ref=e305]
              - cell "Vu Pham" [ref=e306]:
                - link "Vu Pham" [ref=e307] [cursor=pointer]:
                  - /url: /dashboard/cmracybc3000vcfvt2aajxexb?date=2026-07-05
              - cell "Member" [ref=e308]
              - cell "No plan filed." [ref=e309]:
                - paragraph [ref=e310]: No plan filed.
              - cell "No report filed." [ref=e311]:
                - paragraph [ref=e312]: No report filed.
              - cell "—" [ref=e313]
              - cell "0.0" [ref=e314]
```

# Test source

```ts
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
  82  |   await expect(page.getByRole("heading", { name: "User Management" })).toBeVisible();
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
> 146 |   await expect(page.getByRole("link", { name: "Smoke Member" })).toBeVisible();
      |                                                                  ^ Error: expect(locator).toBeVisible() failed
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