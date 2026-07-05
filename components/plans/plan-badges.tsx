import { SubmissionStatus } from "@/app/generated/prisma/enums";
import { Badge } from "@/components/ui/badge";

export function PlanStatusBadge({ status }: { status: SubmissionStatus }) {
  if (status === SubmissionStatus.SUBMITTED) {
    return <Badge variant="default">Submitted</Badge>;
  }
  return <Badge variant="secondary">Draft</Badge>;
}

export function VisibilityBadge({ visibility }: { visibility: "PUBLIC" | "PRIVATE" }) {
  if (visibility === "PRIVATE") {
    return <Badge variant="outline">Private</Badge>;
  }
  return <Badge variant="ghost">Public</Badge>;
}
