/** "active" tasks are on the board; the other two are shelved out of view. */
export type TaskStatus = "active" | "on_hold" | "archived";

export interface Task {
  id: number;
  name: string;
  description: string;
  important: boolean;
  urgent: boolean;
  /** Centre position on the board, as fractions of width/height (0..1). */
  x: number;
  y: number;
  /** Optional due date as an ISO "YYYY-MM-DD" string, or null. */
  dueDate: string | null;
  completed: boolean;
  /** ISO timestamp set by the server when the task is completed. */
  completedAt: string | null;
  status: TaskStatus;
  /** ISO timestamp of the last status change (e.g. when it was archived). */
  statusChangedAt: string | null;
  createdAt: string;
}

export type QuadrantKey = "do" | "schedule" | "delegate" | "eliminate";

export interface QuadrantMeta {
  key: QuadrantKey;
  title: string;
  subtitle: string;
  hint: string;
  important: boolean;
  urgent: boolean;
  emoji: string;
  gradient: string;
  check: string;
  chip: string;
  ring: string;
}

/** The four quadrants of the Eisenhower matrix. */
export const QUADRANTS: QuadrantMeta[] = [
  {
    key: "do",
    title: "Act",
    subtitle: "Important · Urgent",
    hint: "Crises & deadlines — tackle these now.",
    important: true,
    urgent: true,
    emoji: "🔥",
    gradient: "from-[var(--color-do-from)] to-[var(--color-do-to)]",
    check: "text-rose-500",
    chip: "bg-rose-100 text-rose-700",
    ring: "group-hover/quad:ring-rose-300",
  },
  {
    key: "schedule",
    title: "Plan",
    subtitle: "Important · Not Urgent",
    hint: "Goals & growth — plan time for them.",
    important: true,
    urgent: false,
    emoji: "🗓️",
    gradient: "from-[var(--color-schedule-from)] to-[var(--color-schedule-to)]",
    check: "text-sky-500",
    chip: "bg-sky-100 text-sky-700",
    ring: "group-hover/quad:ring-sky-300",
  },
  {
    key: "delegate",
    title: "Reduce",
    subtitle: "Not Important · Urgent",
    hint: "Interruptions — hand these off.",
    important: false,
    urgent: true,
    emoji: "🤝",
    gradient: "from-[var(--color-delegate-from)] to-[var(--color-delegate-to)]",
    check: "text-amber-500",
    chip: "bg-amber-100 text-amber-700",
    ring: "group-hover/quad:ring-amber-300",
  },
  {
    key: "eliminate",
    title: "Eliminate",
    subtitle: "Not Important · Not Urgent",
    hint: "Distractions — drop or defer them.",
    important: false,
    urgent: false,
    emoji: "🧹",
    gradient: "from-[var(--color-eliminate-from)] to-[var(--color-eliminate-to)]",
    check: "text-violet-500",
    chip: "bg-violet-100 text-violet-700",
    ring: "group-hover/quad:ring-violet-300",
  },
];

export function quadrantOf(task: Pick<Task, "important" | "urgent">): QuadrantKey {
  if (task.important && task.urgent) return "do";
  if (task.important && !task.urgent) return "schedule";
  if (!task.important && task.urgent) return "delegate";
  return "eliminate";
}

/**
 * Board axes: the LEFT half is Urgent, the TOP half is Important.
 * Position is therefore the single source of truth for the two booleans.
 */
export function flagsFromPos(x: number, y: number) {
  return { important: y < 0.5, urgent: x < 0.5 };
}

export function metaFromPos(x: number, y: number): QuadrantMeta {
  const { important, urgent } = flagsFromPos(x, y);
  return QUADRANTS.find((q) => q.important === important && q.urgent === urgent)!;
}

/** A pleasant default centre for the quadrant chosen by the two booleans. */
export function centreForFlags(important: boolean, urgent: boolean) {
  const jitter = () => (Math.random() - 0.5) * 0.14;
  return {
    x: (urgent ? 0.25 : 0.75) + jitter(),
    y: (important ? 0.25 : 0.75) + jitter(),
  };
}
