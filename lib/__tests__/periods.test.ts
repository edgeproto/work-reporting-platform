import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { PeriodType } from "@/app/generated/prisma/enums";
import {
  addDays,
  canEditPeriod,
  dateToMonthInputValue,
  dateToWeekInputValue,
  formatDateInTz,
  formatPeriodLabel,
  formatPeriodPreview,
  getMonthBoundsForDate,
  getOrgTimezone,
  getPeriodBounds,
  getWeekOfMonthInfo,
  isPeriodPast,
  listWeeksInMonth,
  monthInputToReferenceDate,
  parseDateString,
  periodPickerInputType,
  pickerValueFromReferenceDate,
  referenceDateFromPicker,
  sundayFromWeekPicker,
  todayDateString,
  weekInputToReferenceDate,
  weekPickerMonthFromReference,
} from "@/lib/periods";
import { locales } from "@/lib/i18n/locales";

import { allDatesInYear, allMonthValues } from "./helpers";

const TZ = "UTC";

describe("parseDateString and formatDateInTz", () => {
  for (const dateStr of allDatesInYear(2024)) {
    it(`round-trips ${dateStr}`, () => {
      const parsed = parseDateString(dateStr);
      assert.equal(formatDateInTz(parsed, TZ), dateStr);
    });
  }

  for (const dateStr of allDatesInYear(2025)) {
    it(`parses ${dateStr} as UTC midnight`, () => {
      const parsed = parseDateString(dateStr);
      assert.equal(parsed.toISOString(), `${dateStr}T00:00:00.000Z`);
    });
  }
});

describe("addDays", () => {
  const cases: Array<[string, number, string]> = [
    ["2025-01-01", 0, "2025-01-01"],
    ["2025-01-01", 1, "2025-01-02"],
    ["2025-01-01", -1, "2024-12-31"],
    ["2024-02-28", 1, "2024-02-29"],
    ["2024-02-29", 1, "2024-03-01"],
    ["2025-12-31", 1, "2026-01-01"],
    ["2025-03-01", -1, "2025-02-28"],
    ["2025-06-15", 7, "2025-06-22"],
    ["2025-06-15", -7, "2025-06-08"],
    ["2025-01-15", 365, "2026-01-15"],
  ];

  for (const [start, days, expected] of cases) {
    it(`addDays(${start}, ${days}) = ${expected}`, () => {
      assert.equal(addDays(start, days), expected);
    });
  }

  for (const dateStr of allDatesInYear(2025)) {
    it(`addDays(${dateStr}, 1) then -1 returns same day`, () => {
      assert.equal(addDays(addDays(dateStr, 1), -1), dateStr);
    });
  }
});

describe("getPeriodBounds DAILY", () => {
  for (const dateStr of allDatesInYear(2025)) {
    it(`daily bounds for ${dateStr}`, () => {
      const { periodStart, periodEnd } = getPeriodBounds(
        PeriodType.DAILY,
        dateStr,
        TZ,
      );
      assert.equal(formatDateInTz(periodStart, TZ), dateStr);
      assert.equal(formatDateInTz(periodEnd, TZ), dateStr);
    });
  }
});

describe("getPeriodBounds WEEKLY (Sunday start)", () => {
  const knownWeeks: Array<[string, string, string]> = [
    ["2025-01-01", "2024-12-29", "2025-01-04"],
    ["2025-01-05", "2025-01-05", "2025-01-11"],
    ["2025-01-11", "2025-01-05", "2025-01-11"],
    ["2025-06-15", "2025-06-15", "2025-06-21"],
    ["2025-12-31", "2025-12-28", "2026-01-03"],
  ];

  for (const [ref, start, end] of knownWeeks) {
    it(`week containing ${ref} is ${start} – ${end}`, () => {
      const bounds = getPeriodBounds(PeriodType.WEEKLY, ref, TZ);
      assert.equal(formatDateInTz(bounds.periodStart, TZ), start);
      assert.equal(formatDateInTz(bounds.periodEnd, TZ), end);
    });
  }

  for (const dateStr of allDatesInYear(2025)) {
    it(`weekly span for ${dateStr} is 7 days`, () => {
      const { periodStart, periodEnd } = getPeriodBounds(
        PeriodType.WEEKLY,
        dateStr,
        TZ,
      );
      const start = formatDateInTz(periodStart, TZ);
      const end = formatDateInTz(periodEnd, TZ);
      assert.equal(addDays(start, 6), end);
    });
  }
});

