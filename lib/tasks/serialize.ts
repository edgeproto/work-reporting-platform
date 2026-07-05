import { PeriodType } from "@/app/generated/prisma/enums";
import type { SelectableReportTask } from "@/lib/tasks/queries";

export type SerializedSelectableTask = {
  id: string;
  title: string;
  description: string | null;
  type: PeriodType;
  periodStart: string;
  periodEnd: string;
  parentTitle: string | null;
  disabled: boolean;
  disabledReason?: string;
};

export function serializeSelectableTask(
  task: SelectableReportTask,
): SerializedSelectableTask {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    type: task.type,
    periodStart: task.periodStart.toISOString(),
    periodEnd: task.periodEnd.toISOString(),
    parentTitle: task.parentTitle,
    disabled: task.disabled,
    disabledReason: task.disabledReason,
  };
}
