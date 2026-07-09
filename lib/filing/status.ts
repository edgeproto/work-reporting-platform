import type { FilingTimestamps } from "@/lib/dashboard/types";

export type FilingStatus = "missing" | "draft" | "submitted";

export function filingStatusFromRecord(
  filing: { status: string } | null | undefined,
): FilingStatus {
  if (!filing) {
    return "missing";
  }
  if (filing.status === "submitted") {
    return "submitted";
  }
  return "draft";
}

export function filingStatusFromTimestamps(
  timestamps: FilingTimestamps | null | undefined,
): FilingStatus {
  if (!timestamps) {
    return "missing";
  }
  if (timestamps.submittedAt) {
    return "submitted";
  }
  return "draft";
}

export function periodFilingAccentClass(
  plan: { status: string } | null | undefined,
  report: { status: string } | null | undefined,
  editable: boolean,
): string {
  if (!editable) {
    return "border-l-4 border-l-muted-foreground/25";
  }

  const planStatus = filingStatusFromRecord(plan);
  const reportStatus = filingStatusFromRecord(report);

  if (planStatus === "submitted" && reportStatus === "submitted") {
    return "border-l-4 border-l-green-600/80 bg-green-500/5 dark:border-l-green-500/70 dark:bg-green-500/10";
  }

  if (
    planStatus === "missing" ||
    reportStatus === "missing" ||
    planStatus === "draft" ||
    reportStatus === "draft"
  ) {
    return "border-l-4 border-l-amber-500/80 bg-amber-500/5 dark:border-l-amber-400/70 dark:bg-amber-500/10";
  }

  return "";
}

export function feedCardAccentClass(
  plan: { status: string } | null | undefined,
  report: { status: string } | null | undefined,
): string {
  const planStatus = filingStatusFromRecord(plan);
  const reportStatus = filingStatusFromRecord(report);

  if (planStatus === "submitted" && reportStatus === "submitted") {
    return "border-l-4 border-l-green-600/80 bg-green-500/5 dark:border-l-green-500/70 dark:bg-green-500/10";
  }

  if (
    planStatus === "missing" ||
    reportStatus === "missing" ||
    planStatus === "draft" ||
    reportStatus === "draft"
  ) {
    return "border-l-4 border-l-amber-500/80 bg-amber-500/5 dark:border-l-amber-400/70 dark:bg-amber-500/10";
  }

  return "";
}
