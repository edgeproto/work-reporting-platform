type ReportEntryWithTitle = {
  task?: { title: string } | null;
  taskTitle?: { title: string } | null;
  planItem?: {
    task?: { title: string } | null;
    taskTitle?: { title: string } | null;
    customTitle?: string | null;
  } | null;
  customTitle?: string | null;
};

export function getReportEntryTitle(entry: ReportEntryWithTitle): string {
  return (
    entry.task?.title ??
    entry.planItem?.task?.title ??
    entry.taskTitle?.title ??
    entry.planItem?.taskTitle?.title ??
    entry.planItem?.customTitle?.trim() ??
    entry.customTitle?.trim() ??
    "Untitled"
  );
}
