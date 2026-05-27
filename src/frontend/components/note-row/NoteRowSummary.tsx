import type { Note } from "@/lib/types";
import { Lightbulb } from "lucide-react";
import { TYPE_ICON, TYPE_LABEL, relTime } from "./constants";

function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] ${className ?? ""}`}>
      {children}
    </span>
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
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-brass/15 text-brass">
        <Icon
          className="h-4 w-4 transition-transform group-hover:scale-110"
          title={TYPE_LABEL[note.type]}
          aria-label={`Type: ${TYPE_LABEL[note.type]}`}
        />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <h3 className="min-w-0 flex-1 truncate font-serif text-base font-medium leading-tight">
            {note.title}
          </h3>
          <span className="shrink-0 whitespace-nowrap pt-0.5 text-[11px] text-muted-foreground">
            {relTime(note.updatedAt)}
          </span>
        </div>
        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5">
          {!hasImages && note.room && <Pill className="border-brass/40 text-brass">@{note.room}</Pill>}
          {!hasImages && note.tags.map((t) => (
            <Pill key={t} className="border-border bg-secondary text-foreground">#{t}</Pill>
          ))}
          {note.status === "solved" && (
            <Pill className="border-green-700/40 bg-green-700/30 text-green-200">solved</Pill>
          )}
          {hasImages && <span className="text-xs text-muted-foreground">📎 {note.imageIds.length}</span>}
        </div>
      </div>
    </div>
  );
}
