"use client";

import { PlanItemOutcome, SubmissionStatus } from "@/app/generated/prisma/enums";
import { useDictionary } from "@/components/i18n-provider";
import { Badge } from "@/components/ui/badge";

export function PlanStatusBadge({ status }: { status: SubmissionStatus }) {
  const dict = useDictionary();

  if (status === SubmissionStatus.SUBMITTED) {
    return <Badge variant="default">{dict.badges.submitted}</Badge>;
  }
  return <Badge variant="secondary">{dict.badges.draft}</Badge>;
}

export function PlanItemOutcomeBadge({
  outcome,
}: {
  outcome: PlanItemOutcome;
}) {
  const dict = useDictionary();

  if (outcome === PlanItemOutcome.OPEN) {
    return null;
  }

  const variant =
    outcome === PlanItemOutcome.COMPLETED
      ? "default"
      : outcome === PlanItemOutcome.FAILED
        ? "destructive"
        : "secondary";

  const label =
    outcome === PlanItemOutcome.COMPLETED
      ? dict.badges.completed
      : outcome === PlanItemOutcome.FAILED
        ? dict.badges.failed
        : dict.badges.cancelled;

  return <Badge variant={variant}>{label}</Badge>;
}

export function VisibilityBadge({
  visibility,
}: {
  visibility: "PUBLIC" | "PRIVATE";
}) {
  const dict = useDictionary();

  if (visibility === "PRIVATE") {
    return <Badge variant="outline">{dict.badges.private}</Badge>;
  }
  return <Badge variant="ghost">{dict.badges.public}</Badge>;
}
