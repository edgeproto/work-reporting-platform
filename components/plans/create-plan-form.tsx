"use client";

import { useActionState, useState } from "react";

import { PeriodType } from "@/app/generated/prisma/enums";
import { createPlanAction, type ActionResult } from "@/app/(dashboard)/my-plans/actions";
import { WeekPicker } from "@/components/plans/week-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatPeriodPreview,
  monthInputToReferenceDate,
  periodPickerInputType,
  periodPickerLabel,
  periodTypeLabel,
  pickerValueFromReferenceDate,
} from "@/lib/periods";

type CreatePlanFormProps = {
  defaultType: PeriodType;
  defaultDate: string;
};

export function CreatePlanForm({ defaultType, defaultDate }: CreatePlanFormProps) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    createPlanAction,
    {},
  );

  const [planType, setPlanType] = useState(defaultType);
  const [referenceDate, setReferenceDate] = useState(defaultDate);
  const [pickerValue, setPickerValue] = useState(() =>
    pickerValueFromReferenceDate(defaultType, defaultDate),
  );

  const handleTypeChange = (type: PeriodType) => {
    setPlanType(type);
    setPickerValue(pickerValueFromReferenceDate(type, referenceDate));
  };

  const handlePickerChange = (value: string) => {
    setPickerValue(value);
    setReferenceDate(
      planType === PeriodType.MONTHLY
        ? monthInputToReferenceDate(value)
        : value,
    );
  };

  const handleWeekChange = (sunday: string) => {
    setPickerValue(sunday);
    setReferenceDate(sunday);
  };

  const preview = formatPeriodPreview(planType, referenceDate);
  const inputType = periodPickerInputType(planType);

  return (
    <form action={formAction}>
      <input type="hidden" name="type" value={planType} />
      <input type="hidden" name="date" value={referenceDate} />

      <div className="flex flex-nowrap items-end gap-3">
        <div className="shrink-0 space-y-1.5">
          <Label htmlFor="plan-type">Type</Label>
          <select
            id="plan-type"
            value={planType}
            onChange={(e) => handleTypeChange(e.target.value as PeriodType)}
            className="flex h-8 w-32 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            {Object.values(PeriodType).map((type) => (
              <option key={type} value={type}>
                {periodTypeLabel(type)}
              </option>
            ))}
          </select>
        </div>

        <div className="shrink-0 space-y-1.5">
          <Label htmlFor="plan-period">{periodPickerLabel(planType)}</Label>
          {inputType === "week-custom" ? (
            <WeekPicker
              id="plan-period"
              value={pickerValue}
              onChange={handleWeekChange}
            />
          ) : (
            <Input
              id="plan-period"
              type={inputType}
              value={pickerValue}
              onChange={(e) => handlePickerChange(e.target.value)}
              className="w-36"
              required
            />
          )}
        </div>

        {preview ? (
          <p className="min-w-0 flex-1 truncate pb-2 text-sm text-muted-foreground">
            {preview}
          </p>
        ) : (
          <div className="flex-1" />
        )}

        <Button type="submit" className="shrink-0" disabled={pending}>
          {pending ? "Creating…" : "New plan"}
        </Button>
      </div>

      {state.error ? (
        <p className="mt-2 text-sm text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
