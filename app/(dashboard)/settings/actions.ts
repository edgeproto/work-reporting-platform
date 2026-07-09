"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireSession } from "@/lib/auth";
import {
  actionError,
  getActionDictionary,
} from "@/lib/i18n/action-dictionary";
import { translateFieldErrors } from "@/lib/i18n/translate-error";
import {
  changeUserPassword,
  removeUserAvatar,
  updateUserAvatar,
  updateUserProfile,
} from "@/lib/settings/profile";
import { emailSchema } from "@/lib/validation";

export type SettingsActionResult = {
  error?: string;
  success?: boolean;
  fieldErrors?: Record<string, string[]>;
};

export async function updateProfileAction(
  _prev: SettingsActionResult,
  formData: FormData,
): Promise<SettingsActionResult> {
  const session = await requireSession();
  const dict = await getActionDictionary();
  const profileSchema = z.object({
    name: z.string().trim().min(1, dict.errors.nameRequired).max(100),
    email: emailSchema,
  });

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { fieldErrors: translateFieldErrors(parsed.error.flatten().fieldErrors, dict) };
  }

  try {
    await updateUserProfile(
      session.user.id,
      session.user.organizationId,
      parsed.data,
    );
    revalidatePath("/settings");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    return { error: await actionError("unableToUpdateProfile", error) };
  }
}

export async function changePasswordAction(
  _prev: SettingsActionResult,
  formData: FormData,
): Promise<SettingsActionResult> {
  const session = await requireSession();
  const dict = await getActionDictionary();
  const passwordSchema = z
    .object({
      currentPassword: z.string().min(1, dict.errors.currentPasswordRequired),
      newPassword: z.string().min(8, dict.errors.passwordMinLength),
      confirmPassword: z.string().min(1, dict.errors.confirmPasswordRequired),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: dict.errors.passwordsDoNotMatch,
      path: ["confirmPassword"],
    });

  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { fieldErrors: translateFieldErrors(parsed.error.flatten().fieldErrors, dict) };
  }

  try {
    await changeUserPassword(
      session.user.id,
      session.user.organizationId,
      parsed.data.currentPassword,
      parsed.data.newPassword,
    );
    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    return { error: await actionError("unableToChangePassword", error) };
  }
}

export async function uploadAvatarAction(
  _prev: SettingsActionResult,
  formData: FormData,
): Promise<SettingsActionResult> {
  const session = await requireSession();
  const file = formData.get("avatar");

  if (!(file instanceof File)) {
    const dict = await getActionDictionary();
    return { error: dict.errors.noFileSelected };
  }

  try {
    await updateUserAvatar(
      session.user.id,
      session.user.organizationId,
      file,
    );
    revalidatePath("/settings");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    return { error: await actionError("unableToUploadAvatar", error) };
  }
}

export async function removeAvatarAction(): Promise<SettingsActionResult> {
  const session = await requireSession();

  try {
    await removeUserAvatar(session.user.id, session.user.organizationId);
    revalidatePath("/settings");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    return { error: await actionError("unableToRemoveAvatar", error) };
  }
}
