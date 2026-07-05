import { PeriodType } from "@/app/generated/prisma/enums";
import { Badge } from "@/components/ui/badge";
import { requireSession } from "@/lib/auth";
import { formatPeriodLabel, periodTypeLabel } from "@/lib/periods";
import { listUserTasks } from "@/lib/tasks/queries";

export default async function TasksPage() {
  const session = await requireSession();
  const tasks = await listUserTasks(
    session.user.id,
    session.user.organizationId,
  );

  const grouped = {
    [PeriodType.MONTHLY]: tasks.filter((t) => t.type === PeriodType.MONTHLY),
    [PeriodType.WEEKLY]: tasks.filter((t) => t.type === PeriodType.WEEKLY),
    [PeriodType.DAILY]: tasks.filter((t) => t.type === PeriodType.DAILY),
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Tasks</h1>
        <p className="text-muted-foreground">
          Your personal tasks by period — not shared with teammates.
        </p>
      </div>

      {tasks.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          No tasks yet. Add tasks from your monthly, weekly, or daily plans.
        </p>
      ) : (
        Object.values(PeriodType).map((type) => {
          const items = grouped[type];
          if (items.length === 0) return null;

          return (
            <section key={type} className="space-y-3">
              <h2 className="text-lg font-medium">{periodTypeLabel(type)}</h2>
              <ul className="divide-y rounded-lg border">
                {items.map((task) => (
                  <li key={task.id} className="space-y-1 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{task.title}</span>
                      <Badge variant="outline">{periodTypeLabel(task.type)}</Badge>
                      {task.parentTask ? (
                        <span className="text-xs text-muted-foreground">
                          ↳ from {task.parentTask.title}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatPeriodLabel(
                        task.type,
                        task.periodStart,
                        task.periodEnd,
                      )}
                    </p>
                    {task.description ? (
                      <p className="text-sm text-muted-foreground">
                        {task.description}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
