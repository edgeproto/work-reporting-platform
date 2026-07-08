import { cookies } from "next/headers";

import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/locales";

const LOCALE_COOKIE = "locale";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : defaultLocale;
}
