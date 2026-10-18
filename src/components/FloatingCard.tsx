import { useEffect, useRef, useState } from "react";
import { X, Calendar, Check } from "lucide-react";
import type { Task } from "@/types";
import { metaFromPos } from "@/types";
import { cn, formatDate, truncate } from "@/lib/utils";
import { Linkified } from "./Linkified";
import { TaskDetailDialog } from "./TaskDetailDialog";
import type { ShelveStatus } from "./Board";

/** Gap (px) kept between a card and the dividing lines / board edges. */
const GUTTER = 14;
/** Task names longer than this are clipped on the tile (full name lives in the tooltip / dialog). */
const NAME_LIMIT = 26;

const clamp = (v: number, lo: number, hi: number) =>
  lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v));

/** Snap a centre so the whole card sits inside the quadrant its centre falls in. */
function snapToQuadrant(
  cx: number,
  cy: number,
  board: DOMRect,
  cardW: number,
  cardH: number
) {
  const fw = cardW / 2 / board.width;
  const fh = cardH / 2 / board.height;
  const gx = GUTTER / board.width;
  const gy = GUTTER / board.height;
  const urgent = cx < 0.5;
  const important = cy < 0.5;

  const x = urgent
    ? clamp(cx, fw + gx, 0.5 - fw - gx)
    : clamp(cx, 0.5 + fw + gx, 1 - fw - gx);
  const y = important
    ? clamp(cy, fh + gy, 0.5 - fh - gy)
    : clamp(cy, 0.5 + fh + gy, 1 - fh - gy);
  return { x, y };
}

interface FloatingCardProps {
  task: Task;
  boardRef: React.RefObject<HTMLDivElement | null>;
  onMove: (id: number, x: number, y: number) => void;
  onUpdate: (
    id: number,
    data: { name: string; description: string; dueDate: string | null }
  ) => Promise<void>;
  onDelete: (id: number) => void;
  onRequestDelete: (id: number) => void;
  onRequestComplete: (id: number) => void;
  onRequestShelve: (id: number, status: ShelveStatus) => void;
}

