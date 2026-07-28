import { useMemo, useState } from "react";
import { CalendarCheck2, CheckCircle2, RotateCcw } from "lucide-react";
import type { Task } from "@/types";
import { formatTimestampDate } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type CompletedFilter = "all" | "7" | "14" | "30";

const FILTERS: { value: CompletedFilter; label: string; days: number | null }[] = [
  { value: "all", label: "All", days: null },
  { value: "7", label: "Last 7 days", days: 7 },
  { value: "14", label: "Last 14 days", days: 14 },
  { value: "30", label: "Last month", days: 30 },
];

interface CompletedTasksDialogProps {
  tasks: Task[];
  onReactivate: (id: number) => Promise<void>;
}

export function CompletedTasksDialog({
  tasks,
  onReactivate,
}: CompletedTasksDialogProps) {
  const [filter, setFilter] = useState<CompletedFilter>("all");
  const [reactivatingId, setReactivatingId] = useState<number | null>(null);

  async function handleReactivate(id: number) {
    if (reactivatingId !== null) return;
    setReactivatingId(id);
    try {
      await onReactivate(id);
    } finally {
      setReactivatingId(null);
    }
  }

  const filteredTasks = useMemo(() => {
    const selected = FILTERS.find((item) => item.value === filter);
    if (!selected?.days) return tasks;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - selected.days);
    return tasks.filter(
      (task) => task.completedAt && new Date(task.completedAt).getTime() >= cutoff.getTime()
    );
  }, [filter, tasks]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" className="shadow-sm">
          <CalendarCheck2 className="h-5 w-5" />
          Completed
          {tasks.length > 0 && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
              {tasks.length}
            </span>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            Completed tasks
          </DialogTitle>
          <DialogDescription>
            Review completed work and filter it by completion date.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2" aria-label="Filter completed tasks">
          {FILTERS.map((item) => (
            <Button
              key={item.value}
              type="button"
              size="sm"
              variant={filter === item.value ? "primary" : "secondary"}
              aria-pressed={filter === item.value}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </Button>
          ))}
        </div>

        <div className="mt-4 max-h-[55vh] overflow-y-auto pr-1">
          {filteredTasks.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {filteredTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-start gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted)]/60 p-3.5"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-semibold">{task.name}</p>
                    {task.description && (
                      <p className="mt-1 line-clamp-2 whitespace-pre-wrap break-words text-xs leading-relaxed text-[var(--color-muted-foreground)]">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <time
                      dateTime={task.completedAt ?? undefined}
                      className="text-xs font-semibold text-[var(--color-muted-foreground)]"
                    >
                      {formatTimestampDate(task.completedAt)}
                    </time>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={reactivatingId !== null}
                      onClick={() => handleReactivate(task.id)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      {reactivatingId === task.id ? "Reactivating…" : "Reactivate"}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] px-4 py-10 text-center text-sm text-[var(--color-muted-foreground)]">
              No completed tasks in this period.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
