"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { PeriodType } from "@/app/generated/prisma/enums";
import { requireSession } from "@/lib/auth";
import {
  actionError,
  firstValidationError,
  getActionDictionary,
} from "@/lib/i18n/action-dictionary";
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
import {
  addPlanItemAttachment,
  deletePlanItemAttachment,
} from "@/lib/reports/attachments";
import {
  continuousNotesSchema,
  dateStringSchema,
  periodTypeSchema,
  planItemSchema,
} from "@/lib/validation";

export type ActionResult = {
  error?: string;
  success?: boolean;
  itemId?: string;
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
    const dict = await getActionDictionary();
    return { error: dict.errors.invalidPlanParameters };
  }

  const plan = await createPlanForPeriod(
    session.user.id,
    session.user.organizationId,
    parsed.data.type as PeriodType,
    parsed.data.date,
  );

  revalidatePath("/");
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
    const dict = await getActionDictionary();
    return { error: dict.errors.notesTooLong };
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
    return { error: await actionError("unableToSaveNotes", error) };
  }
}

export async function addPlanItemAction(
  planId: string,
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = planItemSchema.safeParse({
    title: formData.get("title") || undefined,
    description: formData.get("description") || undefined,
    visibility: formData.get("visibility") ?? "PUBLIC",
  });

  if (!parsed.success) {
    return { error: await firstValidationError(parsed.error) };
  }

  try {
    const item = await addPlanItem(
      planId,
      session.user.id,
      session.user.organizationId,
      parsed.data,
    );
    revalidatePath(`/my-plans/${planId}`);
    revalidatePath("/");
    return { success: true, itemId: item.id };
  } catch (error) {
    return { error: await actionError("unableToAddItem", error) };
  }
}

export async function updatePlanItemAction(
  planId: string,
  itemId: string,
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = planItemSchema.safeParse({
    title: formData.get("title") || undefined,
    description: formData.get("description") || undefined,
    visibility: formData.get("visibility") ?? "PUBLIC",
  });

  if (!parsed.success) {
    return { error: await firstValidationError(parsed.error) };
  }

  try {
    await updatePlanItem(
      itemId,
      session.user.id,
      session.user.organizationId,
      parsed.data,
    );
    revalidatePath(`/my-plans/${planId}`);
    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { error: await actionError("unableToUpdateItem", error) };
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
    return { error: await actionError("unableToDeleteItem", error) };
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
    revalidatePath("/");
    revalidatePath("/my-plans");
    revalidatePath(`/my-plans/${planId}`);
    return { success: true };
  } catch (error) {
    return { error: await actionError("unableToSubmitPlan", error) };
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
    revalidatePath("/");
    revalidatePath("/my-plans");
    revalidatePath(`/my-plans/${planId}`);
    return { success: true };
  } catch (error) {
    return { error: await actionError("unableToReopenPlan", error) };
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
    revalidatePath("/");
    revalidatePath("/my-plans");
    return { success: true };
  } catch (error) {
    return { error: await actionError("unableToDeletePlan", error) };
  }
}

export async function uploadPlanItemAttachmentAction(
  planId: string,
  planItemId: string,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireSession();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    const dict = await getActionDictionary();
    return { error: dict.errors.noFileSelected };
  }

  try {
    await addPlanItemAttachment(
      planId,
      planItemId,
      session.user.id,
      session.user.organizationId,
      file,
    );
    revalidatePath(`/my-plans/${planId}`);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { error: await actionError("unableToUploadFile", error) };
  }
}

export async function deletePlanItemAttachmentAction(
  planId: string,
  attachmentId: string,
): Promise<ActionResult> {
  const session = await requireSession();

  try {
    await deletePlanItemAttachment(
      attachmentId,
      planId,
      session.user.id,
      session.user.organizationId,
    );
    revalidatePath(`/my-plans/${planId}`);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { error: await actionError("unableToDeleteAttachment", error) };
  }
}
