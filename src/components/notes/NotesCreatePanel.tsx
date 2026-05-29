import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useStore } from "@/data/store";
import { INPUT_BASE_CLASS } from "@/components/common/FormClasses";
import { GhostButton, BrassButton, IconButton } from "@/components/common/Button";
import { RoomDropdown } from "@/components/common/dropdown/RoomDropdown";
import { Tabs, TabsList, TabsTrigger } from "@/components/common/Tabs";
import { DropdownSelect } from "@/components/common/dropdown/DropdownSelect";
import { toast } from "sonner";
import { usePasteImages } from "@/hooks/usePasteImages";
import { ImagePlus } from "lucide-react";
import type { NoteType, Priority } from "@/lib/types";
import { NOTE_TYPES } from "@/lib/noteMetadata";
import { PendingImageList } from "@/components/common/input/PendingImageList";
import { DetailsField } from "@/components/common/input/DetailsField";
import { InputField } from "@/components/common/input/InputField";
import { SuggestionsDropdown } from "@/components/common/dropdown/SuggestionsDropdown";

const NOTE_PRIORITY_OPTIONS = [
  { value: "high", label: "High" },
  { value: "med", label: "Medium" },
  { value: "low", label: "Low" },
];

type NotesStoreSlice = ReturnType<typeof useNotesStoreSlice>;
type NotesFormState = ReturnType<typeof useNotesFormState>;

function useNotesStoreSlice() {
  const open = useStore((s) => s.captureOpen);
  const close = useStore((s) => s.closeCapture);
  const kind = useStore((s) => s.captureDefault);
  const prefill = useStore((s) => s.capturePrefill);
  const prefillRoom = useStore((s) => s.capturePrefillRoom);
  const prefillType = useStore((s) => s.capturePrefillType);
  const prefillTags = useStore((s) => s.capturePrefillTags);
  const prefillBody = useStore((s) => s.capturePrefillBody);
  const prefillPriority = useStore((s) => s.capturePrefillPriority);
  const editNoteId = useStore((s) => s.captureEditNoteId);
  const editTodoId = useStore((s) => s.captureEditTodoId);
  const saveNote = useStore((s) => s.saveNote);
  const saveTodo = useStore((s) => s.saveTodo);
  const notes = useStore((s) => s.notes);
  const todos = useStore((s) => s.todos);
  const returnTo = useStore((s) => s.captureReturnTo);
  const create = useStore((s) => s.createFromCapture);

  return {
    open,
    close,
    kind,
    prefill,
    prefillRoom,
    prefillType,
    prefillTags,
    prefillBody,
    prefillPriority,
    editNoteId,
    editTodoId,
    saveNote,
    saveTodo,
    notes,
    todos,
    returnTo,
    create,
  };
}

function useNotesFormState({
  kind,
  prefill,
  prefillRoom,
  prefillType,
  prefillTags,
  prefillBody,
  prefillPriority,
  defaultNoteType,
}: {
  kind: "note" | "todo";
  prefill: string;
  prefillRoom?: string;
  prefillType?: NoteType;
  prefillTags?: string;
  prefillBody?: string;
  prefillPriority?: Priority;
  defaultNoteType?: NoteType;
}) {
  const [mode, setMode] = useState<"note" | "todo">(kind);
  const [title, setTitle] = useState(prefill);
  const [type, setType] = useState<NoteType>(prefillType ?? defaultNoteType ?? "observation");
  const [room, setRoom] = useState<string>(prefillRoom ?? "");
  const [dateInput, setDateInput] = useState("");
  const [tagsInput, setTagsInput] = useState(prefillTags ?? "");
  const [priority, setPriority] = useState<Priority>(prefillPriority ?? "med");
  const [body, setBody] = useState(prefillBody ?? "");
  const [pendingImages, setPendingImages] = useState<Blob[]>([]);

  function resetAfterSubmit() {
    setTitle("");
    setBody("");
    setDateInput("");
    setPendingImages([]);
  }

  return {
    mode,
    setMode,
    title,
    setTitle,
    type,
    setType,
    room,
    setRoom,
    dateInput,
    setDateInput,
    tagsInput,
    setTagsInput,
    priority,
    setPriority,
    body,
    setBody,
    pendingImages,
    setPendingImages,
    resetAfterSubmit,
  };
}

