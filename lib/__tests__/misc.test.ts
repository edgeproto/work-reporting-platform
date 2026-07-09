import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { defaultHomePeriodPrefs } from "@/lib/home/prefs";
import { hashPassword, verifyPassword } from "@/lib/password";
import { cn } from "@/lib/utils";

describe("defaultHomePeriodPrefs", () => {
  it("returns month, weekSunday, and day for fixed today", () => {
    const prefs = defaultHomePeriodPrefs("2025-06-15");
    assert.equal(prefs.month, "2025-06");
    assert.equal(prefs.day, "2025-06-15");
    assert.match(prefs.weekSunday, /^\d{4}-\d{2}-\d{2}$/);
  });

  it("weekSunday is start of week containing today", () => {
    const prefs = defaultHomePeriodPrefs("2025-06-15");
    assert.equal(prefs.weekSunday, "2025-06-15");
  });
});

describe("password hash and verify", () => {
  const passwords = [
    "short1!",
    "a-longer-password-123",
    "unicode-密码-pass",
    "admin12345",
  ];

  for (const password of passwords) {
    it(`hashes and verifies ${password.slice(0, 8)}…`, async () => {
      const hash = await hashPassword(password);
      assert.ok(hash.startsWith("$2"));
      assert.equal(await verifyPassword(password, hash), true);
      assert.equal(await verifyPassword(password + "x", hash), false);
    });
  }
});

describe("cn utility", () => {
  const cases: Array<[unknown[], string]> = [
    [["foo", "bar"], "foo bar"],
    [["foo", false && "hidden", "bar"], "foo bar"],
    [["p-2", "p-4"], "p-4"],
    [["text-sm", undefined, null, "font-bold"], "text-sm font-bold"],
    [[{ foo: true, bar: false }], "foo"],
  ];

  for (const [inputs, expected] of cases) {
    it(`cn(${JSON.stringify(inputs)})`, () => {
      assert.equal(cn(...(inputs as Parameters<typeof cn>)), expected);
    });
  }
});
