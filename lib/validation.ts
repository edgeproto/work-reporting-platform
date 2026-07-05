import { z } from "zod";

/** Permissive email check — allows internal LAN addresses like admin@localhost. */
export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .refine((value) => /^[^\s@]+@[^\s@]+$/.test(value), {
    message: "Invalid email address.",
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required."),
});
