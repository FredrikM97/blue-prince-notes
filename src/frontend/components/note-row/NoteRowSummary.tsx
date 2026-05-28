import type { Note } from "@/lib/types";
import { Lightbulb } from "lucide-react";
import { TYPE_ICON, TYPE_LABEL, relTime } from "./constants";

function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`note-pill ${className ?? ""}`}>{children}</span>
  );
}

export function NoteRowSummary({
  note,
}: {
  note: Note;
}) {
  const Icon = TYPE_ICON[note.type] ?? Lightbulb;
  const hasImages = note.imageIds.length > 0;

  return (
    <div className="note-summary-wrap">
      <span className="note-summary-icon">
        <Icon
          className="note-summary-icon-svg group-hover:scale-110"
          title={TYPE_LABEL[note.type]}
          aria-label={`Type: ${TYPE_LABEL[note.type]}`}
        />
      </span>
      <div className="note-summary-body">
        <div className="note-summary-title-row">
          <h3 className="note-summary-title">{note.title}</h3>
          <span className="note-summary-time">{relTime(note.updatedAt)}</span>
        </div>
        <div className="note-summary-pills">
          {!hasImages && note.room && <Pill className="note-pill-room">@{note.room}</Pill>}
          {!hasImages &&
            note.tags.map((t) => (
              <Pill key={t} className="note-pill-tag">#{t}</Pill>
            ))}
          {note.status === "solved" && <Pill className="note-pill-solved">solved</Pill>}
          {hasImages && <span className="text-xs text-muted-foreground">📎 {note.imageIds.length}</span>}
        </div>
      </div>
    </div>
  );
}
