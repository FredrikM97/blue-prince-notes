import type { Note } from "@/lib/types";
import { NoteRowSummary } from "@/frontend/components/note-row/NoteRowSummary";
import { IconButton } from "@/frontend/components/common/button";
import { ChevronRight, Pencil, Trash2 } from "lucide-react";

export function NotesRow({
  note,
  onOpenEdit,
  onDelete,
  onOpenPreview,
}: {
  note: Note;
  onOpenEdit: () => void;
  onDelete: () => void;
  onOpenPreview: () => void;
}) {
  return (
    <div className="note-row-item">
      <div className="note-row-inner group">
        <button
          type="button"
          className="note-row-preview-btn"
          onClick={(e) => {
            e.stopPropagation();
            onOpenPreview();
          }}
        >
          <NoteRowSummary note={note} />
        </button>
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            onOpenEdit();
          }}
          aria-label="Edit note"
        >
          <Pencil className="h-4 w-4" />
        </IconButton>
        <IconButton
          className="text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Delete note"
        >
          <Trash2 className="h-4 w-4" />
        </IconButton>
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            onOpenPreview();
          }}
          aria-label="Preview note"
        >
          <ChevronRight className="h-4 w-4" />
        </IconButton>
      </div>
    </div>
  );
}
