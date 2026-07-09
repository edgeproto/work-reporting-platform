import { PlanItemOutcome, Visibility } from "@/app/generated/prisma/enums";
import { PeriodType } from "@/app/generated/prisma/enums";

export type FeedPlanLine = {
  title: string;
  visibility: Visibility;
  outcome: PlanItemOutcome;
};

export type FeedReportLine = {
  title: string;
  hours: number;
  visibility: Visibility;
};

export type FeedPlanFiling = {
  id: string;
  status: "draft" | "submitted";
  lines: FeedPlanLine[];
  completedCount: number;
};

export type FeedReportFiling = {
  id: string;
  status: "draft" | "submitted";
  lines: FeedReportLine[];
  totalHours: number;
};

export type FeedPeriodCard = {
  type: PeriodType;
  referenceDate: string;
  periodLabel: string;
  heading: string;
  plan: FeedPlanFiling | null;
  report: FeedReportFiling | null;
};

export type MyFeedData = {
  daily: FeedPeriodCard[];
  weekly: FeedPeriodCard[];
};
