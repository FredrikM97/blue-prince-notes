import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { useStore } from "@/data/store";
import type { Note, NoteType, Todo } from "@/lib/types";
import { PageLayout } from "@/components/common/PageLayout";
import { Button, GhostButton, IconButton } from "@/components/common/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/common/Dialog";
import { Maximize2, X } from "lucide-react";
import { NotesCreatePanel } from "./NotesCreatePanel";
import { NotesEditorPanel } from "./NotesEditorPanel";
import { NotesFilterPanel } from "./NotesFilterPanel";
import { NotesView } from "./NotesView";
import { useNotesPageState } from "@/hooks/useNotesPageState";
import { TodoRightPanel } from "@/components/todos/TodoRightPanel";
import { RightPreviewPanel } from "@/components/common/RightPreviewPanel";
import { NotePreviewDialog } from "./NotePreviewDialog";
import { NotesPreviewPanel } from "./NotesPreviewPanel";

export function NotesPage({
  filterType,
  title,
  emptyHint,
}: {
  filterType?: NoteType;
  title: string;
  emptyHint?: string;
}) {
  const notes = useStore((s) => s.notes);
  const todos = useStore((s) => s.todos);
  const search = useStore((s) => s.search);
  const openCapture = useStore((s) => s.openCapture);
  const captureOpen = useStore((s) => s.captureOpen);
  const closeCapture = useStore((s) => s.closeCapture);
  const saveNote = useStore((s) => s.saveNote);
  const removeNote = useStore((s) => s.removeNote);
  const removeTodo = useStore((s) => s.removeTodo);
  const deferredSearch = useDeferredValue(search);
  const { state: uiState, actions: uiActions } = useNotesPageState();
  const [previewTodo, setPreviewTodo] = useState<Todo | null>(null);

  const effectiveType = filterType ?? uiState.typeFilter;
  const roomFilter = uiState.roomFilter;
  const tagFilter = uiState.tagFilter;
  const statusFilter = uiState.statusFilter;

  const todoByVirtualId = useMemo(() => {
    const index = new Map<string, Todo>();
    todos.forEach((todo) => {
      index.set(`todo:${todo.id}`, todo);
    });
    return index;
  }, [todos]);

  const noteListItems = useMemo(() => {
    const todoNotes: Note[] = todos.map((todo) => ({
      id: `todo:${todo.id}`,
      type: "task",
      title: todo.title,
      body: todo.notes ?? "",
      room: todo.room,
      tags: todo.tags,
      date: undefined,
      status: todo.status === "done" ? "solved" : "open",
      scope: todo.scope === "someday" ? "cross-run" : todo.scope,
      imageIds: [],
      createdAt: todo.createdAt,
      updatedAt: todo.updatedAt,
    }));

    return [...notes, ...todoNotes].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes, todos]);

  const rooms = useMemo(() => {
    const set = new Set<string>();
    noteListItems.forEach((n) => n.room && set.add(n.room));
    return Array.from(set).sort();
  }, [noteListItems]);
  const tags = useMemo(() => {
    const set = new Set<string>();
    noteListItems.forEach((n) => n.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [noteListItems]);

  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    return noteListItems.filter((n) => {
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
  }, [noteListItems, effectiveType, roomFilter, tagFilter, statusFilter, deferredSearch]);

  const activeNote = useMemo(
    () => notes.find((n) => n.id === uiState.activeNoteId) ?? null,
    [notes, uiState.activeNoteId],
  );

  const currentDraft = useMemo(() => {
    if (!activeNote) return null;
    if (uiState.draft && uiState.draft.id === activeNote.id) return uiState.draft;
    return activeNote;
  }, [activeNote, uiState.draft]);

  const setEditorDraft: React.Dispatch<React.SetStateAction<Note>> = (next) => {
    const base = uiState.draft ?? activeNote;
    if (!base) return;
    const resolved = typeof next === "function" ? next(base) : next;
    uiActions.setDraft(resolved);
  };

  const openCaptureForNotes = useCallback(() => {
    uiActions.clearSelection();
    setPreviewTodo(null);
    openCapture({ kind: "note", noteType: filterType });
  }, [openCapture, filterType, uiActions]);

  const openEditFromList = useCallback(
    (note: Note) => {
      const todo = todoByVirtualId.get(note.id);
      if (todo) {
        uiActions.clearSelection();
        setPreviewTodo(null);
        openCapture({ todo });
        return;
      }
      setPreviewTodo(null);
      closeCapture();
      uiActions.openEdit(note);
    },
    [todoByVirtualId, openCapture, closeCapture, uiActions],
  );

  const openPreviewFromList = useCallback(
    (note: Note) => {
      const todo = todoByVirtualId.get(note.id);
      if (todo) {
        uiActions.clearSelection();
        closeCapture();
        setPreviewTodo(todo);
        return;
      }
      setPreviewTodo(null);
      closeCapture();
      uiActions.openPreview(note);
    },
    [todoByVirtualId, closeCapture, uiActions],
  );

  const deleteFromList = useCallback(
    (note: Note) => {
      const todo = todoByVirtualId.get(note.id);
      if (todo) {
        void removeTodo(todo.id);
        return;
      }
      uiActions.setPendingDelete(note);
    },
    [todoByVirtualId, removeTodo, uiActions],
  );

  return (
    <>
      <PageLayout
        className="lg:[grid-template-columns:240px_minmax(0,1fr)_420px]"
        prioritizeMiddleScroll
        leftSidebar={
          <NotesLeftPanel
            title={title}
            total={filtered.length}
            filterType={filterType}
            typeFilter={uiState.typeFilter}
            setTypeFilter={uiActions.setTypeFilter}
            statusFilter={uiState.statusFilter}
            setStatusFilter={uiActions.setStatusFilter}
            roomFilter={uiState.roomFilter}
            setRoomFilter={uiActions.setRoomFilter}
            tagFilter={uiState.tagFilter}
            setTagFilter={uiActions.setTagFilter}
            rooms={rooms}
            tags={tags}
          />
        }
        rightSidebar={
          <div className="notes-right-panel-shell">
            {captureOpen ? (
              <NotesCreatePanel defaultNoteType={filterType} />
            ) : previewTodo ? (
              <TodoRightPanel todo={previewTodo} onClose={() => setPreviewTodo(null)} />
            ) : (
              <NotesRightPanel
                activeNote={activeNote}
                draft={currentDraft}
                panelMode={uiState.panelMode}
                setDraft={setEditorDraft}
                onSave={async () => {
                  if (!currentDraft) return;
                  await saveNote(currentDraft);
                  uiActions.openPreview(currentDraft);
                }}
                onClose={() => {
                  uiActions.clearSelection();
                  closeCapture();
                }}
              />
            )}
          </div>
        }
        middle={
          <NotesView
            emptyHint={emptyHint}
            filtered={filtered}
            openCapture={openCaptureForNotes}
            onOpenEdit={openEditFromList}
            onOpenPreview={openPreviewFromList}
            onDelete={deleteFromList}
          />
        }
      >
        {/* middle content is provided via the `middle` prop */}
      </PageLayout>

      <Dialog
        open={!!uiState.pendingDelete}
        onOpenChange={(open) => !open && uiActions.setPendingDelete(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Delete note</DialogTitle>
            <DialogDescription>
              {uiState.pendingDelete
                ? `Delete "${uiState.pendingDelete.title}"? This cannot be undone.`
                : "Delete this note?"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <GhostButton onClick={() => uiActions.setPendingDelete(null)}>Cancel</GhostButton>
            <Button
              variant="destructive"
              onClick={async () => {
                const pendingDelete = uiState.pendingDelete;
                if (!pendingDelete) return;
                await removeNote(pendingDelete.id);
                uiActions.clearDeletedIfActive(pendingDelete.id);
                uiActions.setPendingDelete(null);
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function NotesLeftPanel({
  title,
  total,
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
  title: string;
  total: number;
  filterType?: NoteType;
  typeFilter: NoteType | null;
  setTypeFilter: (value: NoteType | null) => void;
  statusFilter: "open" | "solved" | null;
  setStatusFilter: (value: "open" | "solved" | null) => void;
  roomFilter: string | null;
  setRoomFilter: (value: string | null) => void;
  tagFilter: string | null;
  setTagFilter: (value: string | null) => void;
  rooms: string[];
  tags: string[];
}) {
  return (
    <div className="space-y-4">
      <div className="page-layout-panel">
        <h1 className="font-serif text-2xl">{title}</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {total} {total === 1 ? "entry" : "entries"}
        </p>
      </div>

      <NotesFilterPanel
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
    </div>
  );
}

function NotesRightPanel({
  activeNote,
  draft,
  panelMode,
  setDraft,
  onSave,
  onClose,
}: {
  activeNote: Note | null;
  draft: Note | null;
  panelMode: "edit" | "preview";
  setDraft: React.Dispatch<React.SetStateAction<Note>>;
  onSave: () => Promise<void>;
  onClose: () => void;
}) {
  const [previewExpanded, setPreviewExpanded] = useState(false);

  if (!activeNote) {
    return (
      <div className="page-layout-panel text-muted-foreground">
        Select a note to preview or edit details.
      </div>
    );
  }

  if (panelMode === "edit") {
    return (
      <div className="page-layout-panel flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2 border-b border-border pb-3">
          <h2 className="font-serif text-lg">Edit note</h2>
          <IconButton onClick={onClose} title="Close">
            <X className="h-4 w-4" />
          </IconButton>
        </div>
        <NotesEditorPanel
          draft={draft ?? activeNote}
          setDraft={setDraft}
          onSave={onSave}
          onCancel={onClose}
        />
      </div>
    );
  }

  const subtitle = [
    activeNote.type,
    activeNote.date,
    `Created ${new Date(activeNote.createdAt).toLocaleDateString()}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <RightPreviewPanel
      title={activeNote.title}
      subtitle={subtitle}
      onExpand={() => setPreviewExpanded(true)}
      onClose={onClose}
      expandDialog={
        <NotePreviewDialog
          note={activeNote}
          open={previewExpanded}
          onOpenChange={setPreviewExpanded}
        />
      }
    >
      <NotesPreviewPanel note={activeNote} />
    </RightPreviewPanel>
  );
}
