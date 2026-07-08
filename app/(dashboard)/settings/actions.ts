"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireSession } from "@/lib/auth";
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

const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100),
  email: emailSchema,
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export async function updateProfileAction(
  _prev: SettingsActionResult,
  formData: FormData,
): Promise<SettingsActionResult> {
  const session = await requireSession();
  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
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
    return {
      error: error instanceof Error ? error.message : "Unable to update profile.",
    };
  }
}

export async function changePasswordAction(
  _prev: SettingsActionResult,
  formData: FormData,
): Promise<SettingsActionResult> {
  const session = await requireSession();
  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
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
    return {
      error:
        error instanceof Error ? error.message : "Unable to change password.",
    };
  }
}

export async function uploadAvatarAction(
  _prev: SettingsActionResult,
  formData: FormData,
): Promise<SettingsActionResult> {
  const session = await requireSession();
  const file = formData.get("avatar");

  if (!(file instanceof File)) {
    return { error: "No file selected." };
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
    return {
      error: error instanceof Error ? error.message : "Unable to upload avatar.",
    };
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
    return {
      error: error instanceof Error ? error.message : "Unable to remove avatar.",
    };
  }
}
