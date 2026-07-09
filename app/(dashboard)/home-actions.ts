"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { PeriodType } from "@/app/generated/prisma/enums";
import { requireSession } from "@/lib/auth";
import {
  actionError,
  getActionDictionary,
} from "@/lib/i18n/action-dictionary";
import {
  setHomeDayCookie,
  setHomeMonthCookie,
  setHomeWeekCookie,
} from "@/lib/home/prefs";
import { createPlanForPeriod } from "@/lib/plans/mutations";
import {
  canEditPeriod,
  getPeriodBounds,
} from "@/lib/periods";
import { createReportForPeriod } from "@/lib/reports/mutations";
import { dateStringSchema, periodTypeSchema } from "@/lib/validation";

export type HomeActionResult = {
  error?: string;
};

const monthSchema = z.string().regex(/^\d{4}-\d{2}$/);

export async function setHomeMonthAction(month: string): Promise<HomeActionResult> {
  const dict = await getActionDictionary();
  const parsed = monthSchema.safeParse(month);
  if (!parsed.success) {
    return { error: dict.errors.invalidMonth };
  }
  await setHomeMonthCookie(parsed.data);
  revalidatePath("/");
  return {};
}

export async function setHomeWeekAction(weekSunday: string): Promise<HomeActionResult> {
  const dict = await getActionDictionary();
  const parsed = dateStringSchema.safeParse(weekSunday);
  if (!parsed.success) {
    return { error: dict.errors.invalidWeek };
  }
  await setHomeWeekCookie(parsed.data);
  revalidatePath("/");
  return {};
}

export async function setHomeDayAction(day: string): Promise<HomeActionResult> {
  const dict = await getActionDictionary();
  const parsed = dateStringSchema.safeParse(day);
  if (!parsed.success) {
    return { error: dict.errors.invalidDay };
  }
  await setHomeDayCookie(parsed.data);
  revalidatePath("/");
  return {};
}

const openPeriodSchema = z.object({
  type: periodTypeSchema,
  date: dateStringSchema,
});

function assertPeriodEditable(type: PeriodType, referenceDate: string) {
  const { periodStart, periodEnd } = getPeriodBounds(type, referenceDate);
  if (!canEditPeriod(type, periodStart, periodEnd)) {
    throw new Error("This period is outside the edit window.");
  }
}

export async function openOrCreatePlanAction(
  type: PeriodType,
  referenceDate: string,
): Promise<HomeActionResult> {
  const session = await requireSession();
  const dict = await getActionDictionary();
  const parsed = openPeriodSchema.safeParse({ type, date: referenceDate });
  if (!parsed.success) {
    return { error: dict.errors.invalidPlanParameters };
  }

  try {
    assertPeriodEditable(parsed.data.type as PeriodType, parsed.data.date);
    const plan = await createPlanForPeriod(
      session.user.id,
      session.user.organizationId,
      parsed.data.type as PeriodType,
      parsed.data.date,
    );
    revalidatePath("/");
    redirect(`/my-plans/${plan.id}`);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }
    return { error: await actionError("unableToOpenPlan", error) };
  }
}

export async function openOrCreateReportAction(
  type: PeriodType,
  referenceDate: string,
): Promise<HomeActionResult> {
  const session = await requireSession();
  const dict = await getActionDictionary();
  const parsed = openPeriodSchema.safeParse({ type, date: referenceDate });
  if (!parsed.success) {
    return { error: dict.errors.invalidReportParameters };
  }

  try {
    assertPeriodEditable(parsed.data.type as PeriodType, parsed.data.date);
    const report = await createReportForPeriod(
      session.user.id,
      session.user.organizationId,
      parsed.data.type as PeriodType,
      parsed.data.date,
    );
    revalidatePath("/");
    redirect(`/my-reports/${report.id}`);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }
    return { error: await actionError("unableToOpenReport", error) };
  }
}
