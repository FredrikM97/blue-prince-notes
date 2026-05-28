import { memo } from "react";
import type { Note } from "@/lib/types";
import { BrassButton } from "@/components/common/button";
import { IconButton } from "@/components/common/button";
import { NotesListItemSummary } from "./NotesListItemSummary";
import { ChevronRight, Pencil, Trash2 } from "lucide-react";

export function NotesView({
  emptyHint,
  filtered,
  openCapture,
  onOpenEdit,
  onOpenPreview,
  onDelete,
}: {
  emptyHint?: string;
  filtered: Note[];
  openCapture: () => void;
  onOpenEdit: (note: Note) => void;
  onOpenPreview: (note: Note) => void;
  onDelete: (note: Note) => void;
}) {
  return (
    <section className="notes-view-section">
      {filtered.length === 0 ? (
        <div className="notes-view-empty">
          <p className="text-sm text-muted-foreground">
            {emptyHint ?? "No notes yet. Press N to add one."}
          </p>
          <BrassButton className="mt-4" onClick={openCapture}>
            Add your first note
          </BrassButton>
        </div>
      ) : (
        <div className="notes-view-list">
          {filtered.map((n) => (
            <NotesListRow
              key={n.id}
              note={n}
              onOpenEdit={onOpenEdit}
              onOpenPreview={onOpenPreview}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}

const NotesListRow = memo(function NotesListRow({
  note,
  onOpenEdit,
  onOpenPreview,
  onDelete,
}: {
  note: Note;
  onOpenEdit: (note: Note) => void;
  onOpenPreview: (note: Note) => void;
  onDelete: (note: Note) => void;
}) {
  return (
    <div className="note-row-item">
      <div className="note-row-inner group">
        <button
          type="button"
          className="note-row-preview-btn"
          onClick={(e) => {
            e.stopPropagation();
            onOpenPreview(note);
          }}
        >
          <NotesListItemSummary note={note} />
        </button>
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            onOpenEdit(note);
          }}
          aria-label="Edit note"
        >
          <Pencil className="h-4 w-4" />
        </IconButton>
        <IconButton
          className="text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note);
          }}
          aria-label="Delete note"
        >
          <Trash2 className="h-4 w-4" />
        </IconButton>
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            onOpenPreview(note);
          }}
          aria-label="Preview note"
        >
          <ChevronRight className="h-4 w-4" />
        </IconButton>
      </div>
    </div>
  );
});
