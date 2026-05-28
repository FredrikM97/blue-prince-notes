import { useMemo, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
import type { GridCell, Note, Todo } from "@/lib/types";
import { Trash2, Eraser } from "lucide-react";

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

  return (
    <div className="map-page">
      <div className="map-page-header">
        <div>
          <h1 className="map-page-title">Mt. Holly Map</h1>
          <p className="map-page-subtitle">
            5 × 9 grid — click a cell to place a room and add comments.
          </p>
        </div>
        <div className="map-page-legend-wrap">
          <Legend color={STATUS_COLOR.cleared}>Cleared</Legend>
        </div>
      </div>

      <MapGrid byId={byId} noteCountByRoom={noteCountByRoom} onOpenCell={openCell} />

      <MapCellEditorSheet
        active={active}
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
    </div>
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
        width: `min(100%, clamp(28rem, calc((100dvh - 8rem) * ${GRID_COLS} / ${GRID_ROWS}), 36rem))`,
      }}
    >
      {Array.from({ length: GRID_ROWS }).flatMap((_, row) =>
        Array.from({ length: GRID_COLS }).map((__, col) => {
          const cell = byId.get(cellId(row, col));
          const status = cell?.status === "cleared" ? "cleared" : "unknown";
          const roomNoteCount = cell?.roomName ? (noteCountByRoom.get(cell.roomName) ?? 0) : 0;
          return (
            <MapGridCellButton
              key={`${row},${col}`}
              row={row}
              col={col}
              cell={cell}
              roomNoteCount={roomNoteCount}
              statusClass={STATUS_COLOR[status]}
              onOpenCell={onOpenCell}
            />
          );
        }),
      )}
    </div>
  );
}

function MapGridCellButton({
  row,
  col,
  cell,
  roomNoteCount,
  statusClass,
  onOpenCell,
}: {
  row: number;
  col: number;
  cell: GridCell | undefined;
  roomNoteCount: number;
  statusClass: string;
  onOpenCell: (row: number, col: number) => void;
}) {
  return (
    <button onClick={() => onOpenCell(row, col)} className={`map-cell ${statusClass}`}>
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
}

function MapCellEditorSheet({
  active,
  activeCell,
  activeNotes,
  activeTodos,
  commentDraft,
  setCommentDraft,
  onClose,
  upsertCell,
  clearCell,
  openCapture,
}: {
  active: ActiveCellCoord | null;
  activeCell: GridCell | undefined;
  activeNotes: Note[];
  activeTodos: Todo[];
  commentDraft: string;
  setCommentDraft: (next: string) => void;
  onClose: () => void;
  upsertCell: (cell: Partial<GridCell> & { row: number; col: number }) => Promise<void>;
  clearCell: (row: number, col: number) => Promise<void>;
  openCapture: (opts?: { kind?: "note" | "todo"; prefill?: string; room?: string }) => void;
}) {
  const activeRoom = activeCell?.roomName;

  return (
    <Sheet open={!!active} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="map-sheet-content">
        {active && (
          <>
            <SheetHeader>
              <SheetTitle className="map-sheet-title">
                {activeCell?.roomName ?? `Cell ${coordLabel(active.row, active.col)}`}
              </SheetTitle>
              <SheetDescription>Coordinate {coordLabel(active.row, active.col)}</SheetDescription>
            </SheetHeader>

            <div className="map-sheet-body">
              <div>
                <label className="map-field-label">Room</label>
                <Select
                  value={activeCell?.roomName ?? ""}
                  onValueChange={(name) => upsertCell({ row: active.row, col: active.col, roomName: name })}
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
                <label className="map-field-label">Cell details</label>
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
                  placeholder="Quick note about this cell - door direction, gem cost, danger..."
                  rows={6}
                  className={TEXTAREA_BASE_CLASS}
                />
                <p className="map-comment-help">
                  Markdown supported: headings, lists, checkboxes, bold, italic, code.
                </p>

                {commentDraft.trim().length > 0 && (
                  <div className="map-comment-preview-card">
                    <div className="map-comment-preview-title">Preview</div>
                    <div className="capture-preview-markdown">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{commentDraft}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>

              {activeRoom && (
                <div className="map-sheet-action-row">
                  <button
                    className={buttonClass({
                      size: "sm",
                      className: "map-sheet-action-primary",
                    })}
                    onClick={() => openCapture({ kind: "note", room: activeRoom })}
                  >
                    + Note (image)
                  </button>
                  <button
                    className={buttonClass({
                      size: "sm",
                      variant: "outline",
                      className: "map-sheet-action-secondary",
                    })}
                    onClick={() => openCapture({ kind: "todo", room: activeRoom })}
                  >
                    + Todo
                  </button>
                </div>
              )}

              <div className="map-sheet-clear-row">
                <button
                  className={buttonClass({
                    size: "sm",
                    variant: "ghost",
                    className: "map-sheet-clear-comment",
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
                  <Eraser className="map-sheet-clear-icon" /> Clear comment
                </button>
                <button
                  className={buttonClass({
                    size: "sm",
                    variant: "ghost",
                    className: "map-sheet-clear-cell",
                  })}
                  onClick={() => {
                    clearCell(active.row, active.col);
                    onClose();
                  }}
                >
                  <Trash2 className="map-sheet-clear-icon" /> Clear cell
                </button>
              </div>

              {activeNotes.length > 0 && <MapRoomNotes notes={activeNotes} />}

              {activeTodos.length > 0 && <MapRoomTodos todos={activeTodos} />}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function MapRoomNotes({ notes }: { notes: Note[] }) {
  return (
    <div>
      <div className="map-list-title">Notes in this room</div>
      <ul className="map-note-list">
        {notes.map((note) => (
          <li key={note.id} className="map-note-item">
            <div className="map-note-item-title">{note.title}</div>
            <div className="map-note-chip-row">
              <Chip className="map-note-chip">{note.type}</Chip>
              {note.imageIds.length > 0 && <Chip className="map-note-chip">📎 {note.imageIds.length}</Chip>}
              {note.tags.map((tag) => (
                <Chip key={tag} className="map-note-chip">
                  #{tag}
                </Chip>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MapRoomTodos({ todos }: { todos: Todo[] }) {
  return (
    <div>
      <div className="map-list-title">Todo items in this room</div>
      <ul className="map-todo-list">
        {todos.map((todo) => (
          <li key={todo.id} className={todo.status === "done" ? "map-todo-done" : ""}>
            · {todo.title}
          </li>
        ))}
      </ul>
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
