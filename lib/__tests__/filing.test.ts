import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { en } from "@/lib/i18n/dictionaries/en";
import {
  feedCardAccentClass,
  filingStatusFromRecord,
  filingStatusFromTimestamps,
  periodFilingAccentClass,
} from "@/lib/filing/status";
import {
  planHomeActionMeta,
  planViewActionMeta,
  reportHomeActionMeta,
  reportViewActionMeta,
} from "@/lib/filing/action-meta";

const statuses = ["missing", "draft", "submitted"] as const;

function record(status: (typeof statuses)[number]) {
  if (status === "missing") {
    return null;
  }
  return { status: status === "submitted" ? "submitted" : "draft" };
}

function timestamps(status: (typeof statuses)[number]) {
  if (status === "missing") {
    return null;
  }
  return {
    submittedAt: status === "submitted" ? "2025-06-01T12:00:00.000Z" : null,
    updatedAt: "2025-06-01T12:00:00.000Z",
  };
}

describe("filingStatusFromRecord", () => {
  for (const status of statuses) {
    it(`maps ${status}`, () => {
      assert.equal(filingStatusFromRecord(record(status)), status);
    });
  }
});

describe("filingStatusFromTimestamps", () => {
  for (const status of statuses) {
    it(`maps ${status}`, () => {
      assert.equal(filingStatusFromTimestamps(timestamps(status)), status);
    });
  }
});

describe("periodFilingAccentClass", () => {
  for (const planStatus of statuses) {
    for (const reportStatus of statuses) {
      for (const editable of [true, false] as const) {
        it(`plan=${planStatus} report=${reportStatus} editable=${editable}`, () => {
          const cls = periodFilingAccentClass(
            record(planStatus),
            record(reportStatus),
            editable,
          );
          assert.equal(typeof cls, "string");
          if (!editable) {
            assert.ok(cls.includes("muted"));
          }
          if (
            editable &&
            planStatus === "submitted" &&
            reportStatus === "submitted"
          ) {
            assert.ok(cls.includes("green"));
          }
          if (
            editable &&
            (planStatus !== "submitted" || reportStatus !== "submitted")
          ) {
            assert.ok(cls.includes("amber") || cls.includes("muted"));
          }
        });
      }
    }
  }
});

describe("feedCardAccentClass", () => {
  for (const planStatus of statuses) {
    for (const reportStatus of statuses) {
      it(`plan=${planStatus} report=${reportStatus}`, () => {
        const cls = feedCardAccentClass(record(planStatus), record(reportStatus));
        assert.equal(typeof cls, "string");
      });
    }
  }
});

describe("planViewActionMeta", () => {
  it("returns null when no plan", () => {
    assert.equal(planViewActionMeta(null, en), null);
  });

  it("draft plan shows continue label", () => {
    const meta = planViewActionMeta({ status: "draft" }, en);
    assert.equal(meta?.label, en.home.continueDraftPlan);
    assert.equal(meta?.variant, "secondary");
  });

  it("submitted plan shows view label", () => {
    const meta = planViewActionMeta({ status: "submitted" }, en);
    assert.equal(meta?.label, en.home.viewPlan);
    assert.equal(meta?.variant, "outline");
  });
});

describe("reportViewActionMeta", () => {
  it("returns null when no report", () => {
    assert.equal(reportViewActionMeta(null, en), null);
  });

  it("draft report shows continue label", () => {
    const meta = reportViewActionMeta({ status: "draft" }, en);
    assert.equal(meta?.label, en.home.continueDraftReport);
  });

  it("submitted report shows view label", () => {
    const meta = reportViewActionMeta({ status: "submitted" }, en);
    assert.equal(meta?.label, en.home.viewReport);
  });
});

describe("planHomeActionMeta", () => {
  for (const editable of [true, false] as const) {
    for (const status of statuses) {
      it(`plan=${status} editable=${editable}`, () => {
        const meta = planHomeActionMeta(record(status), editable, en);
        assert.ok(meta.label.length > 0);
        if (!record(status) && editable) {
          assert.equal(meta.label, en.home.filePlan);
          assert.equal(meta.variant, "default");
        }
      });
    }
  }
});

describe("reportHomeActionMeta", () => {
  for (const editable of [true, false] as const) {
    for (const status of statuses) {
      it(`report=${status} editable=${editable}`, () => {
        const meta = reportHomeActionMeta(record(status), editable, en);
        assert.ok(meta.label.length > 0);
        if (!record(status) && editable) {
          assert.equal(meta.label, en.home.fileReport);
        }
      });
    }
  }
});