describe("getPeriodBounds MONTHLY", () => {
  for (const month of allMonthValues(2025)) {
    it(`monthly bounds for ${month}`, () => {
      const ref = monthInputToReferenceDate(month);
      const { periodStart, periodEnd } = getPeriodBounds(
        PeriodType.MONTHLY,
        ref,
        TZ,
      );
      assert.equal(formatDateInTz(periodStart, TZ), `${month}-01`);
      const lastDay = formatDateInTz(periodEnd, TZ).slice(8, 10);
      assert.ok(Number(lastDay) >= 28 && Number(lastDay) <= 31);
      assert.equal(formatDateInTz(periodStart, TZ).slice(0, 7), month);
      assert.equal(formatDateInTz(periodEnd, TZ).slice(0, 7), month);
    });
  }
});

describe("getWeekOfMonthInfo", () => {
  for (const month of allMonthValues(2025)) {
    const weeks = listWeeksInMonth(month, TZ);
    for (const week of weeks) {
      it(`${month} week ${week.weekNum} (${week.sunday}) has valid info`, () => {
        const info = getWeekOfMonthInfo(week.sunday, TZ);
        assert.equal(info.weekNum, week.weekNum);
        assert.ok(info.month >= 1 && info.month <= 12);
        assert.ok(info.monthLabel.length > 0);
      });
    }
  }
});

describe("listWeeksInMonth", () => {
  for (const year of [2024, 2025, 2026]) {
    for (const month of allMonthValues(year)) {
      it(`lists weeks for ${month}`, () => {
        const weeks = listWeeksInMonth(month, TZ);
        assert.ok(weeks.length >= 4 && weeks.length <= 6);
        for (const week of weeks) {
          assert.match(week.sunday, /^\d{4}-\d{2}-\d{2}$/);
          assert.ok(week.label.length > 0);
          assert.ok(week.weekNum >= 1);
        }
      });
    }
  }

  it("returns empty for invalid month", () => {
    assert.deepEqual(listWeeksInMonth("invalid", TZ), []);
  });
});

describe("monthInputToReferenceDate", () => {
  for (const month of allMonthValues(2025)) {
    it(`maps ${month} to first of month`, () => {
      assert.equal(monthInputToReferenceDate(month), `${month}-01`);
    });
  }

  it("throws on invalid month", () => {
    assert.throws(() => monthInputToReferenceDate("bad"), /Invalid month/);
  });
});

describe("dateToMonthInputValue", () => {
  for (const dateStr of allDatesInYear(2025)) {
    it(`extracts month from ${dateStr}`, () => {
      assert.equal(dateToMonthInputValue(dateStr), dateStr.slice(0, 7));
    });
  }
});

describe("weekInputToReferenceDate", () => {
  const weeks = [
    "2025-W01",
    "2025-W10",
    "2025-W26",
    "2025-W52",
    "2024-W01",
    "2026-W01",
  ];
  for (const week of weeks) {
    it(`parses ${week} to a Sunday-start reference`, () => {
      const ref = weekInputToReferenceDate(week);
      assert.match(ref, /^\d{4}-\d{2}-\d{2}$/);
      const bounds = getPeriodBounds(PeriodType.WEEKLY, ref, TZ);
      const sunday = formatDateInTz(bounds.periodStart, TZ);
      assert.equal(sunday, ref);
    });
  }

  it("throws on invalid week", () => {
    assert.throws(() => weekInputToReferenceDate("2025-99"), /Invalid week/);
  });
});

