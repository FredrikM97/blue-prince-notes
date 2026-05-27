import { useMemo, useState } from "react";
import { useStore } from "@/frontend/data/store";
import {
  ROOMS_BY_CATEGORY,
  ROOM_CATEGORIES,
  GRID_COLS,
  GRID_ROWS,
  cellId,
} from "@/frontend/data/rooms";
import { Chip } from "@/frontend/components/common/Chip";
import { buttonClass } from "@/frontend/components/common/buttonClasses";
import { TEXTAREA_BASE_CLASS } from "@/frontend/components/common/formClasses";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/frontend/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select";
import type { GridCell } from "@/lib/types";
import { Trash2, Eraser } from "lucide-react";

const COL_LABELS = ["A", "B", "C", "D", "E"] as const;

function coordLabel(row: number, col: number) {
  return `${COL_LABELS[col] ?? String(col + 1)}${GRID_ROWS - row}`;
}

const STATUS_COLOR: Record<GridCell["status"], string> = {
  unknown: "bg-card border-border text-muted-foreground",
  drafted: "bg-card border-border text-muted-foreground",
  explored: "bg-card border-border text-muted-foreground",
  cleared: "bg-brass border-brass text-brass-foreground",
};

export function MapPage() {
  const gridCells = useStore((s) => s.gridCells);
  const notes = useStore((s) => s.notes);
  const todos = useStore((s) => s.todos);
  const upsertCell = useStore((s) => s.upsertCell);
  const clearCell = useStore((s) => s.clearCell);
  const openCapture = useStore((s) => s.openCapture);
  const [active, setActive] = useState<{ row: number; col: number } | null>(null);

  const byId = useMemo(() => {
    const m = new Map<string, GridCell>();
    gridCells.forEach((c) => m.set(c.id, c));
    return m;
  }, [gridCells]);

  const activeCell = active ? byId.get(cellId(active.row, active.col)) : undefined;
  const activeRoom = activeCell?.roomName;
  const activeNotes = activeRoom ? notes.filter((n) => n.room === activeRoom) : [];
  const activeTodos = activeRoom ? todos.filter((t) => t.room === activeRoom) : [];

  const [commentDraft, setCommentDraft] = useState("");
  function openCell(row: number, col: number) {
    setActive({ row, col });
    const c = byId.get(cellId(row, col));
    setCommentDraft(c?.comment ?? "");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <h1 className="font-serif text-2xl">Mt. Holly Map</h1>
          <p className="text-xs text-muted-foreground">
            5 × 9 grid — click a cell to place a room and add comments.
          </p>
        </div>
        <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
          <Legend color={STATUS_COLOR.cleared}>Cleared</Legend>
        </div>
      </div>

      <div
        className="mx-auto grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
          maxWidth: 720,
        }}
      >
        {Array.from({ length: GRID_ROWS }).flatMap((_, row) =>
          Array.from({ length: GRID_COLS }).map((__, col) => {
            const cell = byId.get(cellId(row, col));
            const status = cell?.status === "cleared" ? "cleared" : "unknown";
            const roomNoteCount = cell?.roomName
              ? notes.filter((n) => n.room === cell.roomName).length
              : 0;
            return (
              <button
                key={`${row},${col}`}
                onClick={() => openCell(row, col)}
                className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md border p-1.5 text-center transition hover:scale-[1.03] hover:border-brass ${STATUS_COLOR[status]}`}
              >
                {cell?.roomName ? (
                  <>
                    <span className="font-serif text-[11px] leading-tight sm:text-xs">
                      {cell.roomName}
                    </span>
                    {(cell.comment || roomNoteCount > 0) && (
                      <span className="text-[9px] opacity-80">
                        {cell.comment && "💬"}
                        {roomNoteCount > 0 && ` 📝${roomNoteCount}`}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-[10px] opacity-50">{coordLabel(row, col)}</span>
                )}
              </button>
            );
          }),
        )}
      </div>

      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {active && (
            <>
              <SheetHeader>
                <SheetTitle className="font-serif text-2xl">
                  {activeCell?.roomName ?? `Cell ${coordLabel(active.row, active.col)}`}
                </SheetTitle>
                <SheetDescription>
                  Coordinate {coordLabel(active.row, active.col)}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Room
                  </label>
                  <Select
                    value={activeCell?.roomName ?? ""}
                    onValueChange={(name) =>
                      upsertCell({ row: active.row, col: active.col, roomName: name })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pick a room..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ROOM_CATEGORIES.map((cat) => (
                        <SelectGroup key={cat}>
                          <SelectLabel>{cat}</SelectLabel>
                          {ROOMS_BY_CATEGORY[cat].map((r) => (
                            <SelectItem key={r.name} value={r.name}>
                              {r.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Cell comment
                  </label>
                  <textarea
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                    onBlur={() =>
                      upsertCell({
                        row: active.row,
                        col: active.col,
                        comment: commentDraft,
                      })
                    }
                    placeholder="Quick note about this cell — door direction, gem cost, danger..."
                    rows={3}
                    className={TEXTAREA_BASE_CLASS}
                  />
                </div>

                <div className="flex gap-2">
                  {activeRoom && (
                    <>
                      <button
                        className={buttonClass({
                          size: "sm",
                          className: "flex-1 bg-brass text-brass-foreground hover:bg-brass/90",
                        })}
                        onClick={() => openCapture({ kind: "note", room: activeRoom })}
                      >
                        + Note (image)
                      </button>
                      <button
                        className={buttonClass({ size: "sm", variant: "outline", className: "flex-1" })}
                        onClick={() => openCapture({ kind: "todo", room: activeRoom })}
                      >
                        + Todo
                      </button>
                    </>
                  )}
                </div>

                <div className="flex gap-2 border-t border-border pt-3">
                  <button
                    className={buttonClass({
                      size: "sm",
                      variant: "ghost",
                      className: "text-muted-foreground",
                    })}
                    onClick={() => {
                      setCommentDraft("");
                      upsertCell({
                        row: active.row,
                        col: active.col,
                        comment: "",
                      });
                    }}
                  >
                    <Eraser className="mr-1 h-3.5 w-3.5" /> Clear comment
                  </button>
                  <button
                    className={buttonClass({
                      size: "sm",
                      variant: "ghost",
                      className: "text-destructive hover:text-destructive",
                    })}
                    onClick={() => {
                      clearCell(active.row, active.col);
                      setActive(null);
                    }}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Clear cell
                  </button>
                </div>

                {activeNotes.length > 0 && (
                  <div>
                    <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Notes in this room
                    </div>
                    <ul className="space-y-2">
                      {activeNotes.map((n) => (
                        <li
                          key={n.id}
                          className="rounded border border-border bg-card p-2 text-sm"
                        >
                          <div className="font-medium">{n.title}</div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            <Chip className="border-border bg-secondary text-foreground">
                              {n.type}
                            </Chip>
                            {n.imageIds.length > 0 && (
                              <Chip className="border-border text-foreground">
                                📎 {n.imageIds.length}
                              </Chip>
                            )}
                            {n.tags.map((t) => (
                              <Chip key={t} className="border-border text-foreground">
                                #{t}
                              </Chip>
                            ))}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {activeTodos.length > 0 && (
                  <div>
                    <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Todo items in this room
                    </div>
                    <ul className="space-y-1 text-sm">
                      {activeTodos.map((t) => (
                        <li
                          key={t.id}
                          className={
                            t.status === "done" ? "text-muted-foreground line-through" : ""
                          }
                        >
                          · {t.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Legend({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`h-3 w-3 rounded border ${color}`} />
      {children}
    </span>
  );
}
