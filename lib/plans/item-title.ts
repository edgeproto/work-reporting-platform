type PlanItemWithTitle = {
  taskTitle?: { title: string } | null;
  customTitle?: string | null;
};

export function getPlanItemTitle(item: PlanItemWithTitle): string {
  return item.customTitle?.trim() || item.taskTitle?.title || "Untitled";
}
