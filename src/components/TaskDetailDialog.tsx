import { useEffect, useState } from "react";
import { Pencil, Calendar, Trash2, CircleCheckBig, PauseCircle, Archive } from "lucide-react";
import type { Task } from "@/types";
import { metaFromPos } from "@/types";
import { cn, formatDate } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Linkified } from "./Linkified";
import type { ShelveStatus } from "./Board";

interface TaskDetailDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (
    id: number,
    data: { name: string; description: string; dueDate: string | null }
  ) => Promise<void>;
  onRequestComplete: (id: number) => void;
  onRequestShelve: (id: number, status: ShelveStatus) => void;
  onDelete: (id: number) => void;
}

export function TaskDetailDialog({
  task,
  open,
  onOpenChange,
  onUpdate,
  onRequestComplete,
  onRequestShelve,
  onDelete,
}: TaskDetailDialogProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(task.name);
  const [description, setDescription] = useState(task.description);
  const [dueDate, setDueDate] = useState(task.dueDate ?? "");
  const [saving, setSaving] = useState(false);

  // Reset the form whenever the dialog opens (or the task changes underneath it).
  useEffect(() => {
    if (open) {
      setEditing(false);
      setName(task.name);
      setDescription(task.description);
      setDueDate(task.dueDate ?? "");
    }
  }, [open, task]);

  const meta = metaFromPos(task.x, task.y);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await onUpdate(task.id, {
        name: name.trim(),
        description: description.trim(),
        dueDate: dueDate || null,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleRequestComplete() {
    onOpenChange(false);
    onRequestComplete(task.id);
  }

  function handleRequestShelve(status: ShelveStatus) {
    onOpenChange(false);
    onRequestShelve(task.id, status);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <span
            className={cn(
              "inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
              meta.chip
            )}
          >
            {meta.emoji} {meta.title}
          </span>
          <DialogTitle className="pr-6">
            {editing ? "Edit task" : task.name}
          </DialogTitle>
        </DialogHeader>

        {editing ? (
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-name" className="text-sm font-semibold">
                Task name
              </label>
              <Input
                id="edit-name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-desc" className="text-sm font-semibold">
                Description
              </label>
              <Textarea
                id="edit-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                placeholder="A short note…"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-date" className="text-sm font-semibold">
                Due date{" "}
                <span className="font-normal text-[var(--color-muted-foreground)]">
                  (optional)
                </span>
              </label>
              <Input
                id="edit-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="mt-1 flex gap-3">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={!name.trim() || saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        ) : (
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
                <Linkified
                  text={task.description}
                  className="text-primary hover:opacity-80"
                />
              ) : (
                "No description yet."
              )}
            </p>

            <div className="flex items-center gap-2 rounded-xl bg-[var(--color-muted)] px-3 py-2.5 text-sm">
              <Calendar className="h-4 w-4 text-[var(--color-muted-foreground)]" />
              {task.dueDate ? (
                <span className="font-medium">{formatDate(task.dueDate)}</span>
              ) : (
                <span className="text-[var(--color-muted-foreground)]">No due date</span>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => handleRequestShelve("on_hold")}
              >
                <PauseCircle className="h-4 w-4" />
                Put on hold
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => handleRequestShelve("archived")}
              >
                <Archive className="h-4 w-4" />
                Archive
              </Button>
            </div>

            <div className="mt-1 flex gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-rose-600 hover:bg-rose-50"
                onClick={() => {
                  onDelete(task.id);
                  onOpenChange(false);
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
              <Button variant="secondary" className="ml-auto" onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <Button onClick={handleRequestComplete}>
                <CircleCheckBig className="h-4 w-4" />
                Complete
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
