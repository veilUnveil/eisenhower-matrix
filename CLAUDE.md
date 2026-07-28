# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Keeping this file current

This file must stay in sync with the project as it evolves. Whenever a change in
this session alters something documented below — a new API route, a changed data
column, a new confirmation-dialog pattern, a renamed script, a different deploy
target — update the relevant section in the same session, before finishing up.
Keep edits minimal and factual; don't re-document things that are obvious from
reading the touched files, and don't restate generic best practices.

## Commands

```bash
npm install        # install dependencies
npm run dev        # run API (3001) + Vite dev server (5173) together, with hot reload
npm run dev:server # API only, node --watch server/index.js
npm run dev:web    # Vite dev server only
npm run build      # tsc --noEmit (type-check) then vite build -> dist/
npm run preview    # preview the built dist/ via Vite
npm start          # run the Express server (server/index.js) — serves dist/ + /api
node scripts/seed.mjs  # wipe tasks and load a fresh categorised seed set (stop the server first)
```

There is no test suite and no linter configured. `npm run build` (which runs
`tsc --noEmit`) is the closest thing to a CI check — run it after any change.

Requires Node 22.5+ for the built-in `node:sqlite` module.

### Production deployment (pm2)

The app is also run in production locally under **pm2** as the process named
`eisenhower-matrix`, serving `http://localhost:3001` from the built `dist/`
folder (not the Vite dev server on 5173). This is a separate, standing process
from anything started with `npm run dev`. After making frontend or server
changes that should show up there:

```bash
npm run build
pm2 restart eisenhower-matrix
```

`pm2 list` shows current status. Verify a redeploy by checking that the
hashed asset filenames in `curl http://localhost:3001/` match the ones just
printed by `vite build`.

## Architecture

**Stack:** React + TypeScript + Vite frontend, Tailwind CSS v4 (via
`@tailwindcss/vite`, theme tokens in `src/index.css`'s `@theme` block),
Radix-based shadcn-style primitives in `src/components/ui/`, lucide-react
icons. Backend is a small Express server (`server/index.js`) using Node's
built-in `node:sqlite` (`server/db.js`) — no native build step, no ORM.
`@/*` resolves to `src/*` (see `vite.config.ts` / `tsconfig.json`).

**Position is the single source of truth.** A task's quadrant (`important` /
`urgent` booleans) is *derived from* its `x`/`y` centre position (0..1 across
the board; left half = urgent, top half = important), not stored
independently. This derivation is duplicated in two places that must be kept
in sync: `flagsFromPos()` in `src/types.ts` (client) and `flagsFromPos()` in
`server/db.js` (server, recomputed on every write in `updateTask`/`createTask`).
`src/types.ts` also holds `QUADRANTS` (the four quadrant definitions — emoji,
gradient, chip/check colors) and `metaFromPos()`, which most UI components use
to style a task by its current position rather than its stored flags.

**Data flow:** `src/App.tsx` owns all task state (fetched once via `api.list()`
in `src/api.ts`) and every mutation handler (`handleCreate`, `handleMove`,
`handleUpdate`, `handleComplete`, `handleReactivate`, `handleDelete`), doing
optimistic updates with rollback on failure for move/delete. It splits tasks
into `activeTasks` (→ `Board`) and `completedTasks` (→ `CompletedTasksDialog`)
and passes handlers down as props — there's no shared client state store.

**Confirmation dialogs are centralized in `Board.tsx`**, not in the individual
card components. `Board` renders exactly one delete-confirmation `Dialog` and
one complete-confirmation `Dialog`, each keyed off a `deleteCandidate` /
`completeCandidate` id in local state. `FloatingCard` and `TaskDetailDialog`
never call `onDelete`/`onComplete` directly for user-initiated actions — they
call `onRequestDelete(id)` / `onRequestComplete(id)`, which just sets the
candidate id on `Board` and lets its dialog take over (closing their own
dialog first, in `TaskDetailDialog`'s case). When adding a new destructive or
significant action, prefer threading it through this same request/candidate
pattern rather than adding a per-card dialog.

**`FloatingCard.tsx`** renders a draggable tile (`onPointerDown` implements
drag-with-threshold, snap-to-quadrant on release via `snapToQuadrant()`) plus
a hover tooltip and a small "dot" button that acts as the complete affordance.
That dot only swaps from a quadrant-colored dot to a checkmark when the
pointer is over the dot itself (`group-hover/complete`), deliberately *not*
when hovering the card at large (`group-hover/card`, used instead for the
tile's lift/shadow/tooltip) — easy to regress if the two group names get
merged.

**Server** (`server/index.js`): Express serves `dist/` as static files and
exposes `/api/tasks` (GET/POST) and `/api/tasks/:id` (PATCH/DELETE). All
validation lives in the route handlers; `server/db.js` does the SQLite work
and re-derives `important`/`urgent` from `x`/`y` on every write, and sets/clears
`completed_at` based on the `completed` boolean. Schema changes use the
lightweight in-file migration pattern at the top of `db.js` (check
`PRAGMA table_info`, `ALTER TABLE ADD COLUMN` if missing) rather than a
migration framework — follow that pattern for new columns. The SQLite file
(`server/tasks.db`) is git-ignored; `scripts/seed.mjs` is a separate one-off
script (run with the server stopped) that wipes and reloads it with a curated
task list, independent from `db.js`'s empty-database seed.
