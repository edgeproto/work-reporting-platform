import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getLocale } from "@/lib/i18n/get-locale";
import { translateError } from "@/lib/i18n/translate-error";
import type { ZodError } from "zod";

export async function getActionDictionary(): Promise<Dictionary> {
  return getDictionary(await getLocale());
}

export async function actionError(
  fallback: keyof Dictionary["errors"],
  error?: unknown,
): Promise<string> {
  const dict = await getActionDictionary();
  if (error instanceof Error) {
    return translateError(error.message, dict, dict.errors[fallback]);
  }
  return dict.errors[fallback];
}

export async function firstValidationError(error: ZodError): Promise<string> {
  const dict = await getActionDictionary();
  const message = error.issues[0]?.message;
  return message
    ? translateError(message, dict, dict.errors.invalidInput)
    : dict.errors.invalidInput;
}
