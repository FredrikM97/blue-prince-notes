import { memo } from "react";
import type { Note } from "@/lib/types";
import { Lightbulb } from "lucide-react";
import { TYPE_ICON, TYPE_LABEL, relTime } from "@/lib/noteMetadata";

const TYPE_ICON_CLASS: Record<Note["type"], string> = {
  clue: "note-summary-icon-clue",
  code: "note-summary-icon-code",
  observation: "note-summary-icon-observation",
  theory: "note-summary-icon-theory",
  story: "note-summary-icon-story",
  task: "note-summary-icon-task",
};

function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={`note-pill ${className ?? ""}`}>{children}</span>;
}

export const NotesListItemSummary = memo(function NotesListItemSummary({ note }: { note: Note }) {
  const Icon = TYPE_ICON[note.type] ?? Lightbulb;

  return (
    <div className="note-summary-wrap">
      <span
        className={`note-summary-icon ${TYPE_ICON_CLASS[note.type]}`}
        title={`Type: ${TYPE_LABEL[note.type]}`}
      >
        <Icon
          className="note-summary-icon-svg group-hover:scale-110"
          aria-label={`Type: ${TYPE_LABEL[note.type]}`}
        />
      </span>
      <div className="note-summary-body">
        <h3 className="note-summary-title">{note.title}</h3>
        <div className="note-summary-meta">
          <span className="note-summary-time">{relTime(note.updatedAt)}</span>
          <div className="note-summary-pills">
            {note.room && <Pill className="note-pill-room">@{note.room}</Pill>}
            {note.tags.map((t) => (
              <Pill key={t} className="note-pill-tag">
                #{t}
              </Pill>
            ))}
            {note.date && <Pill className="note-pill-date">{note.date}</Pill>}
            {note.status === "solved" && <Pill className="note-pill-solved">solved</Pill>}
            {note.imageIds.length > 0 && (
              <span className="note-summary-image-count" title="This note has attached images">
                📎 {note.imageIds.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