describe("dateToWeekInputValue round-trip", () => {
  for (const dateStr of allDatesInYear(2025)) {
    it(`week input for ${dateStr} round-trips through reference`, () => {
      const weekValue = dateToWeekInputValue(dateStr, TZ);
      const ref = weekInputToReferenceDate(weekValue);
      const bounds = getPeriodBounds(PeriodType.WEEKLY, dateStr, TZ);
      const expectedSunday = formatDateInTz(bounds.periodStart, TZ);
      assert.equal(ref, expectedSunday);
    });
  }
});

describe("periodPickerInputType", () => {
  it("maps period types to picker types", () => {
    assert.equal(periodPickerInputType(PeriodType.DAILY), "date");
    assert.equal(periodPickerInputType(PeriodType.WEEKLY), "week-custom");
    assert.equal(periodPickerInputType(PeriodType.MONTHLY), "month");
  });
});

describe("referenceDateFromPicker and pickerValueFromReferenceDate", () => {
  for (const dateStr of allDatesInYear(2025)) {
    it(`daily picker round-trip for ${dateStr}`, () => {
      const ref = referenceDateFromPicker(PeriodType.DAILY, dateStr);
      assert.equal(ref, dateStr);
      assert.equal(
        pickerValueFromReferenceDate(PeriodType.DAILY, dateStr, TZ),
        dateStr,
      );
    });
  }

  for (const month of allMonthValues(2025)) {
    it(`monthly picker round-trip for ${month}`, () => {
      const ref = referenceDateFromPicker(PeriodType.MONTHLY, month);
      assert.equal(ref, `${month}-01`);
      assert.equal(
        pickerValueFromReferenceDate(PeriodType.MONTHLY, `${month}-15`, TZ),
        month,
      );
    });
  }
});

describe("formatPeriodLabel", () => {
  for (const locale of locales) {
    it(`formats daily label for ${locale}`, () => {
      const date = parseDateString("2025-06-15");
      const label = formatPeriodLabel(
        PeriodType.DAILY,
        date,
        date,
        TZ,
        locale,
      );
      assert.ok(label.length > 0);
    });

    it(`formats weekly label for ${locale}`, () => {
      const bounds = getPeriodBounds(PeriodType.WEEKLY, "2025-06-15", TZ);
      const label = formatPeriodLabel(
        PeriodType.WEEKLY,
        bounds.periodStart,
        bounds.periodEnd,
        TZ,
        locale,
      );
      assert.ok(label.includes("2025") || label.length > 5);
    });

    it(`formats monthly label for ${locale}`, () => {
      const bounds = getPeriodBounds(PeriodType.MONTHLY, "2025-06-01", TZ);
      const label = formatPeriodLabel(
        PeriodType.MONTHLY,
        bounds.periodStart,
        bounds.periodEnd,
        TZ,
        locale,
      );
      assert.ok(label.includes("2025"));
    });
  }
});

describe("formatPeriodPreview", () => {
  it("returns null for daily", () => {
    assert.equal(
      formatPeriodPreview(PeriodType.DAILY, "2025-06-15", TZ),
      null,
    );
  });

  for (const type of [PeriodType.WEEKLY, PeriodType.MONTHLY] as const) {
    it(`returns label for ${type}`, () => {
      const preview = formatPeriodPreview(type, "2025-06-15", TZ);
      assert.ok(preview && preview.length > 0);
    });
  }
});

describe("isPeriodPast", () => {
  it("past date is past relative to fixed today", () => {
    const end = parseDateString("2020-01-01");
    assert.equal(isPeriodPast(end, TZ), true);
  });

  it("future date is not past", () => {
    const end = parseDateString("2099-12-31");
    assert.equal(isPeriodPast(end, TZ), false);
  });
});

