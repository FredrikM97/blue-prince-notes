import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/frontend/data/store";
import type { Note, NoteType } from "@/lib/types";
import { NoteRow } from "./NoteRow";
import { buttonClass } from "@/frontend/components/common/buttonClasses";
import { NoteRowEditor } from "@/frontend/components/note-row/NoteRowEditor";
import { NoteRowDetails } from "@/frontend/components/note-row/NoteRowDetails";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/frontend/components/ui/dialog";

const TYPE_OPTIONS: { value: NoteType; label: string }[] = [
  { value: "observation", label: "Observations" },
  { value: "clue", label: "Clues" },
  { value: "code", label: "Codes" },
  { value: "theory", label: "Theories" },
  { value: "book", label: "Books" },
];

export function NotesView({
  filterType,
  title,
  emptyHint,
}: {
  filterType?: NoteType;
  title: string;
  emptyHint?: string;
}) {
  const notes = useStore((s) => s.notes);
  const search = useStore((s) => s.search);
  const openCapture = useStore((s) => s.openCapture);
  const captureOpen = useStore((s) => s.captureOpen);
  const saveNote = useStore((s) => s.saveNote);
  const removeNote = useStore((s) => s.removeNote);
  const [typeFilter, setTypeFilter] = useState<NoteType | null>(null);
  const [roomFilter, setRoomFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"open" | "solved" | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [panelMode, setPanelMode] = useState<"edit" | "preview">("edit");
  const [draft, setDraft] = useState<Note | null>(null);

  const effectiveType = filterType ?? typeFilter;

  const rooms = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => n.room && set.add(n.room));
    return Array.from(set).sort();
  }, [notes]);
  const tags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [notes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notes.filter((n) => {
      if (effectiveType && n.type !== effectiveType) return false;
      if (roomFilter && n.room !== roomFilter) return false;
      if (tagFilter && !n.tags.includes(tagFilter)) return false;
      if (statusFilter && n.status !== statusFilter) return false;
      if (q) {
        const hay = `${n.title} ${n.body} ${n.tags.join(" ")} ${n.room ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [notes, effectiveType, roomFilter, tagFilter, statusFilter, search]);

  const activeNote = useMemo(
    () => notes.find((n) => n.id === activeNoteId) ?? null,
    [notes, activeNoteId],
  );

  useEffect(() => {
    if (activeNote) setDraft(activeNote);
  }, [activeNote]);

  const notePanelOpen = !!activeNote;

  return (
    <div
      className={`mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[220px_1fr] ${
        captureOpen || notePanelOpen ? "sm:pr-[32rem] lg:pr-[34rem]" : ""
      }`}
    >
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        {!filterType && (
          <FilterGroup
            label="Type"
            options={TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            value={typeFilter}
            onChange={(v) => setTypeFilter(v as NoteType | null)}
          />
        )}
        <FilterGroup
          label="Status"
          options={[
            { value: "open", label: "Open" },
            { value: "solved", label: "Solved" },
          ]}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as "open" | "solved" | null)}
        />
        {rooms.length > 0 && (
          <FilterGroup
            label="Room"
            options={rooms.map((r) => ({ value: r, label: r }))}
            value={roomFilter}
            onChange={setRoomFilter}
          />
        )}
        {tags.length > 0 && (
          <FilterGroup
            label="Tag"
            options={tags.map((t) => ({ value: t, label: `#${t}` }))}
            value={tagFilter}
            onChange={setTagFilter}
          />
        )}
      </aside>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h1 className="font-serif text-2xl">{title}</h1>
          <span className="text-sm text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
          </span>
        </div>
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">
              {emptyHint ?? "No notes yet. Press N to add one."}
            </p>
            <button
              className={buttonClass({ className: "mt-4 bg-brass text-brass-foreground hover:bg-brass/90" })}
              onClick={() => openCapture()}
            >
              Add your first note
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            {filtered.map((n) => (
              <NoteRow
                key={n.id}
                note={n}
                onOpenEdit={() => {
                  setPanelMode("edit");
                  setActiveNoteId(n.id);
                  setDraft(n);
                }}
                onDelete={async () => {
                  if (!confirm("Delete this note?")) return;
                  await removeNote(n.id);
                  if (activeNoteId === n.id) setActiveNoteId(null);
                }}
                onOpenPreview={() => {
                  setPanelMode("preview");
                  setActiveNoteId(n.id);
                  setDraft(n);
                }}
              />
            ))}
          </div>
        )}
      </section>

      <Dialog modal={false} open={notePanelOpen} onOpenChange={(o) => !o && setActiveNoteId(null)}>
        <DialogContent
          hideOverlay
          onInteractOutside={(e) => e.preventDefault()}
          className="left-auto right-0 top-0 h-dvh w-full max-w-none translate-x-0 translate-y-0 gap-3 overflow-y-auto rounded-none border-l p-4 sm:w-[32rem] lg:w-[34rem] sm:rounded-none sm:p-6 flex flex-col"
        >
          {activeNote && (
            <>
              <DialogHeader className="shrink-0 space-y-0">
                {panelMode === "edit" ? (
                  <DialogTitle className="font-serif text-lg">Edit note</DialogTitle>
                ) : (
                  <>
                    <DialogTitle className="font-serif text-xl">{activeNote.title}</DialogTitle>
                    <DialogDescription>Note preview</DialogDescription>
                  </>
                )}
              </DialogHeader>

              <div className="min-h-0">
                {panelMode === "edit" ? (
                  <NoteRowEditor
                    draft={draft ?? activeNote}
                    setDraft={setDraft}
                    onSave={async () => {
                      if (!draft && !activeNote) return;
                      await saveNote(draft ?? activeNote);
                      setPanelMode("preview");
                    }}
                    onCancel={() => {
                      if (activeNote) setDraft(activeNote);
                      setActiveNoteId(null);
                    }}
                  />
                ) : (
                  <div className="flex min-h-[24rem] flex-col">
                    <div className="min-h-[18rem] flex-1 overflow-y-auto pr-1">
                      <NoteRowDetails note={activeNote} />
                    </div>
                    <div className="mt-3 flex justify-start border-t border-border pt-2">
                      <button
                        className={buttonClass({ size: "sm", variant: "ghost" })}
                        onClick={() => setActiveNoteId(null)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => onChange(null)}
          className={`rounded px-2 py-0.5 text-xs ${
            value === null ? "bg-brass text-brass-foreground" : "text-muted-foreground hover:bg-accent"
          }`}
        >
          All
        </button>
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(value === o.value ? null : o.value)}
            className={`rounded px-2 py-0.5 text-xs ${
              value === o.value
                ? "bg-brass text-brass-foreground"
                : "text-muted-foreground hover:bg-accent"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
