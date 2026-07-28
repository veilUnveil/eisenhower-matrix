import { useEffect, useState } from "react";
import { LayoutGrid } from "lucide-react";
import type { Task } from "@/types";
import { flagsFromPos } from "@/types";
import { api } from "@/api";
import { Board } from "@/components/Board";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { CompletedTasksDialog } from "@/components/CompletedTasksDialog";

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks
    .filter((task) => task.completed)
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));

  useEffect(() => {
    api
      .list()
      .then(setTasks)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(data: {
    name: string;
    description: string;
    x: number;
    y: number;
    dueDate: string | null;
  }) {
    const created = await api.create(data);
    setTasks((prev) => [created, ...prev]);
  }

  async function handleMove(id: number, x: number, y: number) {
    const previous = tasks;
    // Optimistic move — snap the card immediately, reconcile with the server after.
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, x, y, ...flagsFromPos(x, y) } : t))
    );
    try {
      const updated = await api.update(id, { x, y });
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (e) {
      setTasks(previous);
      setError(e instanceof Error ? e.message : "Could not move task");
    }
  }

  async function handleUpdate(
    id: number,
    data: { name: string; description: string; dueDate: string | null }
  ) {
    const updated = await api.update(id, data);
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }

  async function handleComplete(id: number) {
    try {
      const updated = await api.update(id, { completed: true });
      setTasks((prev) => prev.map((task) => (task.id === id ? updated : task)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not complete task");
      throw e;
    }
  }

  async function handleReactivate(id: number) {
    try {
      const updated = await api.update(id, { completed: false });
      setTasks((prev) => prev.map((task) => (task.id === id ? updated : task)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reactivate task");
      throw e;
    }
  }

  async function handleDelete(id: number) {
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await api.remove(id);
    } catch (e) {
      setTasks(previous);
      setError(e instanceof Error ? e.message : "Could not delete task");
    }
  }

  return (
    <div className="mx-auto flex min-h-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:py-10">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30">
            <LayoutGrid className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Eisenhower Matrix
            </h1>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Drag a task anywhere — its colour follows where it lands.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CompletedTasksDialog
            tasks={completedTasks}
            onReactivate={handleReactivate}
          />
          <CreateTaskDialog onCreate={handleCreate} />
        </div>
      </header>

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-rose-100 px-4 py-2.5 text-sm font-medium text-rose-700">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold hover:text-rose-900">
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="h-[68vh] min-h-[520px] animate-pulse rounded-[2rem] bg-white/50" />
      ) : (
        <Board
          tasks={activeTasks}
          onMove={handleMove}
          onUpdate={handleUpdate}
          onComplete={handleComplete}
          onDelete={handleDelete}
        />
      )}

      <footer className="mt-6 text-center text-xs text-[var(--color-muted-foreground)]">
        {activeTasks.length} active task{activeTasks.length === 1 ? "" : "s"} · Drag
        to reposition · Click a card to edit or complete it
      </footer>
    </div>
  );
}
