import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { listTasks, createTask, updateTask, deleteTask } from "./db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());
app.use(express.static(join(__dirname, "../dist")));

const PORT = process.env.PORT || 3001;

app.get("/api/tasks", (_req, res) => {
  res.json(listTasks());
});

app.post("/api/tasks", (req, res) => {
  const { name, description, x, y, dueDate } = req.body ?? {};
  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "Task name is required." });
  }
  const task = createTask({
    name: name.trim(),
    description: typeof description === "string" ? description.trim() : "",
    x: typeof x === "number" ? x : 0.5,
    y: typeof y === "number" ? y : 0.5,
    dueDate: dueDate ? String(dueDate) : null,
  });
  res.status(201).json(task);
});

app.patch("/api/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const { name, description, x, y, dueDate, completed } = req.body ?? {};
  const fields = {};
  if (name !== undefined) fields.name = String(name).trim();
  if (description !== undefined) fields.description = String(description).trim();
  if (typeof x === "number") fields.x = x;
  if (typeof y === "number") fields.y = y;
  if (dueDate !== undefined) fields.dueDate = dueDate ? String(dueDate) : null;
  if (typeof completed === "boolean") fields.completed = completed;

  if (fields.name !== undefined && !fields.name) {
    return res.status(400).json({ error: "Task name is required." });
  }

  const task = updateTask(id, fields);
  if (!task) return res.status(404).json({ error: "Task not found." });
  res.json(task);
});

app.delete("/api/tasks/:id", (req, res) => {
  const ok = deleteTask(Number(req.params.id));
  if (!ok) return res.status(404).json({ error: "Task not found." });
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`🗂️  Eisenhower API running at http://localhost:${PORT}`);
});
