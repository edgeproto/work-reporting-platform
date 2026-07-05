"use client";

import { useActionState, useState } from "react";

import { PeriodType } from "@/app/generated/prisma/enums";
import {
  createReportAction,
  type ActionResult,
} from "@/app/(dashboard)/my-reports/actions";
import { WeekPicker } from "@/components/plans/week-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatPeriodPreview,
  monthInputToReferenceDate,
  periodPickerLabel,
  periodTypeLabel,
  pickerValueFromReferenceDate,
} from "@/lib/periods";

type CreateReportFormProps = {
  defaultType: PeriodType;
  defaultDate: string;
};

function referenceDateForType(type: PeriodType, pickerValue: string): string {
  if (type === PeriodType.MONTHLY) {
    return monthInputToReferenceDate(pickerValue);
  }
  return pickerValue;
}

export function CreateReportForm({
  defaultType,
  defaultDate,
}: CreateReportFormProps) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    createReportAction,
    {},
  );

  const [reportType, setReportType] = useState(defaultType);
  const [referenceDate, setReferenceDate] = useState(() =>
    referenceDateForType(
      defaultType,
      pickerValueFromReferenceDate(defaultType, defaultDate),
    ),
  );
  const [pickerValue, setPickerValue] = useState(() =>
    pickerValueFromReferenceDate(defaultType, defaultDate),
  );

  const handleTypeChange = (type: PeriodType) => {
    const nextPickerValue = pickerValueFromReferenceDate(type, referenceDate);
    setReportType(type);
    setPickerValue(nextPickerValue);
    setReferenceDate(referenceDateForType(type, nextPickerValue));
  };

  const handlePickerChange = (value: string) => {
    setPickerValue(value);
    setReferenceDate(referenceDateForType(reportType, value));
  };

  const handleWeekChange = (sunday: string) => {
    setPickerValue(sunday);
    setReferenceDate(sunday);
  };

  const preview = formatPeriodPreview(reportType, referenceDate);

  return (
    <form action={formAction}>
      <input type="hidden" name="type" value={reportType} />
      <input type="hidden" name="date" value={referenceDate} />

      <div className="flex flex-nowrap items-end gap-3">
        <div className="shrink-0 space-y-1.5">
          <Label htmlFor="report-type">Type</Label>
          <select
            id="report-type"
            value={reportType}
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

        {reportType === PeriodType.WEEKLY ? (
          <WeekPicker
            id="report-period"
            value={pickerValue}
            onChange={handleWeekChange}
          />
        ) : (
          <div className="shrink-0 space-y-1.5">
            <Label htmlFor="report-period">{periodPickerLabel(reportType)}</Label>
            <Input
              id="report-period"
              type={reportType === PeriodType.MONTHLY ? "month" : "date"}
              value={pickerValue}
              onChange={(e) => handlePickerChange(e.target.value)}
              className="w-36"
              required
            />
          </div>
        )}

        {preview ? (
          <p className="min-w-0 flex-1 truncate pb-2 text-sm text-muted-foreground">
            {preview}
          </p>
        ) : (
          <div className="flex-1" />
        )}

        <Button type="submit" className="shrink-0" disabled={pending}>
          {pending ? "Creating…" : "New report"}
        </Button>
      </div>

      {state.error ? (
        <p className="mt-2 text-sm text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
