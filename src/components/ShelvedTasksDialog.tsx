import { useState } from "react";
import { Archive, Clock3, PauseCircle, RotateCcw } from "lucide-react";
import type { Task } from "@/types";
import { metaFromPos } from "@/types";
import { cn, formatDate, formatTimestampDate } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Linkified } from "./Linkified";
import type { ShelveStatus } from "./Board";

const KINDS: Record<
  ShelveStatus,
  {
    label: string;
    title: string;
    description: string;
    empty: string;
    verb: string;
    Icon: typeof Archive;
    iconColor: string;
    badge: string;
  }
> = {
  on_hold: {
    label: "On hold",
    title: "Tasks on hold",
    description: "Paused tasks stay off the board until you reactivate them.",
    empty: "Nothing is on hold.",
    verb: "Put on hold",
    Icon: PauseCircle,
    iconColor: "text-amber-600",
    badge: "bg-amber-100 text-amber-700",
  },
  archived: {
    label: "Archived",
    title: "Archived tasks",
    description: "Archived tasks are hidden from the board. Reactivate one to bring it back.",
    empty: "No archived tasks.",
    verb: "Archived",
    Icon: Archive,
    iconColor: "text-slate-600",
    badge: "bg-slate-200 text-slate-700",
  },
};

interface ShelvedTasksDialogProps {
  kind: ShelveStatus;
  tasks: Task[];
  onReactivate: (id: number) => Promise<void>;
}

export function ShelvedTasksDialog({ kind, tasks, onReactivate }: ShelvedTasksDialogProps) {
  const copy = KINDS[kind];
  const [reactivatingId, setReactivatingId] = useState<number | null>(null);
  const [viewTask, setViewTask] = useState<Task | null>(null);

  async function handleReactivate(id: number) {
    if (reactivatingId !== null) return;
    setReactivatingId(id);
    try {
      await onReactivate(id);
    } finally {
      setReactivatingId(null);
    }
  }

  return (
    <Dialog onOpenChange={(open) => { if (!open) setViewTask(null); }}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="shadow-sm">
          <copy.Icon className="h-5 w-5" />
          {copy.label}
          {tasks.length > 0 && (
            <span className={cn("rounded-full px-2 py-0.5 text-xs", copy.badge)}>
              {tasks.length}
            </span>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <copy.Icon className={cn("h-5 w-5", copy.iconColor)} />
            {copy.title}
          </DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <div className="mt-2 max-h-[55vh] overflow-y-auto pr-1">
          {tasks.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  onClick={() => setViewTask(task)}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted)]/60 p-3 transition-colors hover:bg-[var(--color-muted)]"
                >
                  <span
                    className={cn(
                      "h-2.5 w-2.5 shrink-0 rounded-full bg-gradient-to-br",
                      metaFromPos(task.x, task.y).gradient
                    )}
                  />
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold">{task.name}</p>
                  <time
                    dateTime={task.statusChangedAt ?? undefined}
                    className="shrink-0 text-xs font-semibold text-[var(--color-muted-foreground)]"
                  >
                    {formatTimestampDate(task.statusChangedAt)}
                  </time>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="shrink-0"
                    disabled={reactivatingId !== null}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReactivate(task.id);
                    }}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    {reactivatingId === task.id ? "Reactivating…" : "Reactivate"}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] px-4 py-10 text-center text-sm text-[var(--color-muted-foreground)]">
              {copy.empty}
            </div>
          )}
        </div>
      </DialogContent>

      <ShelvedTaskViewDialog
        task={viewTask}
        kind={kind}
        onOpenChange={(open) => {
          if (!open) setViewTask(null);
        }}
        reactivating={reactivatingId !== null}
        onReactivate={async (id) => {
          await handleReactivate(id);
          setViewTask(null);
        }}
      />
    </Dialog>
  );
}

interface ShelvedTaskViewDialogProps {
  task: Task | null;
  kind: ShelveStatus;
  onOpenChange: (open: boolean) => void;
  reactivating: boolean;
  onReactivate: (id: number) => void;
}

function ShelvedTaskViewDialog({
  task,
  kind,
  onOpenChange,
  reactivating,
  onReactivate,
}: ShelvedTaskViewDialogProps) {
  const meta = task ? metaFromPos(task.x, task.y) : null;
  const copy = KINDS[kind];

  return (
    <Dialog open={task !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {task && meta && (
          <>
            <DialogHeader>
              <span
                className={cn(
                  "inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
                  meta.chip
                )}
              >
                {meta.emoji} {meta.title}
              </span>
              <DialogTitle className="break-words pr-6">{task.name}</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <p
                className={cn(
                  "whitespace-pre-wrap break-words text-sm leading-relaxed",
                  task.description
                    ? "text-[var(--color-foreground)]/80"
                    : "italic text-[var(--color-muted-foreground)]"
                )}
              >
                {task.description ? (
                  <Linkified text={task.description} className="text-primary hover:opacity-80" />
                ) : (
                  "No description yet."
                )}
              </p>

              {task.statusChangedAt && (
                <div className="flex items-center gap-2 rounded-xl bg-[var(--color-muted)] px-3 py-2.5 text-sm">
                  <copy.Icon className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                  <span className="font-medium">
                    {copy.verb} {formatTimestampDate(task.statusChangedAt)}
                  </span>
                </div>
              )}

              {task.dueDate && (
                <div className="flex items-center gap-2 rounded-xl bg-[var(--color-muted)] px-3 py-2.5 text-sm">
                  <Clock3 className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                  <span className="font-medium">Due {formatDate(task.dueDate)}</span>
                </div>
              )}

              <Button className="mt-1" disabled={reactivating} onClick={() => onReactivate(task.id)}>
                <RotateCcw className="h-4 w-4" />
                {reactivating ? "Reactivating…" : "Reactivate"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
