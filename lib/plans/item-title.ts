type PlanItemWithTitle = {
  task?: { title: string } | null;
  taskTitle?: { title: string } | null;
  customTitle?: string | null;
};

export function getPlanItemTitle(item: PlanItemWithTitle): string {
  return (
    item.task?.title ??
    item.taskTitle?.title ??
    item.customTitle?.trim() ??
    "Untitled"
  );
}
