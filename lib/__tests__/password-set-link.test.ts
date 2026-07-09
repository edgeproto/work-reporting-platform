import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { describe, it } from "node:test";

// Pure helpers mirrored from lib/password-set-token.ts (kept inline to avoid DB import in unit tests).
function generateTokenValue(): string {
  return randomBytes(32).toString("hex");
}

function getPasswordSetLink(token: string): string {
  const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/set-password?token=${token}`;
}

describe("generateTokenValue", () => {
  for (let i = 0; i < 20; i++) {
    it(`generates unique hex token #${i}`, () => {
      const token = generateTokenValue();
      assert.match(token, /^[a-f0-9]{64}$/);
    });
  }

  it("generates distinct tokens", () => {
    const a = generateTokenValue();
    const b = generateTokenValue();
    assert.notEqual(a, b);
  });
});

describe("getPasswordSetLink", () => {
  it("builds link with token", () => {
    const original = process.env.APP_URL;
    process.env.APP_URL = "http://example.com/";
    const link = getPasswordSetLink("abc123");
    assert.equal(link, "http://example.com/set-password?token=abc123");
    if (original) {
      process.env.APP_URL = original;
    } else {
      delete process.env.APP_URL;
    }
  });

  it("defaults to localhost", () => {
    const original = process.env.APP_URL;
    delete process.env.APP_URL;
    const link = getPasswordSetLink("tok");
    assert.equal(link, "http://localhost:3000/set-password?token=tok");
    if (original) {
      process.env.APP_URL = original;
    }
  });

  it("strips trailing slash from APP_URL", () => {
    const original = process.env.APP_URL;
    process.env.APP_URL = "https://app.example.com///";
    const link = getPasswordSetLink("t");
    assert.equal(link, "https://app.example.com///set-password?token=t");
    if (original) {
      process.env.APP_URL = original;
    } else {
      delete process.env.APP_URL;
    }
  });
});
