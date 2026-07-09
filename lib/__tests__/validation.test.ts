import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  continuousNotesSchema,
  dateStringSchema,
  emailSchema,
  loginSchema,
  periodTypeSchema,
  planItemSchema,
  reportEntryTitleSchema,
  reportEntryUpdateSchema,
  reportHoursSchema,
  submitReportHoursSchema,
  unplannedEntrySchema,
  validateUploadFile,
  visibilitySchema,
} from "@/lib/validation";

import { mockFile } from "./helpers";

const validEmails = [
  "admin@localhost",
  "user@example.com",
  "a@b.co",
  "team.member@company.internal",
  "x@y.z",
];

const invalidEmails = [
  "",
  "   ",
  "not-an-email",
  "@missing-local.com",
  "missing-at.com",
  "spaces in@email.com",
  "double@@at.com",
];

describe("emailSchema", () => {
  for (const email of validEmails) {
    it(`accepts ${email}`, () => {
      assert.equal(emailSchema.safeParse(email).success, true);
    });
  }

  for (const email of invalidEmails) {
    it(`rejects ${JSON.stringify(email)}`, () => {
      assert.equal(emailSchema.safeParse(email).success, false);
    });
  }
});

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({
      email: "admin@localhost",
      password: "secret",
    });
    assert.equal(result.success, true);
  });

  it("rejects empty password", () => {
    assert.equal(
      loginSchema.safeParse({ email: "a@b.co", password: "" }).success,
      false,
    );
  });

  it("rejects invalid email", () => {
    assert.equal(
      loginSchema.safeParse({ email: "bad", password: "x" }).success,
      false,
    );
  });
});

describe("periodTypeSchema", () => {
  for (const type of ["DAILY", "WEEKLY", "MONTHLY"] as const) {
    it(`accepts ${type}`, () => {
      assert.equal(periodTypeSchema.safeParse(type).success, true);
    });
  }

  for (const type of ["daily", "YEARLY", "", "WEEK"]) {
    it(`rejects ${type}`, () => {
      assert.equal(periodTypeSchema.safeParse(type).success, false);
    });
  }
});

describe("dateStringSchema", () => {
  const valid = ["2025-01-01", "2024-12-31", "2000-06-15"];
  const invalid = ["2025-1-01", "25-01-01", "2025/01/01", "not-a-date", ""];

  for (const date of valid) {
    it(`accepts ${date}`, () => {
      assert.equal(dateStringSchema.safeParse(date).success, true);
    });
  }

  for (const date of invalid) {
    it(`rejects ${JSON.stringify(date)}`, () => {
      assert.equal(dateStringSchema.safeParse(date).success, false);
    });
  }
});

describe("visibilitySchema", () => {
  for (const v of ["PUBLIC", "PRIVATE"] as const) {
    it(`accepts ${v}`, () => {
      assert.equal(visibilitySchema.safeParse(v).success, true);
    });
  }

  it("rejects unknown visibility", () => {
    assert.equal(visibilitySchema.safeParse("SECRET").success, false);
  });
});

describe("planItemSchema", () => {
  it("accepts minimal valid item", () => {
    const result = planItemSchema.safeParse({ title: "Task A" });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.visibility, "PUBLIC");
    }
  });

  it("trims title", () => {
    const result = planItemSchema.safeParse({ title: "  Task  " });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.title, "Task");
    }
  });

  it("rejects empty title", () => {
    assert.equal(planItemSchema.safeParse({ title: "   " }).success, false);
  });

  it("rejects title over 200 chars", () => {
    assert.equal(
      planItemSchema.safeParse({ title: "x".repeat(201) }).success,
      false,
    );
  });

  it("rejects description over 2000 chars", () => {
    assert.equal(
      planItemSchema.safeParse({
        title: "Ok",
        description: "x".repeat(2001),
      }).success,
      false,
    );
  });
});

describe("continuousNotesSchema", () => {
  it("accepts empty string", () => {
    assert.equal(continuousNotesSchema.safeParse("").success, true);
  });

  it("accepts 10000 chars", () => {
    assert.equal(
      continuousNotesSchema.safeParse("a".repeat(10000)).success,
      true,
    );
  });

  it("rejects over 10000 chars", () => {
    assert.equal(
      continuousNotesSchema.safeParse("a".repeat(10001)).success,
      false,
    );
  });
});

