import { PlanItemOutcome, SubmissionStatus } from "@/app/generated/prisma/enums";
import { Badge } from "@/components/ui/badge";

export function PlanStatusBadge({ status }: { status: SubmissionStatus }) {
  if (status === SubmissionStatus.SUBMITTED) {
    return <Badge variant="default">Submitted</Badge>;
  }
  return <Badge variant="secondary">Draft</Badge>;
}

export function PlanItemOutcomeBadge({
  outcome,
}: {
  outcome: PlanItemOutcome;
}) {
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
      ? "Completed"
      : outcome === PlanItemOutcome.FAILED
        ? "Failed"
        : "Cancelled";

  return <Badge variant={variant}>{label}</Badge>;
}

export function VisibilityBadge({ visibility }: { visibility: "PUBLIC" | "PRIVATE" }) {
  if (visibility === "PRIVATE") {
    return <Badge variant="outline">Private</Badge>;
  }
  return <Badge variant="ghost">Public</Badge>;
}
