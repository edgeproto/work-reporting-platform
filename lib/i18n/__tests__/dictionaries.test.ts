import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { PeriodType } from "@/app/generated/prisma/enums";
import { en } from "@/lib/i18n/dictionaries/en";
import { ko } from "@/lib/i18n/dictionaries/ko";
import { zh } from "@/lib/i18n/dictionaries/zh";
import { flattenDictionary } from "@/lib/i18n/flatten-dictionary";
import { formatFileSize } from "@/lib/i18n/format-file-size";
import { formatMessage } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { periodPickerLabel, periodTypeLabel } from "@/lib/i18n/period-labels";
import { isLocale, locales } from "@/lib/i18n/locales";

const dictionaries = { en, ko, zh } as const;
const enFlat = flattenDictionary(en);

describe("locale registry", () => {
  it("lists three locales", () => {
    assert.deepEqual([...locales], ["en", "ko", "zh"]);
  });

  for (const locale of locales) {
    it(`recognizes ${locale}`, () => {
      assert.equal(isLocale(locale), true);
    });
  }

  it("rejects unknown locale", () => {
    assert.equal(isLocale("fr"), false);
  });
});

describe("dictionary structure parity", () => {
  const koFlat = flattenDictionary(ko);
  const zhFlat = flattenDictionary(zh);

  for (const path of Object.keys(enFlat)) {
    it(`ko has key ${path}`, () => {
      assert.ok(path in koFlat, `missing ko key: ${path}`);
    });

    it(`zh has key ${path}`, () => {
      assert.ok(path in zhFlat, `missing zh key: ${path}`);
    });
  }
});

describe("dictionary string values", () => {
  for (const [locale, dict] of Object.entries(dictionaries)) {
    const flat = flattenDictionary(dict);

    for (const [path, value] of Object.entries(flat)) {
      it(`${locale} ${path} is a non-empty string`, () => {
        assert.equal(typeof value, "string");
        assert.ok(value.trim().length > 0, `empty value for ${path}`);
      });
    }
  }
});

describe("non-english translations differ from english", () => {
  const koFlat = flattenDictionary(ko);
  const zhFlat = flattenDictionary(zh);

  const sharedLiteralPaths = new Set([
    "common.fileSizeB",
    "common.fileSizeKB",
    "common.fileSizeMB",
    "admin.appUrlHint",
  ]);

  for (const path of Object.keys(enFlat)) {
    if (sharedLiteralPaths.has(path)) {
      continue;
    }

    it(`ko ${path} is translated`, () => {
      assert.notEqual(koFlat[path], enFlat[path]);
    });

    it(`zh ${path} is translated`, () => {
      assert.notEqual(zhFlat[path], enFlat[path]);
    });
  }
});

describe("getDictionary", () => {
  for (const locale of locales) {
    it(`returns dictionary for ${locale}`, () => {
      const dict = getDictionary(locale);
      assert.equal(dict.nav.home.length > 0, true);
    });
  }
});

describe("formatMessage", () => {
  it("replaces placeholders", () => {
    assert.equal(
      formatMessage(en.home.welcome, { name: "Ada" }),
      "Welcome, Ada",
    );
  });

  it("replaces multiple placeholders", () => {
    assert.equal(
      formatMessage(en.feed.completed, { completed: 2, total: 5 }),
      "2/5 completed",
    );
  });

  it("works for korean", () => {
    assert.equal(
      formatMessage(ko.home.welcome, { name: "Ada" }),
      "환영합니다, Ada님",
    );
  });

  it("works for chinese", () => {
    assert.equal(
      formatMessage(zh.home.welcome, { name: "Ada" }),
      "欢迎，Ada",
    );
  });
});

describe("periodTypeLabel", () => {
  for (const locale of locales) {
    const dict = getDictionary(locale);

    for (const type of Object.values(PeriodType)) {
      it(`${locale} labels ${type}`, () => {
        const label = periodTypeLabel(type, dict);
        assert.ok(label.length > 0);
        if (locale !== "en") {
          assert.notEqual(label, periodTypeLabel(type, en));
        }
      });
    }
  }
});

describe("periodPickerLabel", () => {
  for (const locale of locales) {
    const dict = getDictionary(locale);

    for (const type of Object.values(PeriodType)) {
      it(`${locale} picker label for ${type}`, () => {
        const label = periodPickerLabel(type, dict);
        assert.ok(label.length > 0);
      });
    }
  }
});

describe("formatFileSize", () => {
  for (const locale of locales) {
    const dict = getDictionary(locale);

    it(`${locale} formats bytes`, () => {
      assert.ok(formatFileSize(512, dict).includes("512"));
    });

    it(`${locale} formats kilobytes`, () => {
      assert.ok(formatFileSize(2048, dict).includes("2.0"));
    });

    it(`${locale} formats megabytes`, () => {
      assert.ok(formatFileSize(2 * 1024 * 1024, dict).includes("2.0"));
    });
  }
});

describe("role labels", () => {
  for (const locale of locales) {
    const dict = getDictionary(locale);

    it(`${locale} has admin role label`, () => {
      assert.ok(dict.roles.ADMIN.length > 0);
    });

    it(`${locale} has manager role label`, () => {
      assert.ok(dict.roles.MANAGER.length > 0);
    });

    it(`${locale} has member role label`, () => {
      assert.ok(dict.roles.MEMBER.length > 0);
    });
  }
});

describe("editor copy exists in all locales", () => {
  const editorPaths = [
    "plans.submit",
    "plans.addItem",
    "reports.submit",
    "reports.addEntry",
    "reports.checkOffItem",
    "settings.saveProfile",
    "admin.createUser",
    "navEditor.backToHome",
    "shell.expandSidebar",
  ] as const;

  for (const path of editorPaths) {
    for (const locale of locales) {
      it(`${locale} has ${path}`, () => {
        const flat = flattenDictionary(getDictionary(locale));
        assert.ok(flat[path]?.length > 0);
      });
    }
  }
});
