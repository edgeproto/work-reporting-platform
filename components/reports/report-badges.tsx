import { SubmissionStatus } from "@/app/generated/prisma/enums";
import { Badge } from "@/components/ui/badge";

export function ReportStatusBadge({ status }: { status: SubmissionStatus }) {
  if (status === SubmissionStatus.SUBMITTED) {
    return <Badge variant="default">Submitted</Badge>;
  }
  return <Badge variant="secondary">Draft</Badge>;
}

export { VisibilityBadge } from "@/components/plans/plan-badges";