function NotesRoomField({
  room,
  setRoom,
}: {
  room: string;
  setRoom: React.Dispatch<React.SetStateAction<string>>;
}) {
  return (
    <div>
      <label className="capture-label">Room</label>
      <RoomDropdown value={room} onValueChange={setRoom} />
    </div>
  );
}

function NotesCreateHeader({ mode, isEditing }: { mode: "note" | "todo"; isEditing: boolean }) {
  return (
    <div className="capture-header">
      <h2 className="font-serif text-lg">
        {isEditing ? "Edit" : "New"} {mode === "todo" ? "todo" : "note"}
      </h2>
    </div>
  );
}

function NotesModeTabs({
  mode,
  setMode,
}: {
  mode: "note" | "todo";
  setMode: React.Dispatch<React.SetStateAction<"note" | "todo">>;
}) {
  return (
    <Tabs className="shrink-0" value={mode} onValueChange={(v) => setMode(v as "note" | "todo")}>
      <TabsList className="grid h-9 w-full grid-cols-2 rounded-md border border-input bg-muted/30 p-0.5">
        <TabsTrigger className="h-7 w-full rounded-sm text-xs" value="note">
          📝 Note
        </TabsTrigger>
        <TabsTrigger className="h-7 w-full rounded-sm text-xs" value="todo">
          ✓ Todo
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

function NotesMetaFields({
  mode,
  type,
  setType,
  priority,
  setPriority,
  room,
  setRoom,
  dateInput,
  setDateInput,
}: {
  mode: "note" | "todo";
  type: NoteType;
  setType: React.Dispatch<React.SetStateAction<NoteType>>;
  priority: Priority;
  setPriority: React.Dispatch<React.SetStateAction<Priority>>;
  room: string;
  setRoom: React.Dispatch<React.SetStateAction<string>>;
  dateInput: string;
  setDateInput: React.Dispatch<React.SetStateAction<string>>;
}) {
  return (
    <>
      <div className="capture-two-col">
        {mode === "note" ? (
          <div>
            <label className="capture-label">Type / category</label>
            <DropdownSelect
              value={type}
              onValueChange={(v) => setType(v as NoteType)}
              options={NOTE_TYPES}
            />
          </div>
        ) : (
          <div>
            <label className="capture-label">Priority</label>
            <DropdownSelect
              value={priority}
              onValueChange={(v) => setPriority(v as Priority)}
              options={NOTE_PRIORITY_OPTIONS}
            />
          </div>
        )}

        <NotesRoomField room={room} setRoom={setRoom} />
      </div>

      {mode === "note" && (
        <div>
          <input
            type="date"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            className={INPUT_BASE_CLASS}
          />
        </div>
      )}
    </>
  );
}

function NotesTagsField({
  tagsInput,
  setTagsInput,
}: {
  tagsInput: string;
  setTagsInput: React.Dispatch<React.SetStateAction<string>>;
}) {
  return (
    <div>
      <label className="capture-label">Tags</label>
      <input
        value={tagsInput}
        onChange={(e) => setTagsInput(e.target.value)}
        placeholder="safe, gem, puzzle"
        className={INPUT_BASE_CLASS}
      />
    </div>
  );
}

function NotesFooterActions({
  submit,
  close,
  setPendingImages,
}: {
  submit: (keepOpen: boolean) => void | Promise<void>;
  close: () => void;
  setPendingImages: React.Dispatch<React.SetStateAction<Blob[]>>;
}) {
  return (
    <div className="capture-footer">
      <label className="capture-attach-label">
        <span className="inline-flex items-center gap-1">
          <ImagePlus className="h-3.5 w-3.5" /> Attach
        </span>
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            setPendingImages((pending) => [...pending, ...files]);
            e.target.value = "";
          }}
        />
      </label>
      <div className="capture-footer-actions">
        <GhostButton size="sm" onClick={close}>
          Cancel
        </GhostButton>
        <GhostButton size="sm" onClick={() => submit(true)}>
          Save + next
        </GhostButton>
        <BrassButton size="sm" onClick={() => submit(false)}>
          Save
        </BrassButton>
      </div>
    </div>
  );
}

