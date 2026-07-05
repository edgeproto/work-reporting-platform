"use client";

import { useActionState } from "react";

import { PeriodType } from "@/app/generated/prisma/enums";
import { createPlanAction, type ActionResult } from "@/app/(dashboard)/my-plans/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { periodTypeLabel } from "@/lib/periods";

type CreatePlanFormProps = {
  defaultType: PeriodType;
  defaultDate: string;
};

export function CreatePlanForm({ defaultType, defaultDate }: CreatePlanFormProps) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    createPlanAction,
    {},
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="plan-type">Type</Label>
        <select
          id="plan-type"
          name="type"
          defaultValue={defaultType}
          className="flex h-8 w-36 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          {Object.values(PeriodType).map((type) => (
            <option key={type} value={type}>
              {periodTypeLabel(type)}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="plan-date">Period date</Label>
        <Input
          id="plan-date"
          name="date"
          type="date"
          defaultValue={defaultDate}
          className="w-40"
          required
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "New plan"}
      </Button>
      {state.error ? (
        <p className="w-full text-sm text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
