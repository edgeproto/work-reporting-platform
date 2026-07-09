"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { updateOrganizationName } from "@/lib/admin/settings";
import { requireSession } from "@/lib/auth";
import {
  actionError,
  firstValidationError,
  getActionDictionary,
} from "@/lib/i18n/action-dictionary";
import { canManageUsers } from "@/lib/rbac";

export type SettingsActionResult = {
  error?: string;
  success?: boolean;
};

export async function updateOrganizationNameAction(
  _prevState: SettingsActionResult,
  formData: FormData,
): Promise<SettingsActionResult> {
  const session = await requireSession();
  const dict = await getActionDictionary();

  if (!canManageUsers(session.user)) {
    return { error: dict.errors.unauthorized };
  }

  const orgNameSchema = z
    .string()
    .trim()
    .min(1, dict.errors.organizationNameRequired)
    .max(100);

  const parsed = orgNameSchema.safeParse(formData.get("name"));
  if (!parsed.success) {
    return { error: await firstValidationError(parsed.error) };
  }

  try {
    await updateOrganizationName(session.user.organizationId, parsed.data);
    revalidatePath("/admin/settings");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { error: await actionError("unableToUpdateOrganizationSettings", error) };
  }
}