function useNotesGlobalEffects({
  open,
  setPendingImages,
}: {
  open: boolean;
  setPendingImages: React.Dispatch<React.SetStateAction<Blob[]>>;
}) {
  usePasteImages({
    enabled: open,
    onImages: (files) => setPendingImages((p) => [...p, ...files]),
  });
}

function parseTags(tagsInput: string) {
  return tagsInput
    .split(/[\s,]+/)
    .map((token) => token.replace(/^#/, "").trim().toLowerCase())
    .filter(Boolean);
}

// ── Todo submit ────────────────────────────────────────────────────────────
function useTodoSubmit({
  saveTodo,
  create,
  editTodoId,
  existingTodos,
  closeWithReturn,
  title,
  body,
  room,
  tagsInput,
  priority,
  resetAfterSubmit,
}: {
  saveTodo: NotesStoreSlice["saveTodo"];
  create: NotesStoreSlice["create"];
  editTodoId: NotesStoreSlice["editTodoId"];
  existingTodos: NotesStoreSlice["todos"];
  closeWithReturn: () => Promise<void>;
  title: NotesFormState["title"];
  body: NotesFormState["body"];
  room: NotesFormState["room"];
  tagsInput: NotesFormState["tagsInput"];
  priority: NotesFormState["priority"];
  resetAfterSubmit: NotesFormState["resetAfterSubmit"];
}) {
  return async function submit(keepOpen: boolean) {
    if (!title.trim()) {
      toast.error("Add a title before saving.");
      return;
    }
    const tags = parseTags(tagsInput);

    if (editTodoId) {
      const existing = existingTodos.find((t) => t.id === editTodoId);
      if (existing) {
        await saveTodo({
          ...existing,
          title: title.trim() || "Untitled",
          room: room || undefined,
          tags,
          priority,
          notes: body.trim() || undefined,
        });
        toast.success("Todo updated");
        await closeWithReturn();
        return;
      }
    }

    await create(title || "Untitled", {
      kind: "todo",
      body,
      room: room || undefined,
      tags,
      priority,
    });
    toast.success("Todo added");
    if (keepOpen) {
      resetAfterSubmit();
    } else {
      await closeWithReturn();
    }
  };
}

// ── Note submit ────────────────────────────────────────────────────────────
function useNoteSubmit({
  saveNote,
  create,
  editNoteId,
  existingNotes,
  closeWithReturn,
  title,
  pendingImages,
  body,
  type,
  room,
  dateInput,
  tagsInput,
  resetAfterSubmit,
}: {
  saveNote: NotesStoreSlice["saveNote"];
  create: NotesStoreSlice["create"];
  editNoteId: NotesStoreSlice["editNoteId"];
  existingNotes: NotesStoreSlice["notes"];
  closeWithReturn: () => Promise<void>;
  title: NotesFormState["title"];
  pendingImages: NotesFormState["pendingImages"];
  body: NotesFormState["body"];
  type: NotesFormState["type"];
  room: NotesFormState["room"];
  dateInput: NotesFormState["dateInput"];
  tagsInput: NotesFormState["tagsInput"];
  resetAfterSubmit: NotesFormState["resetAfterSubmit"];
}) {
  return async function submit(keepOpen: boolean) {
    if (!title.trim() && pendingImages.length === 0) {
      toast.error("Add a title or attach an image before saving.");
      return;
    }
    const tags = parseTags(tagsInput);

    if (editNoteId) {
      const existing = existingNotes.find((n) => n.id === editNoteId);
      if (existing) {
        await saveNote({
          ...existing,
          title: title.trim() || "Untitled",
          body: body.trim(),
          type,
          room: room || undefined,
          tags,
          date: dateInput || existing.date,
        });
        toast.success("Note updated");
        await closeWithReturn();
        return;
      }
    }

    // Pass title raw so #tag @room shortcuts inside still parse,
    // but explicit fields override.
    await create(title || "Untitled", {
      kind: "note",
      imageBlobs: pendingImages,
      body,
      type,
      date: dateInput || undefined,
      room: room || undefined,
      tags,
    });
    toast.success("Note added");
    if (keepOpen) {
      resetAfterSubmit();
    } else {
      await closeWithReturn();
    }
  };
}

export function NotesCreatePanel({ defaultNoteType }: { defaultNoteType?: NoteType }) {
  const navigate = useNavigate();
  const store = useNotesStoreSlice();
  const form = useNotesFormState({
    kind: store.kind,
    prefill: store.prefill,
    prefillRoom: store.prefillRoom,
    prefillType: store.prefillType,
    prefillTags: store.prefillTags,
    prefillBody: store.prefillBody,
    prefillPriority: store.prefillPriority,
    defaultNoteType,
  });

  useNotesGlobalEffects({
    open: store.open,
    setPendingImages: form.setPendingImages,
  });

  const closeWithReturn = async () => {
    const target = store.returnTo;
    store.close();
    if (target) {
      await navigate({ to: target as "/" });
    }
  };

  const submitTodo = useTodoSubmit({
    saveTodo: store.saveTodo,
    create: store.create,
    editTodoId: store.editTodoId,
    existingTodos: store.todos,
    closeWithReturn,
    title: form.title,
    body: form.body,
    room: form.room,
    tagsInput: form.tagsInput,
    priority: form.priority,
    resetAfterSubmit: form.resetAfterSubmit,
  });

  const submitNote = useNoteSubmit({
    saveNote: store.saveNote,
    create: store.create,
    editNoteId: store.editNoteId,
    existingNotes: store.notes,
    closeWithReturn,
    title: form.title,
    pendingImages: form.pendingImages,
    body: form.body,
    type: form.type,
    room: form.room,
    dateInput: form.dateInput,
    tagsInput: form.tagsInput,
    resetAfterSubmit: form.resetAfterSubmit,
  });

  const submit = form.mode === "todo" ? submitTodo : submitNote;

  const isEditing = Boolean(store.editNoteId ?? store.editTodoId);

  const content = (
    <>
      <NotesCreateHeader mode={form.mode} isEditing={isEditing} />
      {!isEditing && <NotesModeTabs mode={form.mode} setMode={form.setMode} />}

      <div className="capture-form-stack">
        <SuggestionsDropdown onSubmitShortcut={submit}>
          <InputField
            label="Title"
            value={form.title}
            onChange={form.setTitle}
            placeholder={form.mode === "todo" ? "Check Den bookshelf" : "Parlor safe = 4271"}
            inputClassName={`${INPUT_BASE_CLASS} h-10`}
            autoFocus
          />
        </SuggestionsDropdown>

        <SuggestionsDropdown>
          <DetailsField
            value={form.body}
            onChange={form.setBody}
            placeholder={
              form.mode === "todo" ? "Details about this todo…" : "Longer note, paste evidence…"
            }
          />
        </SuggestionsDropdown>

        <NotesMetaFields
          mode={form.mode}
          type={form.type}
          setType={form.setType}
          priority={form.priority}
          setPriority={form.setPriority}
          room={form.room}
          setRoom={form.setRoom}
          dateInput={form.dateInput}
          setDateInput={form.setDateInput}
        />

        <NotesTagsField tagsInput={form.tagsInput} setTagsInput={form.setTagsInput} />

        <PendingImageList
          images={form.pendingImages}
          onRemove={(index) => form.setPendingImages((p) => p.filter((_, j) => j !== index))}
        />
      </div>

      <NotesFooterActions
        submit={submit}
        close={() => {
          void closeWithReturn();
        }}
        setPendingImages={form.setPendingImages}
      />
    </>
  );

  if (!store.open) {
    return (
      <div className="page-layout-panel text-muted-foreground">
        Press N or use the add button to create a note.
      </div>
    );
  }

  return (
    <div className="notes-view-panel capture-panel rounded-lg border border-border bg-card p-4 sm:p-6">
      {content}
    </div>
  );
}
