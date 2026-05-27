import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import {
  DEFAULT_ROOMS,
  ROOM_CATEGORIES,
  GRID_COLS,
  GRID_ROWS,
  cellId,
  type RoomCategory,
} from "@/lib/rooms";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GridCell } from "@/lib/types";
import { Trash2, Eraser } from "lucide-react";

export const Route = createFileRoute("/map")({
  head: () => ({ meta: [{ title: "Map — Blue Prince Notes" }] }),
  component: MapPage,
});

const STATUS_COLOR: Record<GridCell["status"], string> = {
  unknown: "bg-card border-border text-muted-foreground",
  drafted: "bg-secondary border-border text-foreground",
  explored: "bg-brass/20 border-brass/40 text-foreground",
  cleared: "bg-brass border-brass text-brass-foreground",
};

const STATUS_LABEL: Record<GridCell["status"], string> = {
  unknown: "Unknown",
  drafted: "Drafted",
  explored: "Explored",
  cleared: "Cleared",
};

const ROOMS_BY_CATEGORY = ROOM_CATEGORIES.reduce(
  (acc, cat) => {
    acc[cat] = DEFAULT_ROOMS.filter((r) => r.category === cat);
    return acc;
  },
  {} as Record<RoomCategory, typeof DEFAULT_ROOMS>,
);

function MapPage() {
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

  // Comment edit state for the open cell
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
          <Legend color={STATUS_COLOR.unknown}>Empty</Legend>
          <Legend color={STATUS_COLOR.drafted}>Drafted</Legend>
          <Legend color={STATUS_COLOR.explored}>Explored</Legend>
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
            const status = cell?.status ?? "unknown";
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
                  <span className="text-[10px] opacity-50">
                    {row + 1},{col + 1}
                  </span>
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
                  {activeCell?.roomName ?? `Cell ${active.row + 1},${active.col + 1}`}
                </SheetTitle>
                <SheetDescription>
                  Row {active.row + 1}, Column {active.col + 1}
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
                      <SelectValue placeholder="Pick a room…" />
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
                    Status
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {(Object.keys(STATUS_LABEL) as GridCell["status"][]).map((st) => {
                      const cur = activeCell?.status ?? "unknown";
                      return (
                        <button
                          key={st}
                          onClick={() =>
                            upsertCell({ row: active.row, col: active.col, status: st })
                          }
                          className={`rounded border px-2 py-1 text-xs ${
                            cur === st
                              ? STATUS_COLOR[st]
                              : "border-border text-muted-foreground hover:bg-accent"
                          }`}
                        >
                          {STATUS_LABEL[st]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Cell comment
                  </label>
                  <Textarea
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                    onBlur={() =>
                      upsertCell({
                        row: active.row,
                        col: active.col,
                        comment: commentDraft,
                      })
                    }
                    placeholder="Quick note about this cell — door direction, gem cost, danger…"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  {activeRoom && (
                    <>
                      <Button
                        size="sm"
                        className="flex-1 bg-brass text-brass-foreground hover:bg-brass/90"
                        onClick={() => openCapture({ kind: "note", room: activeRoom })}
                      >
                        + Note
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => openCapture({ kind: "todo", room: activeRoom })}
                      >
                        + Todo
                      </Button>
                    </>
                  )}
                </div>

                <div className="flex gap-2 border-t border-border pt-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground"
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
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      clearCell(active.row, active.col);
                      setActive(null);
                    }}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Clear cell
                  </Button>
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
                            <Badge variant="secondary" className="text-[10px]">
                              {n.type}
                            </Badge>
                            {n.tags.map((t) => (
                              <Badge key={t} variant="outline" className="text-[10px]">
                                #{t}
                              </Badge>
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
                      Todos in this room
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
