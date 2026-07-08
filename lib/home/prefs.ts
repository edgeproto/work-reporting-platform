import { cookies } from "next/headers";

import {
  dateToMonthInputValue,
  getPeriodBounds,
  parseDateString,
  todayDateString,
  formatDateInTz,
} from "@/lib/periods";
import { PeriodType } from "@/app/generated/prisma/enums";

export const HOME_MONTH_COOKIE = "homeMonth";
export const HOME_WEEK_COOKIE = "homeWeek";
export const HOME_DAY_COOKIE = "homeDay";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

const MONTH_RE = /^\d{4}-\d{2}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type HomePeriodPrefs = {
  month: string;
  weekSunday: string;
  day: string;
};

export function defaultHomePeriodPrefs(
  today = todayDateString(),
): HomePeriodPrefs {
  const week = getPeriodBounds(PeriodType.WEEKLY, today);
  return {
    month: dateToMonthInputValue(today),
    weekSunday: formatDateInTz(week.periodStart),
    day: today,
  };
}

function isValidMonth(value: string | undefined): value is string {
  return !!value && MONTH_RE.test(value);
}

function isValidDate(value: string | undefined): value is string {
  if (!value || !DATE_RE.test(value)) {
    return false;
  }
  const [y, m, d] = value.split("-").map(Number);
  const date = parseDateString(value);
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

export async function getHomePeriodPrefs(): Promise<HomePeriodPrefs> {
  const defaults = defaultHomePeriodPrefs();
  const cookieStore = await cookies();

  const monthRaw = cookieStore.get(HOME_MONTH_COOKIE)?.value;
  const weekRaw = cookieStore.get(HOME_WEEK_COOKIE)?.value;
  const dayRaw = cookieStore.get(HOME_DAY_COOKIE)?.value;

  return {
    month: isValidMonth(monthRaw) ? monthRaw : defaults.month,
    weekSunday: isValidDate(weekRaw) ? weekRaw : defaults.weekSunday,
    day: isValidDate(dayRaw) ? dayRaw : defaults.day,
  };
}

export async function setHomeMonthCookie(month: string) {
  if (!isValidMonth(month)) {
    return;
  }
  const cookieStore = await cookies();
  cookieStore.set(HOME_MONTH_COOKIE, month, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
  });
}

export async function setHomeWeekCookie(weekSunday: string) {
  if (!isValidDate(weekSunday)) {
    return;
  }
  const cookieStore = await cookies();
  cookieStore.set(HOME_WEEK_COOKIE, weekSunday, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
  });
}

export async function setHomeDayCookie(day: string) {
  if (!isValidDate(day)) {
    return;
  }
  const cookieStore = await cookies();
  cookieStore.set(HOME_DAY_COOKIE, day, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
  });
}
