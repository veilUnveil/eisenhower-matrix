import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { QUADRANTS, quadrantOf, centreForFlags } from "@/types";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TogglePill } from "@/components/ui/toggle-pill";

interface CreateTaskDialogProps {
  onCreate: (data: {
    name: string;
    description: string;
    x: number;
    y: number;
    dueDate: string | null;
  }) => Promise<void>;
}

export function CreateTaskDialog({ onCreate }: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [important, setImportant] = useState(true);
  const [urgent, setUrgent] = useState(true);
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  const targetQuadrant = QUADRANTS.find(
    (q) => q.key === quadrantOf({ important, urgent })
  )!;

  function reset() {
    setName("");
    setDescription("");
    setImportant(true);
    setUrgent(true);
    setDueDate("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      const { x, y } = centreForFlags(important, urgent);
      await onCreate({
        name: name.trim(),
        description: description.trim(),
        x,
        y,
        dueDate: dueDate || null,
      });
      reset();
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="default" className="shadow-xl">
          <Plus className="h-5 w-5" />
          New Task
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-fuchsia-500" />
            Create a task
          </DialogTitle>
          <DialogDescription>
            Give it a name, then decide how important and urgent it is.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="task-name" className="text-sm font-semibold">
              Task name
            </label>
            <Input
              id="task-name"
              autoFocus
              placeholder="e.g. Prepare the launch deck"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="task-desc" className="text-sm font-semibold">
              Description{" "}
              <span className="font-normal text-[var(--color-muted-foreground)]">
                (shown on hover)
              </span>
            </label>
            <Textarea
              id="task-desc"
              placeholder="A short note about what this involves…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="task-date" className="text-sm font-semibold">
              Due date{" "}
              <span className="font-normal text-[var(--color-muted-foreground)]">
                (optional)
              </span>
            </label>
            <Input
              id="task-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold">Priority</span>
            <div className="flex gap-3">
              <TogglePill
                label="Important"
                emoji="⭐"
                active={important}
                onClick={() => setImportant((v) => !v)}
                activeClass="border-amber-400 bg-gradient-to-r from-amber-400 to-orange-400"
              />
              <TogglePill
                label="Urgent"
                emoji="⚡"
                active={urgent}
                onClick={() => setUrgent((v) => !v)}
                activeClass="border-rose-400 bg-gradient-to-r from-rose-500 to-red-500"
              />
            </div>
          </div>

          {/* Live preview of where it will land */}
          <div
            className={cn(
              "flex items-center gap-3 rounded-2xl bg-gradient-to-r p-3 text-white",
              targetQuadrant.gradient
            )}
          >
            <span className="text-2xl">{targetQuadrant.emoji}</span>
            <div className="text-sm">
              <p className="font-bold leading-tight">Lands in “{targetQuadrant.title}”</p>
              <p className="text-xs text-white/85">{targetQuadrant.hint}</p>
            </div>
          </div>

          <Button type="submit" disabled={!name.trim() || saving} className="mt-1">
            {saving ? "Adding…" : "Add task"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
