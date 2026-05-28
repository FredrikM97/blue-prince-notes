import { BrassButton, Button, GhostButton, IconButton } from "@/frontend/components/common/button";
import { Chip } from "@/frontend/components/common/Chip";
import { MarkdownPreview } from "@/frontend/components/common/MarkdownPreview";
import { RoomDropdown } from "@/frontend/components/common/RoomDropdown";
import { TEXTAREA_BASE_CLASS } from "@/frontend/components/common/formClasses";
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
  openCapture: (opts?: { kind?: "note" | "todo"; prefill?: string; room?: string }) => void;
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
  const activeRoom = activeCell?.roomName;

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
          <label className="map-field-label">Cell details</label>
          <textarea
            value={commentDraft}
            onChange={(e) => setCommentDraft(e.target.value)}
            onBlur={() => upsertCell({ row, col, comment: commentDraft })}
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
              <MarkdownPreview>{commentDraft}</MarkdownPreview>
            </div>
          )}
        </div>

        {activeRoom && (
          <div className="map-sheet-action-row">
            <BrassButton
              size="sm"
              className="flex-1"
              onClick={() => openCapture({ kind: "note", room: activeRoom })}
            >
              + Note (image)
            </BrassButton>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => openCapture({ kind: "todo", room: activeRoom })}
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

        {activeNotes.length > 0 && <MapRoomNotes notes={activeNotes} />}
        {activeTodos.length > 0 && <MapRoomTodos todos={activeTodos} />}
      </div>
    </div>
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
              {note.imageIds.length > 0 && (
                <Chip className="map-note-chip">📎 {note.imageIds.length}</Chip>
              )}
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
