"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { signOut } from "@/lib/auth";
import {
  getActionDictionary,
} from "@/lib/i18n/action-dictionary";
import { translateFieldErrors } from "@/lib/i18n/translate-error";
import { setPasswordWithToken } from "@/lib/password-set-token";

export type SetPasswordState = {
  error?: string;
  fieldErrors?: {
    password?: string[];
    confirmPassword?: string[];
  };
};

export async function setPasswordAction(
  _prevState: SetPasswordState,
  formData: FormData,
): Promise<SetPasswordState> {
  const dict = await getActionDictionary();
  const setPasswordSchema = z
    .object({
      token: z.string().min(1),
      password: z.string().min(8, dict.errors.passwordMinLength),
      confirmPassword: z.string().min(1),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: dict.errors.passwordsDoNotMatch,
      path: ["confirmPassword"],
    });

  const parsed = setPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const fieldErrors = translateFieldErrors(
      parsed.error.flatten().fieldErrors,
      dict,
    );
    return {
      fieldErrors: {
        password: fieldErrors.password,
        confirmPassword: fieldErrors.confirmPassword,
      },
    };
  }

  const result = await setPasswordWithToken(
    parsed.data.token,
    parsed.data.password,
  );

  if (!result.ok) {
    switch (result.reason) {
      case "expired":
        return { error: dict.errors.linkExpired };
      case "used":
        return { error: dict.errors.linkUsed };
      case "inactive":
        return { error: dict.errors.linkInactive };
      default:
        return { error: dict.errors.invalidPasswordSetLink };
    }
  }

  await signOut({ redirect: false });

  redirect("/login?passwordSet=1");
}
