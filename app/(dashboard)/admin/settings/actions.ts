"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { updateOrganizationName } from "@/lib/admin/settings";
import { requireSession } from "@/lib/auth";
import { canManageUsers } from "@/lib/rbac";

export type SettingsActionResult = {
  error?: string;
  success?: boolean;
};

const orgNameSchema = z
  .string()
  .trim()
  .min(1, "Organization name is required.")
  .max(100);

export async function updateOrganizationNameAction(
  _prevState: SettingsActionResult,
  formData: FormData,
): Promise<SettingsActionResult> {
  const session = await requireSession();
  if (!canManageUsers(session.user)) {
    return { error: "Unauthorized" };
  }

  const parsed = orgNameSchema.safeParse(formData.get("name"));
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid organization name.",
    };
  }

  try {
    await updateOrganizationName(session.user.organizationId, parsed.data);
    revalidatePath("/admin/settings");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to update organization settings.",
    };
  }
}
