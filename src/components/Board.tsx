import { useRef, useState } from "react";
import { CircleCheckBig } from "lucide-react";
import type { Task } from "@/types";
import { QUADRANTS } from "@/types";
import { cn } from "@/lib/utils";
import { FloatingCard } from "./FloatingCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface BoardProps {
  tasks: Task[];
  onMove: (id: number, x: number, y: number) => void;
  onUpdate: (
    id: number,
    data: { name: string; description: string; dueDate: string | null }
  ) => Promise<void>;
  onComplete: (id: number) => Promise<void>;
  onDelete: (id: number) => void;
}

export function Board({ tasks, onMove, onUpdate, onComplete, onDelete }: BoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<number | null>(null);
  const candidateTask = tasks.find((t) => t.id === deleteCandidate);
  const [completeCandidate, setCompleteCandidate] = useState<number | null>(null);
  const [completing, setCompleting] = useState(false);
  const completeCandidateTask = tasks.find((t) => t.id === completeCandidate);

  async function handleConfirmComplete() {
    if (completeCandidate === null || completing) return;
    setCompleting(true);
    try {
      await onComplete(completeCandidate);
      setCompleteCandidate(null);
    } finally {
      setCompleting(false);
    }
  }

  return (
    <>
    <div className="flex gap-2">
      {/* Vertical axis (Importance) */}
      <div className="hidden w-6 flex-col items-center justify-between py-10 sm:flex">
        <AxisText>⬆ Important</AxisText>
        <AxisText muted>Not Important ⬇</AxisText>
      </div>

      <div className="flex-1">
        {/* Horizontal axis (Urgency) */}
        <div className="mb-2 hidden justify-between px-6 sm:flex">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-foreground)]/70">
            ⬅ Urgent
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted-foreground)]/60">
            Not Urgent ➡
          </span>
        </div>

        <div
          ref={boardRef}
          className="relative h-[68vh] min-h-[520px] w-full rounded-[2rem] border-2 border-white/70 bg-white/50 shadow-xl shadow-violet-900/10 backdrop-blur-sm"
        >
          {/* Coloured quadrant regions (clipped to the rounded corners) */}
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 overflow-hidden rounded-[2rem]">
            {QUADRANTS.map((q) => (
              <div
                key={q.key}
                className={cn(
                  "relative bg-gradient-to-br opacity-[0.14] transition-opacity",
                  q.gradient
                )}
              />
            ))}
          </div>

          {/* Faint quadrant labels */}
          <div className="pointer-events-none absolute inset-0 grid grid-cols-2 grid-rows-2">
            {QUADRANTS.map((q) => (
              <div key={q.key} className="flex items-center justify-center">
                <div className="flex flex-col items-center gap-1 text-center opacity-40">
                  <span className="text-3xl">{q.emoji}</span>
                  <span className="text-sm font-extrabold uppercase tracking-wide text-[var(--color-foreground)]">
                    {q.title}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Dividing cross */}
          <div className="pointer-events-none absolute inset-y-0 left-1/2 w-0 -translate-x-1/2 border-l-2 border-dashed border-[var(--color-foreground)]/15" />
          <div className="pointer-events-none absolute inset-x-0 top-1/2 h-0 -translate-y-1/2 border-t-2 border-dashed border-[var(--color-foreground)]/15" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-[var(--color-foreground)]/20 bg-white/60" />

          {/* Tasks */}
          {tasks.map((task) => (
            <FloatingCard
              key={task.id}
              task={task}
              boardRef={boardRef}
              onMove={onMove}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onRequestDelete={setDeleteCandidate}
              onRequestComplete={setCompleteCandidate}
            />
          ))}

          {tasks.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="rounded-full bg-white/80 px-5 py-2 text-sm font-medium text-[var(--color-muted-foreground)] shadow">
                No tasks yet — hit “New Task” to add one ✨
              </p>
            </div>
          )}
        </div>
      </div>
    </div>

      <Dialog open={deleteCandidate !== null} onOpenChange={(open) => { if (!open) setDeleteCandidate(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="mx-auto mb-1 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-2xl">
              🗑️
            </div>
            <DialogTitle className="text-center">Delete this task?</DialogTitle>
            <DialogDescription className="text-center">
              "{candidateTask?.name}" will be removed for good. This can't be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <DialogClose asChild>
              <Button variant="secondary" className="flex-1">Keep it</Button>
            </DialogClose>
            <Button
              variant="danger"
              className="flex-1"
              onClick={() => {
                if (deleteCandidate !== null) onDelete(deleteCandidate);
                setDeleteCandidate(null);
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={completeCandidate !== null}
        onOpenChange={(open) => { if (!open) setCompleteCandidate(null); }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="mx-auto mb-1 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/25">
              <CircleCheckBig className="h-7 w-7" strokeWidth={2.5} />
            </div>
            <DialogTitle className="text-center">Mark this task complete?</DialogTitle>
            <DialogDescription className="text-center">
              "{completeCandidateTask?.name}" will move to your completed tasks list.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <DialogClose asChild>
              <Button variant="secondary" className="flex-1" disabled={completing}>
                Not yet
              </Button>
            </DialogClose>
            <Button className="flex-1" disabled={completing} onClick={handleConfirmComplete}>
              {completing ? "Completing…" : "Complete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AxisText({
  children,
  muted,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <span
      className={cn(
        "whitespace-nowrap text-xs font-bold uppercase tracking-wider [writing-mode:vertical-rl] rotate-180",
        muted ? "text-[var(--color-muted-foreground)]/60" : "text-[var(--color-foreground)]/70"
      )}
    >
      {children}
    </span>
  );
}
