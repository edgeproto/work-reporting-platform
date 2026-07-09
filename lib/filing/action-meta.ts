import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { filingStatusFromRecord } from "@/lib/filing/status";

export type FilingActionVariant = "default" | "secondary" | "outline";

export type FilingActionMeta = {
  label: string;
  variant: FilingActionVariant;
};

export function planViewActionMeta(
  plan: { status: string } | null | undefined,
  dict: Dictionary,
): FilingActionMeta | null {
  if (!plan) {
    return null;
  }
  if (filingStatusFromRecord(plan) === "draft") {
    return {
      label: dict.home.continueDraftPlan,
      variant: "secondary",
    };
  }
  return {
    label: dict.home.viewPlan,
    variant: "outline",
  };
}

export function reportViewActionMeta(
  report: { status: string } | null | undefined,
  dict: Dictionary,
): FilingActionMeta | null {
  if (!report) {
    return null;
  }
  if (filingStatusFromRecord(report) === "draft") {
    return {
      label: dict.home.continueDraftReport,
      variant: "secondary",
    };
  }
  return {
    label: dict.home.viewReport,
    variant: "outline",
  };
}

export function planHomeActionMeta(
  plan: { status: string } | null | undefined,
  editable: boolean,
  dict: Dictionary,
): FilingActionMeta {
  if (!plan && editable) {
    return { label: dict.home.filePlan, variant: "default" };
  }
  if (plan && filingStatusFromRecord(plan) === "draft" && editable) {
    return { label: dict.home.continueDraftPlan, variant: "secondary" };
  }
  return { label: dict.home.viewPlan, variant: "outline" };
}

export function reportHomeActionMeta(
  report: { status: string } | null | undefined,
  editable: boolean,
  dict: Dictionary,
): FilingActionMeta {
  if (!report && editable) {
    return { label: dict.home.fileReport, variant: "default" };
  }
  if (report && filingStatusFromRecord(report) === "draft" && editable) {
    return { label: dict.home.continueDraftReport, variant: "secondary" };
  }
  return { label: dict.home.viewReport, variant: "outline" };
}

export const filingSectionClassName =
  "space-y-2 rounded-lg border bg-background/70 p-3 text-sm";

export const filingInnerCardClassName = "border bg-background/70 shadow-none";
