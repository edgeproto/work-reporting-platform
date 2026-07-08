import { en, type Dictionary } from "@/lib/i18n/dictionaries/en";
import { ko } from "@/lib/i18n/dictionaries/ko";
import { type Locale } from "@/lib/i18n/locales";

const dictionaries: Record<Locale, Dictionary> = {
  en,
  ko,
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
