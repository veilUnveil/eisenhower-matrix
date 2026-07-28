// One-off script: wipe all tasks and load a fresh, categorised set.
// Run with the server stopped:  node scripts/seed.mjs
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new DatabaseSync(path.join(__dirname, "..", "server", "tasks.db"));

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
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

// Start from a clean slate.
db.exec("DELETE FROM tasks;");
try {
  db.exec("DELETE FROM sqlite_sequence WHERE name = 'tasks';");
} catch {
  /* sqlite_sequence only exists once an AUTOINCREMENT row has been written */
}

// key -> board region. Left half = Urgent, top half = Important.
const REGION = {
  do: { cols: [0.16, 0.34], y0: 0.1, step: 0.085 }, // important + urgent
  schedule: { cols: [0.66, 0.84], y0: 0.1, step: 0.075 }, // important + not urgent
  delegate: { cols: [0.16, 0.34], y0: 0.6, step: 0.078 }, // not important + urgent
  eliminate: { cols: [0.66, 0.84], y0: 0.6, step: 0.085 }, // not important + not urgent
};

const TASKS = [
  // ---- Do First (important + urgent) ----
  { q: "do", name: "Sredi CVI Meta Title & Desc i pošalji ponovo", desc: "Ispraviti u već poslatim tekstovima i poslati ponovo.", due: "2026-06-10" },
  { q: "do", name: "Interdiscount – sredi & pošalji", desc: "" },
  { q: "do", name: "Priprema radionice: tedious tasks", desc: "", due: "2026-07-08" },
  { q: "do", name: "Popuni 5-month review za Miloša", desc: "", due: "2026-07-09" },

  // ---- Schedule (important, not urgent) ----
  { q: "schedule", name: "Uraditi strategy", desc: "" },
  { q: "schedule", name: "Monthly reporting", desc: "" },
  { q: "schedule", name: "Create CVI products & brand workflows (jul)", desc: "" },
  { q: "schedule", name: "Create Interdiscount new workflow", desc: "" },
  { q: "schedule", name: "Kalkulacija workload za jul", desc: "" },
  { q: "schedule", name: "Danica & Vukašin – data management onboarding", desc: "Zakazati termine za jul." },
  { q: "schedule", name: "Leadership: identifikovati teme za razvoj", desc: "Personal Development Program – Focus Leadership 2026: https://app.notion.com/p/Personal-Development-Program-Focus-Leadership-2026-0aa3142afdca4a039c651407d810b0d9?pvs=26&qid=1%3Aa83cffaa-86e3-47ce-bb13-447d536412c1%3A2" },
  { q: "schedule", name: "Customer pain point library", desc: "CIIB OKR Q3 2026: https://app.notion.com/p/CIIB-OKR-Q3-2026-396cbcee4a21804ba8c7f43ed2956f65?source=copy_link — povezati sa Voice of Customer Input Pack: https://app.notion.com/p/Voice-of-Customer-Input-Pack-396cbcee4a218025bf8cee09787a695d?pvs=24" },
  { q: "schedule", name: "Popuni current state assessment", desc: "New Team Perspective 2026 – deputy role upskilling: https://app.notion.com/p/New-Team-Perspective-2026-deputy-role-upskilling-30dcbcee4a21802ea95ecd7cc7fafa45" },

  // ---- Delegate (urgent, not important) ----
  { q: "delegate", name: "Odgovori Isabel – CVI Dienstleistungen i Ratgeber", desc: "" },
  { q: "delegate", name: "Isabel – feedback: Brand pages product rewrites", desc: "Napomena: 7640121570537 (NE-Mittel) – description se nije lepo povukao." },
  { q: "delegate", name: "DataForSEO mejl – traži odobrenje za sredstva", desc: "" },
  { q: "delegate", name: "Tim podsetnik: godišnji odmori", desc: "" },
  { q: "delegate", name: "Dodeli SUN prevode", desc: "" },
  { q: "delegate", name: "Stilus tim – da sam prati planer (official mejl)", desc: "" },
  { q: "delegate", name: "Pascal feedback – Zabunović / Nerichix development", desc: "" },

  // ---- Eliminate (not important, not urgent) ----
  { q: "eliminate", name: "Testiraj spell check", desc: "" },
  { q: "eliminate", name: "Check 1-pager marketing", desc: "1-pager: https://bgwaterfront-my.sharepoint.com/:w:/g/personal/jovana_todorovic_ciib_com/IQAz1n3zK14JQ4IwoBXgDrnsARjwyyYnd3SGuafUhZrYwTg?e=4zS9zH" },
];

const insert = db.prepare(
  "INSERT INTO tasks (name, description, important, urgent, x, y, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)"
);

const counters = {};
for (const t of TASKS) {
  const region = REGION[t.q];
  const i = counters[t.q] ?? 0;
  counters[t.q] = i + 1;
  const x = region.cols[i % 2];
  const y = region.y0 + Math.floor(i / 2) * region.step;
  const important = y < 0.5 ? 1 : 0;
  const urgent = x < 0.5 ? 1 : 0;
  insert.run(t.name, t.desc, important, urgent, x, y, t.due ?? null);
}

const total = db.prepare("SELECT COUNT(*) AS c FROM tasks").get().c;
console.log(`✅ Seeded ${total} tasks.`);
for (const row of db.prepare("SELECT id, important, urgent, x, y, due_date, name FROM tasks ORDER BY id").all()) {
  const quad = row.important
    ? row.urgent ? "Do First " : "Schedule "
    : row.urgent ? "Delegate " : "Eliminate";
  console.log(`  [${quad}] ${row.due_date ?? "         "}  ${row.name}`);
}
