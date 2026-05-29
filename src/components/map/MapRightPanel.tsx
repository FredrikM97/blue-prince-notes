import { BrassButton, Button, GhostButton, IconButton } from "@/components/common/Button";
import { useNavigate } from "@tanstack/react-router";
import { PagedNotesList } from "@/components/common/PagedNotesList";
import { RoomDropdown } from "@/components/common/dropdown/RoomDropdown";
import { DetailsField } from "@/components/common/input/DetailsField";
import { SuggestionsDropdown } from "@/components/common/dropdown/SuggestionsDropdown";
import { Eraser, Trash2, X } from "lucide-react";
import type { GridCell, Note, Todo } from "@/lib/types";

export interface MapRightPanelProps {
  coordLabel: string;
  activeCell: GridCell | undefined;
  activeNotes: Note[];
  activeTodos: Todo[];
  commentDraft: string;
  setCommentDraft: (next: string) => void;
  onClose: () => void;
  upsertCell: (cell: Partial<GridCell> & { row: number; col: number }) => Promise<void>;
  clearCell: (row: number, col: number) => Promise<void>;
  openCapture: (opts?: {
    kind?: "note" | "todo";
    prefill?: string;
    room?: string;
    returnTo?: string;
  }) => void;
  row: number;
  col: number;
}

export function MapRightPanel({
  coordLabel,
  activeCell,
  activeNotes,
  activeTodos,
  commentDraft,
  setCommentDraft,
  onClose,
  upsertCell,
  clearCell,
  openCapture,
  row,
  col,
}: MapRightPanelProps) {
  const navigate = useNavigate();
  const activeRoom = activeCell?.roomName;

  async function openCaptureFromMap(kind: "note" | "todo") {
    if (!activeRoom) return;
    await navigate({ to: "/" });
    openCapture({ kind, room: activeRoom, returnTo: "/section/map" });
  }

  return (
    <div className="map-panel">
      <div className="map-panel-header">
        <div>
          <h2 className="map-sheet-title">{activeCell?.roomName ?? `Cell ${coordLabel}`}</h2>
        </div>
        <IconButton onClick={onClose} aria-label="Close panel">
          <X />
        </IconButton>
      </div>

      <div className="map-sheet-body">
        <div>
          <label className="map-field-label">Room</label>
          <RoomDropdown
            value={activeRoom}
            onValueChange={(roomName) => {
              void upsertCell({ row, col, roomName: roomName || undefined });
            }}
          />
        </div>

        <div>
          <SuggestionsDropdown>
            <DetailsField
              value={commentDraft}
              onChange={setCommentDraft}
              onBlur={() => upsertCell({ row, col, comment: commentDraft })}
              label="Cell details"
              showOptionalHint={false}
              rows={6}
              showShortcutToggle={false}
              placeholder="Quick note about this cell - door direction, gem cost, danger..."
            />
          </SuggestionsDropdown>
          <p className="map-comment-help">
            Markdown supported: headings, lists, checkboxes, bold, italic, code.
          </p>
        </div>

        {activeRoom && (
          <div className="map-sheet-action-row">
            <BrassButton
              size="sm"
              className="flex-1"
              onClick={() => {
                void openCaptureFromMap("note");
              }}
            >
              + Note (image)
            </BrassButton>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                void openCaptureFromMap("todo");
              }}
            >
              + Todo
            </Button>
          </div>
        )}

        <div className="map-sheet-clear-row">
          <GhostButton
            className="text-muted-foreground"
            onClick={() => {
              setCommentDraft("");
              upsertCell({ row, col, comment: "" });
            }}
          >
            <Eraser /> Clear comment
          </GhostButton>
          <GhostButton
            className="text-destructive hover:text-destructive"
            onClick={() => {
              clearCell(row, col);
              onClose();
            }}
          >
            <Trash2 /> Clear cell
          </GhostButton>
        </div>

        {activeNotes.length > 0 && (
          <PagedNotesList
            key={`${row}-${col}`}
            notes={activeNotes}
            title="Notes in this room"
          />
        )}
        {activeTodos.length > 0 && <MapRoomTodos todos={activeTodos} />}
      </div>
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
