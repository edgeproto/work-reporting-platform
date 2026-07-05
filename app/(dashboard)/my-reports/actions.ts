"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { PeriodType } from "@/app/generated/prisma/enums";
import { requireSession } from "@/lib/auth";
import {
  addUnplannedEntry,
  checkOffPlanItem,
  createReportForPeriod,
  deleteReport,
  deleteReportEntry,
  submitReport,
  uncheckPlanItem,
  updateReportEntry,
} from "@/lib/reports/mutations";
import {
  dateStringSchema,
  periodTypeSchema,
  reportEntryUpdateSchema,
  unplannedEntrySchema,
} from "@/lib/validation";

export type ActionResult = {
  error?: string;
  success?: boolean;
  entryId?: string;
};

const createReportSchema = z.object({
  type: periodTypeSchema,
  date: dateStringSchema,
});

export async function createReportAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = createReportSchema.safeParse({
    type: formData.get("type"),
    date: formData.get("date"),
  });

  if (!parsed.success) {
    return { error: "Invalid report parameters." };
  }

  const report = await createReportForPeriod(
    session.user.id,
    session.user.organizationId,
    parsed.data.type as PeriodType,
    parsed.data.date,
  );

  revalidatePath("/my-reports");
  redirect(`/my-reports/${report.id}`);
}

export async function checkOffPlanItemAction(
  reportId: string,
  planItemId: string,
): Promise<ActionResult> {
  const session = await requireSession();

  try {
    const entry = await checkOffPlanItem(
      reportId,
      planItemId,
      session.user.id,
      session.user.organizationId,
    );
    revalidatePath(`/my-reports/${reportId}`);
    return { success: true, entryId: entry.id };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to check off item.",
    };
  }
}

export async function uncheckPlanItemAction(
  reportId: string,
  planItemId: string,
): Promise<ActionResult> {
  const session = await requireSession();

  try {
    await uncheckPlanItem(
      reportId,
      planItemId,
      session.user.id,
      session.user.organizationId,
    );
    revalidatePath(`/my-reports/${reportId}`);
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to uncheck item.",
    };
  }
}

export async function addUnplannedEntryAction(
  reportId: string,
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = unplannedEntrySchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    hours: formData.get("hours"),
    visibility: formData.get("visibility") ?? "PUBLIC",
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input.";
    return { error: firstError };
  }

  try {
    const entry = await addUnplannedEntry(
      reportId,
      session.user.id,
      session.user.organizationId,
      parsed.data,
    );
    revalidatePath(`/my-reports/${reportId}`);
    return { success: true, entryId: entry.id };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to add entry.",
    };
  }
}

export async function updateReportEntryAction(
  reportId: string,
  entryId: string,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = reportEntryUpdateSchema.safeParse({
    description: formData.get("description") || undefined,
    hours: formData.get("hours"),
    visibility: formData.get("visibility") ?? "PUBLIC",
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input.";
    return { error: firstError };
  }

  try {
    await updateReportEntry(
      entryId,
      reportId,
      session.user.id,
      session.user.organizationId,
      parsed.data,
    );
    revalidatePath(`/my-reports/${reportId}`);
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to update entry.",
    };
  }
}

export async function deleteReportEntryAction(
  reportId: string,
  entryId: string,
): Promise<ActionResult> {
  const session = await requireSession();

  try {
    await deleteReportEntry(
      entryId,
      reportId,
      session.user.id,
      session.user.organizationId,
    );
    revalidatePath(`/my-reports/${reportId}`);
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to delete entry.",
    };
  }
}

export async function submitReportAction(reportId: string): Promise<ActionResult> {
  const session = await requireSession();

  try {
    await submitReport(
      reportId,
      session.user.id,
      session.user.organizationId,
    );
    revalidatePath("/my-reports");
    revalidatePath(`/my-reports/${reportId}`);
    revalidatePath("/my-plans");
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to submit report.",
    };
  }
}

export async function deleteReportAction(reportId: string): Promise<ActionResult> {
  const session = await requireSession();

  try {
    await deleteReport(
      reportId,
      session.user.id,
      session.user.organizationId,
    );
    revalidatePath("/my-reports");
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to delete report.",
    };
  }
}
