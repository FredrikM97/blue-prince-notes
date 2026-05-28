import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/frontend/data/store";
import type { Note, NoteType } from "@/lib/types";
import { NotesRow } from "./NotesRow";
import { BrassButton, GhostButton } from "@/frontend/components/ui/button";
import { NoteRowEditor } from "@/frontend/components/note-row/NoteRowEditor";
import { NoteRowDetails } from "@/frontend/components/note-row/NoteRowDetails";
import { DialogDescription, DialogHeader, DialogTitle } from "@/frontend/components/ui/dialog";
import { SidebarPanel } from "@/frontend/components/ui/sidebar-panel";

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

  const setEditorDraft: React.Dispatch<React.SetStateAction<Note>> = (next) => {
    setDraft((prev) => {
      const base = prev ?? activeNote;
      if (!base) return prev;
      return typeof next === "function" ? next(base) : next;
    });
  };

  const notePanelOpen = !!activeNote;

  return (
    <div className="notes-view">
      <NotesFiltersPanel
        filterType={filterType}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        roomFilter={roomFilter}
        setRoomFilter={setRoomFilter}
        tagFilter={tagFilter}
        setTagFilter={setTagFilter}
        rooms={rooms}
        tags={tags}
      />

      <section className="notes-view-section">
        <div className="notes-view-header">
          <h1 className="font-serif text-2xl">{title}</h1>
          <span className="text-sm text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
          </span>
        </div>
        {filtered.length === 0 ? (
          <div className="notes-view-empty">
            <p className="text-sm text-muted-foreground">
              {emptyHint ?? "No notes yet. Press N to add one."}
            </p>
            <BrassButton className="mt-4" onClick={() => openCapture()}>
              Add your first note
            </BrassButton>
          </div>
        ) : (
          <div className="notes-view-list">
            {filtered.map((n) => (
              <NotesRow
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

      <SidebarPanel
        open={notePanelOpen}
        onClose={() => setActiveNoteId(null)}
        className="notes-view-panel"
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
                  setDraft={setEditorDraft}
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
                <>
                  <div className="notes-panel-preview-scroll">
                    <NoteRowDetails note={activeNote} />
                  </div>
                  <div className="notes-panel-preview-footer">
                    <GhostButton onClick={() => setActiveNoteId(null)}>
                      Close
                    </GhostButton>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </SidebarPanel>
    </div>
  );
}

function NotesFiltersPanel({
  filterType,
  typeFilter,
  setTypeFilter,
  statusFilter,
  setStatusFilter,
  roomFilter,
  setRoomFilter,
  tagFilter,
  setTagFilter,
  rooms,
  tags,
}: {
  filterType?: NoteType;
  typeFilter: NoteType | null;
  setTypeFilter: React.Dispatch<React.SetStateAction<NoteType | null>>;
  statusFilter: "open" | "solved" | null;
  setStatusFilter: React.Dispatch<React.SetStateAction<"open" | "solved" | null>>;
  roomFilter: string | null;
  setRoomFilter: React.Dispatch<React.SetStateAction<string | null>>;
  tagFilter: string | null;
  setTagFilter: React.Dispatch<React.SetStateAction<string | null>>;
  rooms: string[];
  tags: string[];
}) {
  return (
    <aside className="notes-view-filters">
      <div className="notes-view-filters-panel">
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
      </div>
    </aside>
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
      <div className="notes-filter-label">{label}</div>
      <div className="notes-filter-wrap">
        <button
          onClick={() => onChange(null)}
          className={`notes-filter-button ${value === null ? "notes-filter-button-active" : ""}`}
        >
          All
        </button>
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(value === o.value ? null : o.value)}
            className={`notes-filter-button ${value === o.value ? "notes-filter-button-active" : ""}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
