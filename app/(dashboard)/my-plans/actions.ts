"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { PeriodType } from "@/app/generated/prisma/enums";
import { requireSession } from "@/lib/auth";
import {
  addPlanItem,
  createPlanForPeriod,
  deletePlan,
  deletePlanItem,
  reopenPlan,
  submitPlan,
  updateContinuousNotes,
  updatePlanItem,
} from "@/lib/plans/mutations";
import { listSelectableTaskTitles } from "@/lib/task-titles";
import {
  continuousNotesSchema,
  dateStringSchema,
  periodTypeSchema,
  planItemSchema,
  visibilitySchema,
} from "@/lib/validation";

export type ActionResult = {
  error?: string;
  success?: boolean;
};

const createPlanSchema = z.object({
  type: periodTypeSchema,
  date: dateStringSchema,
});

export async function createPlanAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = createPlanSchema.safeParse({
    type: formData.get("type"),
    date: formData.get("date"),
  });

  if (!parsed.success) {
    return { error: "Invalid plan parameters." };
  }

  const plan = await createPlanForPeriod(
    session.user.id,
    session.user.organizationId,
    parsed.data.type as PeriodType,
    parsed.data.date,
  );

  revalidatePath("/my-plans");
  redirect(`/my-plans/${plan.id}`);
}

export async function updateContinuousNotesAction(
  planId: string,
  continuousNotes: string,
): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = continuousNotesSchema.safeParse(continuousNotes);

  if (!parsed.success) {
    return { error: "Notes are too long." };
  }

  try {
    await updateContinuousNotes(
      planId,
      session.user.id,
      session.user.organizationId,
      parsed.data,
    );
    revalidatePath(`/my-plans/${planId}`);
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to save notes.",
    };
  }
}

export async function addPlanItemAction(
  planId: string,
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = planItemSchema.safeParse({
    taskTitleId: formData.get("taskTitleId") || undefined,
    title: formData.get("title") || undefined,
    description: formData.get("description") || undefined,
    visibility: formData.get("visibility") ?? "PUBLIC",
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input.";
    return { error: firstError };
  }

  try {
    await addPlanItem(
      planId,
      session.user.id,
      session.user.organizationId,
      parsed.data,
    );
    revalidatePath(`/my-plans/${planId}`);
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to add item.",
    };
  }
}

const updateItemSchema = z.object({
  itemId: z.string().min(1),
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  visibility: visibilitySchema.optional(),
});

export async function updatePlanItemAction(
  planId: string,
  input: z.infer<typeof updateItemSchema>,
): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = updateItemSchema.safeParse(input);

  if (!parsed.success) {
    return { error: "Invalid input." };
  }

  const { itemId, ...data } = parsed.data;

  try {
    await updatePlanItem(
      itemId,
      session.user.id,
      session.user.organizationId,
      data,
    );
    revalidatePath(`/my-plans/${planId}`);
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to update item.",
    };
  }
}

export async function deletePlanItemAction(
  planId: string,
  itemId: string,
): Promise<ActionResult> {
  const session = await requireSession();

  try {
    await deletePlanItem(
      itemId,
      session.user.id,
      session.user.organizationId,
    );
    revalidatePath(`/my-plans/${planId}`);
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to delete item.",
    };
  }
}

export async function submitPlanAction(planId: string): Promise<ActionResult> {
  const session = await requireSession();

  try {
    await submitPlan(
      planId,
      session.user.id,
      session.user.organizationId,
    );
    revalidatePath("/my-plans");
    revalidatePath(`/my-plans/${planId}`);
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to submit plan.",
    };
  }
}

export async function reopenPlanAction(planId: string): Promise<ActionResult> {
  const session = await requireSession();

  try {
    await reopenPlan(
      planId,
      session.user.id,
      session.user.organizationId,
    );
    revalidatePath("/my-plans");
    revalidatePath(`/my-plans/${planId}`);
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to reopen plan.",
    };
  }
}

export async function deletePlanAction(planId: string): Promise<ActionResult> {
  const session = await requireSession();

  try {
    await deletePlan(
      planId,
      session.user.id,
      session.user.organizationId,
    );
    revalidatePath("/my-plans");
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to delete plan.",
    };
  }
}

export async function listSelectableTaskTitlesAction(planId: string) {
  const session = await requireSession();
  return listSelectableTaskTitles(
    session.user.organizationId,
    session.user.id,
    planId,
  );
}
