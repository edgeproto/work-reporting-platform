export const locales = ["en", "ko", "zh"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeLabels: Record<Locale, string> = {
  en: "English",
  ko: "조선어",
  zh: "简体中文",
};

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "ko" || value === "zh";
}
