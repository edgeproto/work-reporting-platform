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

export const reportEntryTitleSchema = z
  .string()
  .trim()
  .min(1, "Task title is required.")
  .max(200);

export const reportHoursSchema = z.coerce
  .number()
  .min(0, "Hours cannot be negative.")
  .max(24, "Hours cannot exceed 24 per entry.");

export const submitReportHoursSchema = z.coerce
  .number()
  .positive("Hours must be greater than zero.")
  .max(24, "Hours cannot exceed 24 per entry.");

export const unplannedEntrySchema = z
  .object({
    taskId: z.string().min(1).optional(),
    title: reportEntryTitleSchema.optional(),
    description: z.string().max(2000).optional(),
    hours: submitReportHoursSchema,
    visibility: visibilitySchema.default("PUBLIC"),
  })
  .refine((data) => data.taskId || data.title?.trim(), {
    message: "Select a task or enter a title.",
    path: ["title"],
  });

export const reportEntryUpdateSchema = z.object({
  description: z.string().max(2000).optional(),
  hours: reportHoursSchema,
  visibility: visibilitySchema.default("PUBLIC"),
});

export const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
]);

const ALLOWED_UPLOAD_EXTENSIONS = new Set([
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
]);

export function validateUploadFile(
  file: File,
): { ok: true } | { ok: false; error: string } {
  if (!file.name?.trim()) {
    return { ok: false, error: "File name is required." };
  }

  if (file.size <= 0) {
    return { ok: false, error: "File is empty." };
  }

  const ext = file.name.includes(".")
    ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
    : "";

  const mimeAllowed =
    file.type && ALLOWED_UPLOAD_MIME_TYPES.has(file.type.toLowerCase());
  const extAllowed = ext && ALLOWED_UPLOAD_EXTENSIONS.has(ext);

  if (!mimeAllowed && !extAllowed) {
    return {
      ok: false,
      error: "File type not allowed. Use PDF, images, Office documents, or plain text.",
    };
  }

  return { ok: true };
}
