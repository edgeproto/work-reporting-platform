import { PlanItemOutcome } from "@/app/generated/prisma/enums";

export function planItemOutcomeLabel(outcome: PlanItemOutcome): string {
  switch (outcome) {
    case PlanItemOutcome.COMPLETED:
      return "Completed";
    case PlanItemOutcome.FAILED:
      return "Failed";
    case PlanItemOutcome.CANCELLED:
      return "Cancelled";
    case PlanItemOutcome.OPEN:
    default:
      return "Open";
  }
}

export function isPlanItemResolved(outcome: PlanItemOutcome): boolean {
  return outcome !== PlanItemOutcome.OPEN;
}

export function isPlanItemCompleted(outcome: PlanItemOutcome): boolean {
  return outcome === PlanItemOutcome.COMPLETED;
}
