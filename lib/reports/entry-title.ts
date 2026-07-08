type ReportEntryWithTitle = {
  taskTitle?: { title: string } | null;
  planItem?: {
    taskTitle?: { title: string } | null;
    customTitle?: string | null;
  } | null;
  customTitle?: string | null;
};

export function getReportEntryTitle(entry: ReportEntryWithTitle): string {
  return (
    entry.customTitle?.trim() ||
    entry.planItem?.customTitle?.trim() ||
    entry.taskTitle?.title ||
    entry.planItem?.taskTitle?.title ||
    "Untitled"
  );
}
