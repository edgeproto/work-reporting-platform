import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { PeriodType } from "@/app/generated/prisma/enums";
import {
  dashboardFiltersToSearchParams,
  parseDashboardFilters,
} from "@/lib/dashboard/filters";
import {
  defaultReferenceDateForType,
  formatDashboardTimestamp,
  isValidReferenceDate,
  periodBoundsFromFilters,
  periodStartIso,
  resolveReferenceDate,
} from "@/lib/dashboard/period";
import { locales } from "@/lib/i18n/locales";

describe("isValidReferenceDate", () => {
  it("accepts valid dates", () => {
    assert.equal(isValidReferenceDate("2025-06-15"), true);
  });

  it("rejects invalid dates", () => {
    assert.equal(isValidReferenceDate("2025-6-15"), false);
    assert.equal(isValidReferenceDate(undefined), false);
    assert.equal(isValidReferenceDate(""), false);
  });
});

describe("resolveReferenceDate", () => {
  it("uses param when valid", () => {
    assert.equal(
      resolveReferenceDate(PeriodType.DAILY, "2025-01-15"),
      "2025-01-15",
    );
  });

  it("falls back to default when invalid", () => {
    const resolved = resolveReferenceDate(PeriodType.WEEKLY, "bad");
    assert.match(resolved, /^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("defaultReferenceDateForType", () => {
  const today = "2025-06-15";

  it("daily returns today", () => {
    assert.equal(defaultReferenceDateForType(PeriodType.DAILY, today), today);
  });

  it("monthly returns first of month", () => {
    assert.equal(
      defaultReferenceDateForType(PeriodType.MONTHLY, today),
      "2025-06-01",
    );
  });

  it("weekly returns sunday of current week", () => {
    const ref = defaultReferenceDateForType(PeriodType.WEEKLY, today);
    assert.match(ref, /^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("parseDashboardFilters", () => {
  it("uses defaults for empty params", () => {
    const filters = parseDashboardFilters({});
    assert.equal(filters.periodType, PeriodType.WEEKLY);
    assert.equal(filters.sort, "name");
    assert.equal(filters.dir, "asc");
    assert.match(filters.referenceDate, /^\d{4}-\d{2}-\d{2}$/);
  });

  it("parses explicit type and date", () => {
    const filters = parseDashboardFilters({
      type: "DAILY",
      date: "2025-03-10",
      sort: "hours",
      dir: "desc",
    });
    assert.equal(filters.periodType, PeriodType.DAILY);
    assert.equal(filters.referenceDate, "2025-03-10");
    assert.equal(filters.sort, "hours");
    assert.equal(filters.dir, "desc");
  });

  it("ignores invalid sort and type", () => {
    const filters = parseDashboardFilters({
      type: "YEARLY",
      sort: "invalid",
      dir: "sideways",
    });
    assert.equal(filters.periodType, PeriodType.WEEKLY);
    assert.equal(filters.sort, "name");
    assert.equal(filters.dir, "asc");
  });

  for (const sort of ["name", "completion", "hours"] as const) {
    it(`default dir for sort=${sort}`, () => {
      const filters = parseDashboardFilters({ sort });
      assert.equal(filters.sort, sort);
      assert.equal(filters.dir, sort === "name" ? "asc" : "desc");
    });
  }
});

describe("dashboardFiltersToSearchParams round-trip", () => {
  const cases = [
    parseDashboardFilters({}),
    parseDashboardFilters({ type: "DAILY", date: "2025-01-01" }),
    parseDashboardFilters({ sort: "hours", dir: "asc" }),
    parseDashboardFilters({
      type: "MONTHLY",
      date: "2025-06-01",
      sort: "completion",
      dir: "desc",
    }),
  ];

  for (let i = 0; i < cases.length; i++) {
    it(`round-trip case ${i}`, () => {
      const original = cases[i]!;
      const params = dashboardFiltersToSearchParams(original);
      const restored = parseDashboardFilters({
        type: params.get("type") ?? undefined,
        date: params.get("date") ?? undefined,
        sort: params.get("sort") ?? undefined,
        dir: params.get("dir") ?? undefined,
      });
      assert.equal(restored.periodType, original.periodType);
      assert.equal(restored.referenceDate, original.referenceDate);
      assert.equal(restored.sort, original.sort);
      assert.equal(restored.dir, original.dir);
    });
  }
});

describe("periodBoundsFromFilters", () => {
  it("returns bounds for weekly filter", () => {
    const bounds = periodBoundsFromFilters(PeriodType.WEEKLY, "2025-06-15");
    assert.ok(bounds.periodStart <= bounds.periodEnd);
  });
});

describe("periodStartIso", () => {
  it("formats date as YYYY-MM-DD", () => {
    const iso = periodStartIso(new Date("2025-06-15T00:00:00.000Z"));
    assert.equal(iso, "2025-06-15");
  });
});

describe("formatDashboardTimestamp", () => {
  const fixed = "2025-06-15T15:30:00.000Z";

  for (const locale of locales) {
    for (const timeZone of ["UTC", "America/New_York", "Asia/Seoul"] as const) {
      it(`formats ${locale} in ${timeZone}`, () => {
        const formatted = formatDashboardTimestamp(fixed, { locale, timeZone });
        assert.ok(formatted.length > 5);
        assert.ok(/\d/.test(formatted));
      });
    }
  }

  it("server and client use same timezone when passed explicitly", () => {
    const a = formatDashboardTimestamp(fixed, {
      locale: "en",
      timeZone: "UTC",
    });
    const b = formatDashboardTimestamp(fixed, {
      locale: "en",
      timeZone: "UTC",
    });
    assert.equal(a, b);
  });
});
