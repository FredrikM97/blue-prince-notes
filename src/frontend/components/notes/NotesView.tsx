import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/frontend/data/store";
import type { Note, NoteType } from "@/lib/types";
import { NotesRow } from "./NotesRow";
import { BrassButton } from "@/frontend/components/common/button";
import { PageLayout } from "@/frontend/components/common/PageLayout";
import { NotesFiltersPanel } from "./NotesFiltersPanel";
import { NotesDetailPanel } from "./NotesDetailPanel";

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
    <PageLayout
      sidebar={
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
      }
      panelOpen={notePanelOpen}
    >

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

      <NotesDetailPanel
        activeNote={activeNote}
        draft={draft}
        panelMode={panelMode}
        setDraft={setEditorDraft}
        onSave={async () => {
          if (!draft && !activeNote) return;
          await saveNote(draft ?? activeNote!);
          setPanelMode("preview");
        }}
        onClose={() => {
          if (activeNote) setDraft(activeNote);
          setActiveNoteId(null);
        }}
      />
    </PageLayout>
  );
}
