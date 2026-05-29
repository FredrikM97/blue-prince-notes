import { useMemo, useState } from "react";
import { PageLayout } from "@/components/common/PageLayout";
import { MapLeftPanel } from "./MapLeftPanel";
import { MapMiddlePanel } from "./MapMiddlePanel";
import { MapRightPanel } from "./MapRightPanel";
import { GRID_COLS, GRID_ROWS, cellId } from "@/data/rooms";
import { useStore } from "@/data/store";
import type { GridCell } from "@/lib/types";

const COL_LABELS = ["A", "B", "C", "D", "E"] as const;

function coordLabel(row: number, col: number) {
  return `${COL_LABELS[col] ?? String(col + 1)}${GRID_ROWS - row}`;
}

const STATUS_COLOR: Record<GridCell["status"], string> = {
  unknown: "map-cell-neutral",
  drafted: "map-cell-neutral",
  explored: "map-cell-neutral",
  cleared: "map-cell-cleared",
};

type ActiveCellCoord = { row: number; col: number };

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

  const rightSidebar = active ? (
    <MapRightPanel
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
  ) : (
    <div className="page-layout-panel text-muted-foreground">
      Select a map cell to edit room details, notes, and todos.
    </div>
  );

  return (
    <PageLayout
      leftSidebar={<MapLeftPanel />}
      rightSidebar={rightSidebar}
      middle={
        <MapMiddlePanel
          byId={byId}
          noteCountByRoom={noteCountByRoom}
          statusColor={STATUS_COLOR}
          coordLabel={coordLabel}
          onOpenCell={openCell}
        />
      }
    >
      {/* middle content is provided via the `middle` prop */}
    </PageLayout>
  );
}