describe("canEditPeriod", () => {
  const today = "2025-06-15";

  it("allows today and yesterday for daily", () => {
    const todayBounds = getPeriodBounds(PeriodType.DAILY, today, TZ);
    const yesterdayBounds = getPeriodBounds(
      PeriodType.DAILY,
      addDays(today, -1),
      TZ,
    );
    const oldBounds = getPeriodBounds(PeriodType.DAILY, "2020-01-01", TZ);

    assert.equal(
      canEditPeriod(
        PeriodType.DAILY,
        todayBounds.periodStart,
        todayBounds.periodEnd,
        today,
        TZ,
      ),
      true,
    );
    assert.equal(
      canEditPeriod(
        PeriodType.DAILY,
        yesterdayBounds.periodStart,
        yesterdayBounds.periodEnd,
        today,
        TZ,
      ),
      true,
    );
    assert.equal(
      canEditPeriod(
        PeriodType.DAILY,
        oldBounds.periodStart,
        oldBounds.periodEnd,
        today,
        TZ,
      ),
      false,
    );
  });

  it("allows current and previous week for weekly", () => {
    const currentWeek = getPeriodBounds(PeriodType.WEEKLY, today, TZ);
    const prevSunday = addDays(formatDateInTz(currentWeek.periodStart, TZ), -7);
    const prevWeek = getPeriodBounds(PeriodType.WEEKLY, prevSunday, TZ);

    assert.equal(
      canEditPeriod(
        PeriodType.WEEKLY,
        currentWeek.periodStart,
        currentWeek.periodEnd,
        today,
        TZ,
      ),
      true,
    );
    assert.equal(
      canEditPeriod(
        PeriodType.WEEKLY,
        prevWeek.periodStart,
        prevWeek.periodEnd,
        today,
        TZ,
      ),
      true,
    );
  });

  it("allows current and previous month for monthly", () => {
    const currentMonth = getPeriodBounds(PeriodType.MONTHLY, "2025-06-01", TZ);
    const prevMonth = getPeriodBounds(PeriodType.MONTHLY, "2025-05-01", TZ);
    const oldMonth = getPeriodBounds(PeriodType.MONTHLY, "2024-01-01", TZ);

    assert.equal(
      canEditPeriod(
        PeriodType.MONTHLY,
        currentMonth.periodStart,
        currentMonth.periodEnd,
        today,
        TZ,
      ),
      true,
    );
    assert.equal(
      canEditPeriod(
        PeriodType.MONTHLY,
        prevMonth.periodStart,
        prevMonth.periodEnd,
        today,
        TZ,
      ),
      true,
    );
    assert.equal(
      canEditPeriod(
        PeriodType.MONTHLY,
        oldMonth.periodStart,
        oldMonth.periodEnd,
        today,
        TZ,
      ),
      false,
    );
  });
});

describe("weekPickerMonthFromReference and sundayFromWeekPicker", () => {
  for (const dateStr of allDatesInYear(2025)) {
    it(`week picker month for ${dateStr}`, () => {
      const month = weekPickerMonthFromReference(dateStr, TZ);
      assert.match(month, /^\d{4}-\d{2}$/);
    });
  }

  for (const month of allMonthValues(2025)) {
    const weeks = listWeeksInMonth(month, TZ);
    if (weeks.length > 0) {
      it(`sundayFromWeekPicker keeps valid sunday for ${month}`, () => {
        const sunday = weeks[0]!.sunday;
        assert.equal(sundayFromWeekPicker(month, sunday, TZ), sunday);
      });

      it(`sundayFromWeekPicker falls back for invalid sunday in ${month}`, () => {
        const result = sundayFromWeekPicker(month, "1999-01-01", TZ);
        assert.ok(weeks.some((w) => w.sunday === result));
      });
    }
  }
});

describe("getMonthBoundsForDate", () => {
  for (const dateStr of allDatesInYear(2025)) {
    it(`month bounds contain ${dateStr}`, () => {
      const { periodStart, periodEnd } = getMonthBoundsForDate(dateStr, TZ);
      const start = formatDateInTz(periodStart, TZ);
      const end = formatDateInTz(periodEnd, TZ);
      assert.ok(dateStr >= start && dateStr <= end);
    });
  }
});

describe("getOrgTimezone and todayDateString", () => {
  it("defaults org timezone to UTC when TZ unset", () => {
    const original = process.env.TZ;
    delete process.env.TZ;
    assert.equal(getOrgTimezone(), "UTC");
    if (original) {
      process.env.TZ = original;
    }
  });

  it("todayDateString returns YYYY-MM-DD", () => {
    assert.match(todayDateString(TZ), /^\d{4}-\d{2}-\d{2}$/);
  });
});
