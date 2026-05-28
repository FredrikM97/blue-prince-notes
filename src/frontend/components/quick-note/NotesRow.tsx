import type { Note } from "@/lib/types";
import { NoteRowSummary } from "@/frontend/components/note-row/NoteRowSummary";
import { buttonClass } from "@/frontend/components/common/buttonClasses";
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
        <button
          type="button"
          className={buttonClass({ size: "icon", variant: "ghost", className: "shrink-0" })}
          onClick={(e) => {
            e.stopPropagation();
            onOpenEdit();
          }}
          aria-label="Edit note"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={buttonClass({
            size: "icon",
            variant: "ghost",
            className: "shrink-0 text-destructive hover:text-destructive",
          })}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Delete note"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={buttonClass({ size: "icon", variant: "ghost", className: "shrink-0" })}
          onClick={(e) => {
            e.stopPropagation();
            onOpenPreview();
          }}
          aria-label="Preview note"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
