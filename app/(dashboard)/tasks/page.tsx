import { requireSession } from "@/lib/auth";
import { listUserTasks } from "@/lib/tasks/queries";
import { TasksBrowser } from "@/components/tasks/task-browser";

export default async function TasksPage() {
  const session = await requireSession();
  const tasks = await listUserTasks(
    session.user.id,
    session.user.organizationId,
  );

  const serialized = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    type: task.type,
    periodStart: task.periodStart.toISOString(),
    periodEnd: task.periodEnd.toISOString(),
    parentTitle: task.parentTask?.title ?? null,
    childCount: task._count.childTasks,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Tasks</h1>
        <p className="text-muted-foreground">
          Your personal tasks by period — browse and search tasks used in plans
          and reports. Tasks are not shared with teammates.
        </p>
      </div>

      <TasksBrowser tasks={serialized} />
    </div>
  );
}
