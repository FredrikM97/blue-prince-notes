import type { Note } from "@/lib/types";
import { useState } from "react";
import { useStore } from "@/frontend/data/store";
import { NoteRowSummary } from "@/frontend/components/note-row/NoteRowSummary";
import { NoteRowEditor } from "@/frontend/components/note-row/NoteRowEditor";
import { NoteRowDetails } from "@/frontend/components/note-row/NoteRowDetails";

export function NoteRow({ note }: { note: Note }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note);
  const save = useStore((s) => s.saveNote);
  const remove = useStore((s) => s.removeNote);

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
        <NoteRowSummary note={note} open={open} />
      </div>

      {open && (
        <div className="space-y-3 border-t border-border bg-background/50 px-4 py-3">
          {editing ? (
            <NoteRowEditor
              draft={draft}
              setDraft={setDraft}
              onSave={async () => {
                await save(draft);
                setEditing(false);
              }}
              onCancel={() => {
                setDraft(note);
                setEditing(false);
              }}
            />
          ) : (
            <NoteRowDetails
              note={note}
              onEdit={() => setEditing(true)}
              onDelete={() => {
                if (confirm("Delete this note?")) remove(note.id);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
