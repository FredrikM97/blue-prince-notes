import type { Note } from "@/lib/types";
import { ChevronDown, ChevronRight, Lightbulb } from "lucide-react";
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
  open,
}: {
  note: Note;
  open: boolean;
}) {
  const Icon = TYPE_ICON[note.type] ?? Lightbulb;

  return (
    <>
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-brass/15 text-brass">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {TYPE_LABEL[note.type]}
          </span>
          <h3 className="truncate font-serif text-base font-medium leading-tight">{note.title}</h3>
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">{relTime(note.updatedAt)}</span>
        </div>
        {note.body && !open && <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{note.body}</p>}
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {note.room && <Pill className="border-brass/40 text-brass">@{note.room}</Pill>}
          {note.tags.map((t) => (
            <Pill key={t} className="border-border bg-secondary text-foreground">#{t}</Pill>
          ))}
          {note.status === "solved" && (
            <Pill className="border-green-700/40 bg-green-700/30 text-green-200">solved</Pill>
          )}
          {note.imageIds.length > 0 && <span className="text-xs text-muted-foreground">📎 {note.imageIds.length}</span>}
        </div>
      </div>
      <span className="mt-1 text-muted-foreground opacity-0 group-hover:opacity-100">
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </span>
    </>
  );
}