export function FloatingCard({
  task,
  boardRef,
  onMove,
  onUpdate,
  onDelete,
  onRequestDelete,
  onRequestComplete,
  onRequestShelve,
}: FloatingCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: task.x, y: task.y });
  const [dragging, setDragging] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  // Keep in sync with external updates (e.g. server reconciliation) while idle.
  useEffect(() => {
    if (!dragging) setPos({ x: task.x, y: task.y });
  }, [task.x, task.y, dragging]);

  const meta = metaFromPos(pos.x, pos.y);
  const flipUp = pos.y > 0.58; // show tooltip above when near the bottom

  function handlePointerDown(e: React.PointerEvent) {
    if (e.button !== 0 || !boardRef.current || !cardRef.current) return;
    e.preventDefault();
    const board = boardRef.current.getBoundingClientRect();
    const card = cardRef.current.getBoundingClientRect();
    const offX = e.clientX - (card.left + card.width / 2);
    const offY = e.clientY - (card.top + card.height / 2);
    const fw = card.width / 2 / board.width;
    const fh = card.height / 2 / board.height;
    const startX = e.clientX;
    const startY = e.clientY;
    let moved = false;

    const toCentre = (ev: PointerEvent) => ({
      x: clamp((ev.clientX - offX - board.left) / board.width, fw, 1 - fw),
      y: clamp((ev.clientY - offY - board.top) / board.height, fh, 1 - fh),
    });

    const move = (ev: PointerEvent) => {
      if (!moved && Math.hypot(ev.clientX - startX, ev.clientY - startY) > 4) {
        moved = true;
        setDragging(true);
      }
      if (moved) setPos(toCentre(ev));
    };

    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      if (!moved) {
        // A plain click — open the task.
        setDetailOpen(true);
        return;
      }
      const c = toCentre(ev);
      const snapped = snapToQuadrant(c.x, c.y, board, card.width, card.height);
      setPos(snapped);
      setDragging(false);
      if (Math.abs(snapped.x - task.x) > 0.001 || Math.abs(snapped.y - task.y) > 0.001) {
        onMove(task.id, snapped.x, snapped.y);
      }
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <>
      <div
        ref={cardRef}
        onPointerDown={handlePointerDown}
        style={{
          left: `${pos.x * 100}%`,
          top: `${pos.y * 100}%`,
          touchAction: "none",
        }}
        className={cn(
          "group/card absolute flex w-44 -translate-x-1/2 -translate-y-1/2 select-none items-center gap-2 rounded-xl border border-black/5 bg-white py-2.5 pl-3 pr-7 shadow-md",
          dragging
            ? "z-50 scale-105 cursor-grabbing shadow-2xl rotate-1"
            : "z-10 cursor-pointer transition-[left,top,transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:z-20 hover:-translate-y-[calc(50%+2px)] hover:shadow-xl"
        )}
      >
        {/* The quadrant-coloured dot becomes a check affordance only once the
            pointer is actually over the dot (not just anywhere on the card). */}
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onRequestComplete(task.id)}
          aria-label={`Mark ${task.name} as complete`}
          title="Complete task"
          className="group/complete relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-1"
        >
          <span
            className={cn(
              "absolute inset-0 scale-50 rounded-full bg-black/10 opacity-0 transition-all duration-150",
              "group-hover/complete:scale-100 group-hover/complete:opacity-100 group-focus-visible/complete:scale-100 group-focus-visible/complete:opacity-100"
            )}
          />
          <span
            className={cn(
              "absolute h-2.5 w-2.5 rounded-full bg-gradient-to-br transition-all duration-150",
              "group-hover/complete:scale-50 group-hover/complete:opacity-0 group-focus-visible/complete:scale-50 group-focus-visible/complete:opacity-0",
              meta.gradient
            )}
          />
          <Check
            className={cn(
              "pointer-events-none relative h-4 w-4 scale-75 stroke-[3] opacity-0 transition-all duration-150",
              "group-hover/complete:scale-100 group-hover/complete:opacity-100 group-focus-visible/complete:scale-100 group-focus-visible/complete:opacity-100",
              meta.check
            )}
          />
        </button>
        <span className="truncate text-sm font-semibold leading-tight text-[var(--color-foreground)]">
          {truncate(task.name, NAME_LIMIT)}
        </span>

        {/* Delete (X) in the corner */}
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onRequestDelete(task.id)}
          aria-label={`Delete ${task.name}`}
          className={cn(
            "absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[var(--color-muted-foreground)] transition-all",
            "opacity-0 group-hover/card:opacity-100 hover:bg-rose-100 hover:text-rose-600 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
          )}
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {/* Hover tooltip — full name, due date and (link-aware) description.
            The outer wrapper hugs the card edge so its padding bridges the gap,
            keeping the tooltip hoverable (so links stay clickable). */}
        {!dragging && (
          <div
            onPointerDown={(e) => e.stopPropagation()}
            className={cn(
              "pointer-events-none absolute left-1/2 z-30 flex w-60 -translate-x-1/2 justify-center opacity-0 transition-opacity duration-200 group-hover/card:pointer-events-auto group-hover/card:opacity-100",
              flipUp ? "bottom-full pb-2" : "top-full pt-2"
            )}
          >
            <div className="relative w-60 cursor-default rounded-xl bg-[var(--color-foreground)] px-3 py-2.5 text-white shadow-xl">
              <p className="text-sm font-semibold leading-snug">{task.name}</p>
              {task.dueDate && (
                <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-white/90">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(task.dueDate)}
                </p>
              )}
              {task.description.trim() && (
                <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-relaxed text-white/85">
                  <Linkified
                    text={task.description}
                    className="text-sky-300 hover:text-sky-200"
                  />
                </p>
              )}
              <span
                className={cn(
                  "absolute left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-[var(--color-foreground)]",
                  flipUp ? "bottom-[-4px]" : "top-[-4px]"
                )}
              />
            </div>
          </div>
        )}
      </div>

      {/* Click-to-open detail / edit dialog */}
      <TaskDetailDialog
        task={task}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdate={onUpdate}
        onRequestComplete={onRequestComplete}
        onRequestShelve={onRequestShelve}
        onDelete={onDelete}
      />

    </>
  );
}
