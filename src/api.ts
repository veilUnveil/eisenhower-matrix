import type { Task } from "./types";

const JSON_HEADERS = { "Content-Type": "application/json" };

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  list: () => fetch("/api/tasks").then((r) => handle<Task[]>(r)),

  create: (data: {
    name: string;
    description: string;
    x: number;
    y: number;
    dueDate: string | null;
  }) =>
    fetch("/api/tasks", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    }).then((r) => handle<Task>(r)),

  update: (
    id: number,
    data: Partial<Omit<Task, "id" | "createdAt" | "completedAt">>
  ) =>
    fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    }).then((r) => handle<Task>(r)),

  remove: (id: number) =>
    fetch(`/api/tasks/${id}`, { method: "DELETE" }).then((r) => handle<void>(r)),
};
