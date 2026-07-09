"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { Role } from "@/app/generated/prisma/enums";
import {
  createOrganizationUser,
  regeneratePasswordSetLink,
  setOrganizationUserActive,
  updateOrganizationUserRole,
} from "@/lib/admin/users";
import { requireSession } from "@/lib/auth";
import {
  actionError,
  firstValidationError,
  getActionDictionary,
} from "@/lib/i18n/action-dictionary";
import { canManageUsers } from "@/lib/rbac";
import { emailSchema } from "@/lib/validation";

export type AdminActionResult = {
  error?: string;
  success?: boolean;
  passwordSetLink?: string;
};

const roleSchema = z.enum(["ADMIN", "MANAGER", "MEMBER"]);

async function requireAdminSession() {
  const session = await requireSession();
  if (!canManageUsers(session.user)) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function createUserAction(
  _prevState: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  const session = await requireAdminSession();
  const dict = await getActionDictionary();
  const createUserSchema = z.object({
    name: z.string().trim().min(1, dict.errors.nameRequired).max(100),
    email: emailSchema,
    role: roleSchema,
  });

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: await firstValidationError(parsed.error) };
  }

  try {
    const result = await createOrganizationUser(session.user.organizationId, {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role as Role,
    });

    revalidatePath("/admin/users");
    return {
      success: true,
      passwordSetLink: result.passwordSetLink,
    };
  } catch (error) {
    return { error: await actionError("unableToCreateUser", error) };
  }
}

export async function updateUserRoleAction(
  userId: string,
  role: Role,
): Promise<AdminActionResult> {
  const session = await requireAdminSession();
  const dict = await getActionDictionary();

  const parsed = roleSchema.safeParse(role);
  if (!parsed.success) {
    return { error: dict.errors.invalidRole };
  }

  try {
    await updateOrganizationUserRole(
      userId,
      session.user.organizationId,
      parsed.data as Role,
      session.user.id,
    );
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    return { error: await actionError("unableToUpdateRole", error) };
  }
}

export async function setUserActiveAction(
  userId: string,
  isActive: boolean,
): Promise<AdminActionResult> {
  const session = await requireAdminSession();

  try {
    await setOrganizationUserActive(
      userId,
      session.user.organizationId,
      isActive,
      session.user.id,
    );
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    return { error: await actionError("unableToUpdateUserStatus", error) };
  }
}

export async function regeneratePasswordLinkAction(
  userId: string,
): Promise<AdminActionResult> {
  const session = await requireAdminSession();

  try {
    const result = await regeneratePasswordSetLink(
      userId,
      session.user.organizationId,
    );
    revalidatePath("/admin/users");
    return {
      success: true,
      passwordSetLink: result.passwordSetLink,
    };
  } catch (error) {
    return { error: await actionError("unableToGeneratePasswordLink", error) };
  }
}
