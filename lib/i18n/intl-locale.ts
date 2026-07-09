import type { Locale } from "@/lib/i18n/locales";

export function toIntlLocale(locale: Locale): string {
  switch (locale) {
    case "ko":
      return "ko-KR";
    case "zh":
      return "zh-CN";
    default:
      return "en-US";
  }
}
