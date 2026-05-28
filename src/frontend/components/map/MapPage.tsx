import { useMemo, useState, type ReactNode } from "react";
import { PageLayout } from "@/frontend/components/common/PageLayout";
import { MapPanel } from "./MapPanel";
import { GRID_COLS, GRID_ROWS, cellId } from "@/frontend/data/rooms";
import { useStore } from "@/frontend/data/store";
import type { GridCell } from "@/lib/types";

const COL_LABELS = ["A", "B", "C", "D", "E"] as const;

export function coordLabel(row: number, col: number) {
  return `${COL_LABELS[col] ?? String(col + 1)}${GRID_ROWS - row}`;
}

const STATUS_COLOR: Record<GridCell["status"], string> = {
  unknown: "map-cell-neutral",
  drafted: "map-cell-neutral",
  explored: "map-cell-neutral",
  cleared: "map-cell-cleared",
};

type ActiveCellCoord = { row: number; col: number };

function MapSidebar() {
  return (
    <div className="map-sidebar">
      <h1 className="font-serif text-xl font-semibold">Mt. Holly Map</h1>
      <p className="mt-1 text-xs text-muted-foreground">
        5 × 9 grid — click a cell to place a room and add comments.
      </p>
      <div className="mt-4 space-y-1.5 border-t border-border pt-4">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Legend</p>
        <Legend color={STATUS_COLOR.cleared}>Cleared</Legend>
      </div>
    </div>
  );
}

export function MapPage() {
  const gridCells = useStore((s) => s.gridCells);
  const notes = useStore((s) => s.notes);
  const todos = useStore((s) => s.todos);
  const upsertCell = useStore((s) => s.upsertCell);
  const clearCell = useStore((s) => s.clearCell);
  const openCapture = useStore((s) => s.openCapture);
  const [active, setActive] = useState<ActiveCellCoord | null>(null);

  const byId = useMemo(() => {
    const m = new Map<string, GridCell>();
    gridCells.forEach((c) => m.set(c.id, c));
    return m;
  }, [gridCells]);

  const activeCell = active ? byId.get(cellId(active.row, active.col)) : undefined;
  const activeRoom = activeCell?.roomName;
  const activeNotes = activeRoom ? notes.filter((n) => n.room === activeRoom) : [];
  const activeTodos = activeRoom ? todos.filter((t) => t.room === activeRoom) : [];

  const noteCountByRoom = useMemo(() => {
    const counts = new Map<string, number>();
    for (const note of notes) {
      if (!note.room) continue;
      counts.set(note.room, (counts.get(note.room) ?? 0) + 1);
    }
    return counts;
  }, [notes]);

  const [commentDraft, setCommentDraft] = useState("");

  function openCell(row: number, col: number) {
    setActive({ row, col });
    const c = byId.get(cellId(row, col));
    setCommentDraft(c?.comment ?? "");
  }

  return (
    <PageLayout className="max-w-6xl" sidebar={<MapSidebar />}>
      <div className="map-layout">
        <div className="map-layout-main">
          <MapGrid byId={byId} noteCountByRoom={noteCountByRoom} onOpenCell={openCell} />
        </div>

        {active && (
          <MapPanel
            row={active.row}
            col={active.col}
            coordLabel={coordLabel(active.row, active.col)}
            activeCell={activeCell}
            activeNotes={activeNotes}
            activeTodos={activeTodos}
            commentDraft={commentDraft}
            setCommentDraft={setCommentDraft}
            onClose={() => setActive(null)}
            upsertCell={upsertCell}
            clearCell={clearCell}
            openCapture={openCapture}
          />
        )}
      </div>
    </PageLayout>
  );
}

function MapGrid({
  byId,
  noteCountByRoom,
  onOpenCell,
}: {
  byId: Map<string, GridCell>;
  noteCountByRoom: Map<string, number>;
  onOpenCell: (row: number, col: number) => void;
}) {
  return (
    <div
      className="map-grid"
      style={{
        gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
        maxWidth: `clamp(28rem, calc((100dvh - 8rem) * ${GRID_COLS} / ${GRID_ROWS}), 36rem)`,
      }}
    >
      {Array.from({ length: GRID_ROWS }).flatMap((_, row) =>
        Array.from({ length: GRID_COLS }).map((__, col) => {
          const cell = byId.get(cellId(row, col));
          const status = cell?.status === "cleared" ? "cleared" : "unknown";
          const roomNoteCount = cell?.roomName ? (noteCountByRoom.get(cell.roomName) ?? 0) : 0;
          return (
            <button
              key={`${row},${col}`}
              onClick={() => onOpenCell(row, col)}
              className={`map-cell ${STATUS_COLOR[status]}`}
            >
              {cell?.roomName ? (
                <>
                  <span className="map-cell-room-name">{cell.roomName}</span>
                  {(cell.comment || roomNoteCount > 0) && (
                    <span className="map-cell-meta">
                      {cell.comment && "💬"}
                      {roomNoteCount > 0 && ` 📝${roomNoteCount}`}
                    </span>
                  )}
                </>
              ) : (
                <span className="map-cell-coord">{coordLabel(row, col)}</span>
              )}
            </button>
          );
        }),
      )}
    </div>
  );
}

function Legend({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`h-3 w-3 rounded border ${color}`} />
      {children}
    </span>
  );
}
