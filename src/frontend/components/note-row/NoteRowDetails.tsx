import type { Note } from "@/lib/types";
import { buttonClass } from "@/frontend/components/common/buttonClasses";
import { StoredImageView } from "@/frontend/components/StoredImageView";
import { Trash2 } from "lucide-react";

export function NoteRowDetails({
  note,
  onEdit,
  onDelete,
}: {
  note: Note;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      {note.body && <p className="whitespace-pre-wrap text-sm leading-relaxed">{note.body}</p>}
      {note.imageIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {note.imageIds.map((id) => (
            <StoredImageView
              key={id}
              id={id}
              className="h-24 w-24 rounded border border-border object-cover"
            />
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <button className={buttonClass({ size: "sm", variant: "outline" })} onClick={onEdit}>
          Edit
        </button>
        <button
          className={buttonClass({
            size: "sm",
            variant: "ghost",
            className: "text-destructive hover:text-destructive",
          })}
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}
