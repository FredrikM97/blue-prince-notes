import type { Note } from "@/lib/types";
import { NoteRowSummary } from "@/frontend/components/note-row/NoteRowSummary";
import { buttonClass } from "@/frontend/components/common/buttonClasses";
import { ChevronRight, Pencil, Trash2 } from "lucide-react";

export function NoteRow({
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
    <div className="border-b border-border last:border-b-0">
      <div
        className="group flex items-start gap-3 px-4 py-3 hover:bg-accent/40"
      >
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
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
