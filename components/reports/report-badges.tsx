"use client";

import { SubmissionStatus } from "@/app/generated/prisma/enums";
import { useDictionary } from "@/components/i18n-provider";
import { Badge } from "@/components/ui/badge";

export function ReportStatusBadge({ status }: { status: SubmissionStatus }) {
  const dict = useDictionary();

  if (status === SubmissionStatus.SUBMITTED) {
    return <Badge variant="default">{dict.badges.submitted}</Badge>;
  }
  return <Badge variant="secondary">{dict.badges.draft}</Badge>;
}

export { VisibilityBadge } from "@/components/plans/plan-badges";
