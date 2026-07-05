"use client";

import { useMemo } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  listWeeksInMonth,
  sundayFromWeekPicker,
  weekPickerMonthFromReference,
} from "@/lib/periods";

type WeekPickerProps = {
  id?: string;
  value: string;
  onChange: (sunday: string) => void;
};

export function WeekPicker({ id, value, onChange }: WeekPickerProps) {
  const month = weekPickerMonthFromReference(value);
  const weeks = useMemo(() => listWeeksInMonth(month), [month]);

  const handleMonthChange = (monthValue: string) => {
    const weeksInMonth = listWeeksInMonth(monthValue);
    const nextSunday = weeksInMonth[0]?.sunday ?? value;
    onChange(sundayFromWeekPicker(monthValue, nextSunday));
  };

  const handleWeekChange = (sunday: string) => {
    onChange(sundayFromWeekPicker(month, sunday));
  };

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="space-y-1.5">
        <Label htmlFor={id ? `${id}-month` : "week-month"}>Month</Label>
        <Input
          id={id ? `${id}-month` : "week-month"}
          type="month"
          value={month}
          onChange={(e) => handleMonthChange(e.target.value)}
          className="w-36"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={id ? `${id}-week` : "week-select"}>Week</Label>
        <select
          id={id ? `${id}-week` : "week-select"}
          value={weeks.some((w) => w.sunday === value) ? value : weeks[0]?.sunday ?? ""}
          onChange={(e) => handleWeekChange(e.target.value)}
          className="flex h-8 min-w-52 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          required
        >
          {weeks.map((week) => (
            <option key={week.sunday} value={week.sunday}>
              {week.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
