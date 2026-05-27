import type { Note } from "@/lib/types";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { StoredImageView } from "./StoredImageView";
import { Trash2, ChevronDown, ChevronRight, Key, Book, Lightbulb, Eye, Sparkles, ListTodo } from "lucide-react";

const TYPE_ICON = {
  clue: Lightbulb,
  code: Key,
  observation: Eye,
  theory: Sparkles,
  book: Book,
  task: ListTodo,
} as const;

const TYPE_LABEL = {
  clue: "Clue",
  code: "Code",
  observation: "Obs.",
  theory: "Theory",
  book: "Book",
  task: "Task",
} as const;

function relTime(ts: number) {
  const d = Date.now() - ts;
  if (d < 60_000) return "just now";
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h`;
  return `${Math.floor(d / 86_400_000)}d`;
}

export function NoteRow({ note }: { note: Note }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note);
  const save = useStore((s) => s.saveNote);
  const remove = useStore((s) => s.removeNote);

  const Icon = TYPE_ICON[note.type] ?? Lightbulb;

  return (
    <div className="border-b border-border last:border-b-0">
      <div
        className="group flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-accent/40"
        onClick={(e) => {
          if (e.shiftKey) {
            setEditing(true);
            setOpen(true);
          } else {
            setOpen((o) => !o);
          }
        }}
      >
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-brass/15 text-brass">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {TYPE_LABEL[note.type]}
            </span>
            <h3 className="truncate font-serif text-base font-medium leading-tight">
              {note.title}
            </h3>
            <span className="ml-auto shrink-0 text-xs text-muted-foreground">
              {relTime(note.updatedAt)}
            </span>
          </div>
          {note.body && !open && (
            <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{note.body}</p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {note.room && (
              <Badge variant="outline" className="border-brass/40 text-brass">
                @{note.room}
              </Badge>
            )}
            {note.tags.map((t) => (
              <Badge key={t} variant="secondary" className="text-[10px]">
                #{t}
              </Badge>
            ))}
            {note.status === "solved" && (
              <Badge className="bg-green-700/30 text-green-200 hover:bg-green-700/30">solved</Badge>
            )}
            {note.imageIds.length > 0 && (
              <span className="text-xs text-muted-foreground">📎 {note.imageIds.length}</span>
            )}
          </div>
        </div>
        <span className="mt-1 text-muted-foreground opacity-0 group-hover:opacity-100">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </span>
      </div>

      {open && (
        <div className="space-y-3 border-t border-border bg-background/50 px-4 py-3">
          {editing ? (
            <div className="space-y-2">
              <Input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="Title"
              />
              <Textarea
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                placeholder="Details…"
                rows={4}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={draft.room ?? ""}
                  onChange={(e) => setDraft({ ...draft, room: e.target.value || undefined })}
                  placeholder="Room"
                />
                <Input
                  value={draft.tags.join(" ")}
                  onChange={(e) =>
                    setDraft({ ...draft, tags: e.target.value.split(/\s+/).filter(Boolean) })
                  }
                  placeholder="tags (space-sep)"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  value={draft.type}
                  onChange={(e) => setDraft({ ...draft, type: e.target.value as Note["type"] })}
                >
                  {Object.keys(TYPE_LABEL).map((k) => (
                    <option key={k} value={k}>
                      {TYPE_LABEL[k as keyof typeof TYPE_LABEL]}
                    </option>
                  ))}
                </select>
                <select
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  value={draft.status}
                  onChange={(e) => setDraft({ ...draft, status: e.target.value as Note["status"] })}
                >
                  <option value="open">open</option>
                  <option value="solved">solved</option>
                  <option value="stale">stale</option>
                </select>
                <select
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  value={draft.scope}
                  onChange={(e) => setDraft({ ...draft, scope: e.target.value as Note["scope"] })}
                >
                  <option value="cross-run">cross-run</option>
                  <option value="this-run">this-run</option>
                </select>
                <Button
                  size="sm"
                  className="ml-auto bg-brass text-brass-foreground hover:bg-brass/90"
                  onClick={async () => {
                    await save(draft);
                    setEditing(false);
                  }}
                >
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setDraft(note); setEditing(false); }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              {note.body && (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{note.body}</p>
              )}
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
                <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    if (confirm("Delete this note?")) remove(note.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
