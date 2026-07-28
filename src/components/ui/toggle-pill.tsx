import { cn } from "@/lib/utils";

interface TogglePillProps {
  label: string;
  emoji: string;
  active: boolean;
  onClick: () => void;
  activeClass: string;
}

/** A big friendly on/off pill used to pick Important / Urgent when creating a task. */
export function TogglePill({ label, emoji, active, onClick, activeClass }: TogglePillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all active:scale-[0.97]",
        active
          ? cn("text-white shadow-md", activeClass)
          : "border-[var(--color-border)] bg-white text-[var(--color-muted-foreground)] hover:border-[var(--color-ring)]"
      )}
    >
      <span className="text-base">{emoji}</span>
      {label}
      <span
        className={cn(
          "ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
          active ? "bg-white/25" : "bg-[var(--color-muted)]"
        )}
      >
        {active ? "Yes" : "No"}
      </span>
    </button>
  );
}
