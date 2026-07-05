"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { setPasswordWithToken } from "@/lib/password-set-token";

const setPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

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
  const parsed = setPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
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
        return { error: "This link has expired. Ask your admin for a new one." };
      case "used":
        return { error: "This link has already been used." };
      case "inactive":
        return { error: "This account is inactive." };
      default:
        return { error: "Invalid password-set link." };
    }
  }

  redirect("/login?passwordSet=1");
}
