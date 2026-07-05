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

export const periodTypeSchema = z.enum(["DAILY", "WEEKLY", "MONTHLY"]);

export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format.");

export const visibilitySchema = z.enum(["PUBLIC", "PRIVATE"]);

export const planItemSchema = z
  .object({
    parentTaskId: z.string().min(1).optional(),
    title: z.string().trim().min(1, "Task title is required.").max(200).optional(),
    description: z.string().max(2000).optional(),
    visibility: visibilitySchema.default("PUBLIC"),
  })
  .refine(
    (data) => data.parentTaskId || data.title,
    { message: "Select a parent task or enter a title.", path: ["title"] },
  );

export const continuousNotesSchema = z.string().max(10000);
