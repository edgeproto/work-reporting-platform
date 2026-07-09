import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { PlanItemOutcome } from "@/app/generated/prisma/enums";
import { getPlanItemTitle } from "@/lib/plans/item-title";
import {
  isPlanItemCompleted,
  isPlanItemResolved,
  planItemOutcomeLabel,
} from "@/lib/plans/outcome";
import { getReportEntryTitle } from "@/lib/reports/entry-title";

const outcomes = [
  PlanItemOutcome.OPEN,
  PlanItemOutcome.COMPLETED,
  PlanItemOutcome.FAILED,
  PlanItemOutcome.CANCELLED,
] as const;

describe("planItemOutcomeLabel", () => {
  for (const outcome of outcomes) {
    it(`labels ${outcome}`, () => {
      const label = planItemOutcomeLabel(outcome);
      assert.ok(label.length > 0);
    });
  }
});

describe("isPlanItemResolved", () => {
  for (const outcome of outcomes) {
    it(`${outcome} resolved=${outcome !== PlanItemOutcome.OPEN}`, () => {
      assert.equal(
        isPlanItemResolved(outcome),
        outcome !== PlanItemOutcome.OPEN,
      );
    });
  }
});

describe("isPlanItemCompleted", () => {
  for (const outcome of outcomes) {
    it(`${outcome} completed=${outcome === PlanItemOutcome.COMPLETED}`, () => {
      assert.equal(
        isPlanItemCompleted(outcome),
        outcome === PlanItemOutcome.COMPLETED,
      );
    });
  }
});

describe("getPlanItemTitle", () => {
  const cases: Array<[Parameters<typeof getPlanItemTitle>[0], string]> = [
    [{ customTitle: "Custom" }, "Custom"],
    [{ customTitle: "  Trimmed  " }, "Trimmed"],
    [{ taskTitle: { title: "Task name" } }, "Task name"],
    [{ customTitle: "", taskTitle: { title: "Fallback" } }, "Fallback"],
    [{ customTitle: "   ", taskTitle: { title: "Fallback" } }, "Fallback"],
    [{}, "Untitled"],
    [{ customTitle: null, taskTitle: null }, "Untitled"],
  ];

  for (const [item, expected] of cases) {
    it(`title for ${JSON.stringify(item)}`, () => {
      assert.equal(getPlanItemTitle(item), expected);
    });
  }
});

describe("getReportEntryTitle", () => {
  const cases: Array<[Parameters<typeof getReportEntryTitle>[0], string]> = [
    [{ customTitle: "Entry custom" }, "Entry custom"],
    [
      {
        planItem: { customTitle: "Plan custom" },
      },
      "Plan custom",
    ],
    [{ taskTitle: { title: "Task direct" } }, "Task direct"],
    [
      {
        planItem: { taskTitle: { title: "Plan task" } },
      },
      "Plan task",
    ],
    [
      {
        customTitle: "Winner",
        planItem: { customTitle: "Loser" },
        taskTitle: { title: "Also loser" },
      },
      "Winner",
    ],
    [
      {
        planItem: { customTitle: "Plan wins" },
        taskTitle: { title: "Task loses" },
      },
      "Plan wins",
    ],
    [{}, "Untitled"],
  ];

  for (const [entry, expected] of cases) {
    it(`title for ${JSON.stringify(entry)}`, () => {
      assert.equal(getReportEntryTitle(entry), expected);
    });
  }
});
