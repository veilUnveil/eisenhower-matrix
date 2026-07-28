import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new DatabaseSync(path.join(__dirname, "tasks.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    description TEXT    NOT NULL DEFAULT '',
    important   INTEGER NOT NULL DEFAULT 0,
    urgent      INTEGER NOT NULL DEFAULT 0,
    x           REAL    NOT NULL DEFAULT 0.5,
    y           REAL    NOT NULL DEFAULT 0.5,
    due_date    TEXT,
    completed   INTEGER NOT NULL DEFAULT 0,
    completed_at TEXT,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

// Lightweight migration: add newer columns if an older DB predates them.
const columns = db.prepare("PRAGMA table_info(tasks)").all().map((c) => c.name);
if (!columns.includes("x")) db.exec("ALTER TABLE tasks ADD COLUMN x REAL NOT NULL DEFAULT 0.5");
if (!columns.includes("y")) db.exec("ALTER TABLE tasks ADD COLUMN y REAL NOT NULL DEFAULT 0.5");
if (!columns.includes("due_date")) db.exec("ALTER TABLE tasks ADD COLUMN due_date TEXT");
if (!columns.includes("completed")) {
  db.exec("ALTER TABLE tasks ADD COLUMN completed INTEGER NOT NULL DEFAULT 0");
}
if (!columns.includes("completed_at")) {
  db.exec("ALTER TABLE tasks ADD COLUMN completed_at TEXT");
}

// The board's axes: left half = Urgent, top half = Important.
// Position is the source of truth; the booleans are derived from it.
const clamp01 = (n) => Math.min(1, Math.max(0, Number(n)));
const flagsFromPos = (x, y) => ({ important: y < 0.5 ? 1 : 0, urgent: x < 0.5 ? 1 : 0 });

// Seed a few friendly example tasks the first time the app runs.
const { count } = db.prepare("SELECT COUNT(*) AS count FROM tasks").get();
if (count === 0) {
  const seed = db.prepare(
    "INSERT INTO tasks (name, description, important, urgent, x, y) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const rows = [
    ["Ship the quarterly report", "Finalise numbers and send to the leadership team before Friday.", 0.26, 0.28],
    ["Plan next sprint", "Draft goals and groom the backlog. Board: https://github.com/orgs/example/projects/1", 0.73, 0.3],
    ["Reply to vendor emails", "A pile of non-critical messages waiting for a quick response.", 0.28, 0.72],
    ["Reorganise bookmarks", "Nice-to-have tidy-up whenever there's a spare moment.", 0.74, 0.71],
  ];
  for (const [name, description, x, y] of rows) {
    const { important, urgent } = flagsFromPos(x, y);
    seed.run(name, description, important, urgent, x, y);
  }
}

const toTask = (row) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  important: !!row.important,
  urgent: !!row.urgent,
  x: row.x,
  y: row.y,
  dueDate: row.due_date ?? null,
  completed: !!row.completed,
  completedAt: row.completed_at ?? null,
  createdAt: row.created_at,
});

export const listTasks = () =>
  db.prepare("SELECT * FROM tasks ORDER BY created_at DESC, id DESC").all().map(toTask);

export const getTask = (id) => {
  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  return row ? toTask(row) : null;
};

export const createTask = ({ name, description = "", x = 0.5, y = 0.5, dueDate = null }) => {
  const cx = clamp01(x);
  const cy = clamp01(y);
  const { important, urgent } = flagsFromPos(cx, cy);
  const info = db
    .prepare(
      "INSERT INTO tasks (name, description, important, urgent, x, y, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .run(name, description, important, urgent, cx, cy, dueDate || null);
  return getTask(info.lastInsertRowid);
};

export const updateTask = (id, fields) => {
  const current = getTask(id);
  if (!current) return null;
  const next = { ...current, ...fields };
  next.x = clamp01(next.x);
  next.y = clamp01(next.y);
  // Whenever position changes, the booleans follow from it.
  const { important, urgent } = flagsFromPos(next.x, next.y);
  next.completed = !!next.completed;
  if (next.completed && !next.completedAt) {
    next.completedAt = new Date().toISOString();
  } else if (!next.completed) {
    next.completedAt = null;
  }
  db.prepare(
    "UPDATE tasks SET name = ?, description = ?, important = ?, urgent = ?, x = ?, y = ?, due_date = ?, completed = ?, completed_at = ? WHERE id = ?"
  ).run(
    next.name,
    next.description,
    important,
    urgent,
    next.x,
    next.y,
    next.dueDate || null,
    next.completed ? 1 : 0,
    next.completedAt,
    id
  );
  return getTask(id);
};

export const deleteTask = (id) => {
  const info = db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  return info.changes > 0;
};
