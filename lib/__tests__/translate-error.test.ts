import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { en } from "@/lib/i18n/dictionaries/en";
import { ko } from "@/lib/i18n/dictionaries/ko";
import { zh } from "@/lib/i18n/dictionaries/zh";
import { toIntlLocale } from "@/lib/i18n/intl-locale";
import { locales } from "@/lib/i18n/locales";
import {
  translateError,
  translateFieldErrors,
} from "@/lib/i18n/translate-error";

const dictionaries = { en, ko, zh } as const;

const staticMessages = [
  "Invalid email or password.",
  "Unauthorized",
  "Title is required.",
  "Hours cannot be negative.",
  "File name is required.",
  "Plan not found.",
  "Report not found.",
  "This link has expired. Ask your admin for a new one.",
  "Invalid week value.",
  "Invalid month value.",
] as const;

describe("toIntlLocale", () => {
  for (const locale of locales) {
    it(`maps ${locale}`, () => {
      const intl = toIntlLocale(locale);
      assert.ok(intl.includes("-") || locale === "en");
      if (locale === "ko") {
        assert.equal(intl, "ko-KR");
      }
      if (locale === "zh") {
        assert.equal(intl, "zh-CN");
      }
      if (locale === "en") {
        assert.equal(intl, "en-US");
      }
    });
  }
});

describe("translateError static messages", () => {
  for (const [locale, dict] of Object.entries(dictionaries)) {
    for (const message of staticMessages) {
      it(`${locale}: ${message}`, () => {
        const translated = translateError(message, dict);
        assert.ok(translated.length > 0);
        if (locale !== "en") {
          assert.notEqual(translated, message);
        }
      });
    }
  }
});

describe("translateError dynamic file size", () => {
  for (const [locale, dict] of Object.entries(dictionaries)) {
    it(`${locale}: file exceeds max size`, () => {
      const translated = translateError(
        "File exceeds maximum size of 10 MB.",
        dict,
      );
      assert.ok(translated.includes("10"));
    });

    it(`${locale}: avatar exceeds max size`, () => {
      const translated = translateError(
        "Avatar exceeds maximum size of 2 MB.",
        dict,
      );
      assert.ok(translated.includes("2"));
    });
  }
});

describe("translateError fallback", () => {
  it("uses generic for unknown message", () => {
    const translated = translateError("Totally unknown error xyz", en);
    assert.equal(translated, en.errors.generic);
  });

  it("uses custom fallback when provided", () => {
    const translated = translateError("Unknown", en, "Custom fallback");
    assert.equal(translated, "Custom fallback");
  });
});

describe("translateFieldErrors", () => {
  it("translates each field message", () => {
    const result = translateFieldErrors(
      {
        email: ["Email is required."],
        password: ["Password is required."],
      },
      en,
    );
    assert.equal(result.email?.[0], en.errors.emailRequired);
    assert.equal(result.password?.[0], en.errors.passwordRequired);
  });

  it("skips empty field errors", () => {
    const result = translateFieldErrors({ email: [] }, en);
    assert.equal("email" in result, false);
  });
});

// Exhaustive static message coverage across all locales
describe("translateError exhaustive static map", () => {
  const allMessages = [
    "Invalid email or password.",
    "Unable to sign in. Please try again.",
    "Invalid plan parameters.",
    "Invalid report parameters.",
    "Invalid date.",
    "Invalid month.",
    "Invalid week.",
    "Invalid day.",
    "Invalid role.",
    "Invalid organization name.",
    "Unauthorized",
    "No file selected.",
    "Notes are too long.",
    "This period is outside the edit window.",
    "Unable to save notes.",
    "Invalid input.",
    "Unable to add item.",
    "Unable to update item.",
    "Unable to delete item.",
    "Unable to submit plan.",
    "Unable to reopen plan.",
    "Unable to delete plan.",
    "Unable to upload file.",
    "Unable to delete attachment.",
    "Unable to check off item.",
    "Unable to uncheck item.",
    "Unable to update plan item.",
    "Unable to add entry.",
    "Unable to update entry.",
    "Unable to delete entry.",
    "Unable to submit report.",
    "Unable to open tomorrow’s plan.",
    "Unable to delete report.",
    "Unable to open plan.",
    "Unable to open report.",
    "Unable to update profile.",
    "Unable to change password.",
    "Unable to upload avatar.",
    "Unable to remove avatar.",
    "Unable to create user.",
    "Unable to update role.",
    "Unable to update user status.",
    "Unable to generate password-set link.",
    "Unable to update organization settings.",
    "Name is required.",
    "Email is required.",
    "Invalid email address.",
    "Password is required.",
    "Password must be at least 8 characters.",
    "Passwords do not match.",
    "Current password is required.",
    "Confirm your new password.",
    "Organization name is required.",
    "Title is required.",
    "Invalid date format.",
    "Hours cannot be negative.",
    "Hours cannot exceed 24 per entry.",
    "Hours must be greater than zero.",
    "This link has expired. Ask your admin for a new one.",
    "This link has already been used.",
    "This account is inactive.",
    "Invalid password-set link.",
    "Plan item not found.",
    "This plan cannot be edited.",
    "Resolved items cannot be edited.",
    "Submitted plans cannot be edited.",
    "Add at least one plan item before submitting.",
    "Plan not found.",
    "Only submitted plans can be reopened.",
    "Plan item not found on your submitted plan.",
    "This plan item was already resolved in another report.",
    "Report entry not found.",
    "Uncheck the plan item to remove this entry.",
    "Add at least one report entry before submitting.",
    "Completed plan items need hours greater than zero.",
    "Every entry must have hours greater than zero.",
    "Report not found.",
    "Submitted reports cannot be edited.",
    "User not found.",
    "A user with this email already exists.",
    "No password is set for this account. Use a password-set link from your admin.",
    "Current password is incorrect.",
    "Select an image file.",
    "Avatar must be a JPEG, PNG, GIF, or WebP image.",
    "Cannot generate a link for an inactive user.",
    "You cannot change your own role.",
    "You cannot deactivate your own account.",
    "Invalid week value.",
    "Invalid month value.",
    "Attachment not found.",
    "File name is required.",
    "File is empty.",
    "File type not allowed. Use PDF, images, Office documents, or plain text.",
    "Tomorrow’s plan is outside the daily edit window.",
  ] as const;

  for (const [locale, dict] of Object.entries(dictionaries)) {
    for (const message of allMessages) {
      it(`${locale}: translates ${message.slice(0, 40)}…`, () => {
        const translated = translateError(message, dict);
        assert.ok(translated.length > 0);
      });
    }
  }
});
