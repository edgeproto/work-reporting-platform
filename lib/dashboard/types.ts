import { PlanItemOutcome, Role, Visibility } from "@/app/generated/prisma/enums";

export type RosterPlanLine = {
  title: string;
  visibility: Visibility;
  outcome: PlanItemOutcome;
};

export type RosterReportLine = {
  title: string;
  hours: number;
  visibility: Visibility;
};

export type FilingTimestamps = {
  submittedAt: string | null;
  updatedAt: string;
};

export type MemberRosterRow = {
  id: string;
  name: string;
  role: Role;
  planItemCount: number;
  completedCount: number;
  completionPct: number | null;
  hours: number;
  planLines: RosterPlanLine[];
  reportLines: RosterReportLine[];
  planTimestamps: FilingTimestamps | null;
  reportTimestamps: FilingTimestamps | null;
};
