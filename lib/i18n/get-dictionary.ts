import { en, type Dictionary } from "@/lib/i18n/dictionaries/en";
import { ko } from "@/lib/i18n/dictionaries/ko";
import { zh } from "@/lib/i18n/dictionaries/zh";
import { type Locale } from "@/lib/i18n/locales";

const dictionaries: Record<Locale, Dictionary> = {
  en,
  ko,
  zh,
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