describe("reportEntryTitleSchema", () => {
  it("accepts valid title", () => {
    assert.equal(reportEntryTitleSchema.safeParse("Work item").success, true);
  });

  it("rejects empty after trim", () => {
    assert.equal(reportEntryTitleSchema.safeParse("  ").success, false);
  });
});

describe("reportHoursSchema", () => {
  const valid = [0, 0.5, 1, 8, 24, "3.5"];
  const invalid = [-1, 25, 100, "abc"];

  for (const hours of valid) {
    it(`accepts ${hours}`, () => {
      assert.equal(reportHoursSchema.safeParse(hours).success, true);
    });
  }

  for (const hours of invalid) {
    it(`rejects ${hours}`, () => {
      assert.equal(reportHoursSchema.safeParse(hours).success, false);
    });
  }
});

describe("submitReportHoursSchema", () => {
  const valid = [0.1, 1, 8, 24];
  const invalid = [0, -1, 25];

  for (const hours of valid) {
    it(`accepts ${hours}`, () => {
      assert.equal(submitReportHoursSchema.safeParse(hours).success, true);
    });
  }

  for (const hours of invalid) {
    it(`rejects ${hours}`, () => {
      assert.equal(submitReportHoursSchema.safeParse(hours).success, false);
    });
  }
});

describe("unplannedEntrySchema", () => {
  it("accepts valid entry", () => {
    const result = unplannedEntrySchema.safeParse({
      title: "Ad-hoc work",
      hours: 2,
    });
    assert.equal(result.success, true);
  });

  it("rejects zero hours", () => {
    assert.equal(
      unplannedEntrySchema.safeParse({ title: "X", hours: 0 }).success,
      false,
    );
  });
});

describe("reportEntryUpdateSchema", () => {
  it("allows zero hours on update", () => {
    assert.equal(
      reportEntryUpdateSchema.safeParse({ hours: 0 }).success,
      true,
    );
  });

  it("defaults visibility to PUBLIC", () => {
    const result = reportEntryUpdateSchema.safeParse({ hours: 1 });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.visibility, "PUBLIC");
    }
  });
});

describe("validateUploadFile", () => {
  const allowed = [
    ["report.pdf", "application/pdf"],
    ["photo.jpg", "image/jpeg"],
    ["photo.jpeg", "image/jpeg"],
    ["image.png", "image/png"],
    ["anim.gif", "image/gif"],
    ["pic.webp", "image/webp"],
    ["doc.doc", "application/msword"],
    ["doc.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    ["sheet.xls", "application/vnd.ms-excel"],
    ["sheet.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    ["slides.ppt", "application/vnd.ms-powerpoint"],
    ["slides.pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
    ["notes.txt", "text/plain"],
  ] as const;

  for (const [name, type] of allowed) {
    it(`allows ${name} (${type})`, () => {
      const result = validateUploadFile(mockFile(name, { type }));
      assert.equal(result.ok, true);
    });
  }

  const rejected = [
    ["virus.exe", "application/octet-stream"],
    ["script.sh", "text/x-shellscript"],
    ["archive.zip", "application/zip"],
    ["data.json", "application/json"],
    ["noextension", ""],
  ] as const;

  for (const [name, type] of rejected) {
    it(`rejects ${name}`, () => {
      const result = validateUploadFile(mockFile(name, { type }));
      assert.equal(result.ok, false);
    });
  }

  it("rejects empty file", () => {
    const result = validateUploadFile(mockFile("empty.pdf", { type: "application/pdf", size: 0 }));
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error, "File is empty.");
    }
  });

  it("rejects missing file name", () => {
    const result = validateUploadFile(mockFile("   ", { type: "application/pdf" }));
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error, "File name is required.");
    }
  });

  it("allows extension when mime is empty", () => {
    const result = validateUploadFile(mockFile("backup.pdf", { type: "" }));
    assert.equal(result.ok, true);
  });
});
