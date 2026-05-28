import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useStore } from "@/data/store";
import { INPUT_BASE_CLASS } from "@/components/common/formClasses";
import { GhostButton, BrassButton, IconButton } from "@/components/common/button";
import { RoomDropdown } from "@/components/common/RoomDropdown";
import { Tabs, TabsList, TabsTrigger } from "@/components/common/tabs";
import { DropdownSelect } from "@/components/common/DropdownSelect";
import { toast } from "sonner";
import { ImagePlus } from "lucide-react";
import type { NoteType, Priority } from "@/lib/types";
import { getRoomCatalog } from "@/data/rooms";
import { NOTE_TYPES } from "@/components/notes/constants";
import { PendingImageList } from "@/components/notes/PendingImageList";
import { NoteDetailsField } from "@/components/notes/NoteDetailsField";

interface NotesSuggestion {
  value: string;
  hint: string;
}

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
  const returnTo = useStore((s) => s.captureReturnTo);
  const gridCells = useStore((s) => s.gridCells);
  const notes = useStore((s) => s.notes);
  const todos = useStore((s) => s.todos);
  const create = useStore((s) => s.createFromCapture);

  return {
    open,
    close,
    kind,
    prefill,
    prefillRoom,
    prefillType,
    returnTo,
    gridCells,
    notes,
    todos,
    create,
  };
}

function useNotesFormState({
  kind,
  prefill,
  prefillRoom,
  prefillType,
  defaultNoteType,
}: {
  kind: "note" | "todo";
  prefill: string;
  prefillRoom?: string;
  prefillType?: NoteType;
  defaultNoteType?: NoteType;
}) {
  const [mode, setMode] = useState<"note" | "todo">(kind);
  const [title, setTitle] = useState(prefill);
  const [type, setType] = useState<NoteType>(prefillType ?? defaultNoteType ?? "observation");
  const [room, setRoom] = useState<string>(prefillRoom ?? "");
  const [dateInput, setDateInput] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [priority, setPriority] = useState<Priority>("med");
  const [body, setBody] = useState("");
  const [pendingImages, setPendingImages] = useState<Blob[]>([]);
  const [cursorPos, setCursorPos] = useState(prefill.length);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  function resetAfterSubmit() {
    setTitle("");
    setBody("");
    setDateInput("");
    setPendingImages([]);
    setTimeout(() => inputRef.current?.focus(), 0);
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
    cursorPos,
    setCursorPos,
    inputRef,
    resetAfterSubmit,
  };
}

function NotesTitleField({
  mode,
  title,
  setTitle,
  cursorPos,
  setCursorPos,
  inputRef,
  suggestions,
  activeToken,
  onSubmit,
}: {
  mode: "note" | "todo";
  title: string;
  setTitle: React.Dispatch<React.SetStateAction<string>>;
  cursorPos: number;
  setCursorPos: React.Dispatch<React.SetStateAction<number>>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  suggestions: NotesSuggestion[];
  activeToken: { token: string; start: number; end: number };
  onSubmit: (keepOpen: boolean) => void;
}) {
  const cursorPosRef = useRef(cursorPos);

  function updateCursorPos(next: number) {
    if (next === cursorPosRef.current) return;
    cursorPosRef.current = next;
    setCursorPos(next);
  }

  return (
    <div>
      <label className="capture-label">Title</label>
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          updateCursorPos(e.target.selectionStart ?? e.target.value.length);
        }}
        onClick={(e) => updateCursorPos(e.currentTarget.selectionStart ?? title.length)}
        onKeyUp={(e) =>
          updateCursorPos((e.currentTarget as HTMLInputElement).selectionStart ?? title.length)
        }
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            onSubmit(e.shiftKey);
          }
        }}
        placeholder={mode === "todo" ? "Check Den bookshelf" : "Parlor safe = 4271"}
        className={`${INPUT_BASE_CLASS} h-10`}
      />
      {suggestions.length > 0 && (
        <div className="capture-suggestions">
          <div className="capture-suggestions-title">Suggestions</div>
          <div className="capture-suggestions-wrap">
            {suggestions.map((s) => (
              <button
                key={s.value}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  const next =
                    `${title.slice(0, activeToken.start)}${s.value} ${title.slice(activeToken.end).trimStart()}`.trim();
                  setTitle(next);
                  updateCursorPos(next.length);
                  setTimeout(() => inputRef.current?.focus(), 0);
                }}
                className="capture-suggestion-btn"
              >
                {s.value}
                <span className="ml-1 text-[10px] text-muted-foreground">{s.hint}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
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

function NotesCreateHeader({ mode }: { mode: "note" | "todo" }) {
  return (
    <div className="capture-header">
      <h2 className="font-serif text-lg">New {mode === "todo" ? "todo" : "note"}</h2>
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
          <label className="capture-label">Date</label>
          <input
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
          <ImagePlus className="h-3.5 w-3.5" /> Attach image
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
      <div className="flex gap-2 sm:ml-auto">
        <GhostButton onClick={close}>Cancel</GhostButton>
        <GhostButton onClick={() => submit(true)}>Save &amp; add another</GhostButton>
        <BrassButton onClick={() => submit(false)}>Save</BrassButton>
      </div>
    </div>
  );
}

function useNotesDerivedData({
  gridCells,
  notes,
  todos,
  title,
  cursorPos,
}: {
  gridCells: NotesStoreSlice["gridCells"];
  notes: NotesStoreSlice["notes"];
  todos: NotesStoreSlice["todos"];
  title: string;
  cursorPos: number;
}) {
  // All room names known to the app, merged from catalog, map cells, notes, and todos.
  const roomOptions = useMemo(() => {
    const all = new Set<string>(getRoomCatalog().map((r) => r.name));
    gridCells.forEach((c) => c.roomName && all.add(c.roomName));
    notes.forEach((n) => n.room?.trim() && all.add(n.room.trim()));
    todos.forEach((t) => t.room?.trim() && all.add(t.room.trim()));
    return Array.from(all).sort();
  }, [gridCells, notes, todos]);

  // All tags seen across notes and todos.
  const tagSuggestions = useMemo(() => {
    const all = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => all.add(t)));
    todos.forEach((t) => t.tags.forEach((x) => all.add(x)));
    return Array.from(all).sort();
  }, [notes, todos]);

  // The word being typed at the cursor — used for inline command suggestions.
  const activeToken = useMemo(() => getActiveToken(title, cursorPos), [title, cursorPos]);

  // Inline title suggestions (e.g. @room, #tag autocomplete).
  const suggestions = useMemo(
    () => buildSuggestions(activeToken, roomOptions, tagSuggestions),
    [activeToken, roomOptions, tagSuggestions],
  );

  return { activeToken, suggestions };
}

function useNotesGlobalEffects({
  open,
  setPendingImages,
}: {
  open: boolean;
  setPendingImages: React.Dispatch<React.SetStateAction<Blob[]>>;
}) {
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      if (!open) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const f = item.getAsFile();
          if (f) setPendingImages((p) => [...p, f]);
        }
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [open, setPendingImages]);
}

function parseTags(tagsInput: string) {
  return tagsInput
    .split(/[\s,]+/)
    .map((token) => token.replace(/^#/, "").trim().toLowerCase())
    .filter(Boolean);
}

function useNotesSubmit({
  create,
  closeWithReturn,
  mode,
  title,
  pendingImages,
  body,
  type,
  room,
  dateInput,
  tagsInput,
  priority,
  resetAfterSubmit,
}: {
  create: NotesStoreSlice["create"];
  closeWithReturn: () => Promise<void>;
  mode: NotesFormState["mode"];
  title: NotesFormState["title"];
  pendingImages: NotesFormState["pendingImages"];
  body: NotesFormState["body"];
  type: NotesFormState["type"];
  room: NotesFormState["room"];
  dateInput: NotesFormState["dateInput"];
  tagsInput: NotesFormState["tagsInput"];
  priority: NotesFormState["priority"];
  resetAfterSubmit: NotesFormState["resetAfterSubmit"];
}) {
  return async function submit(keepOpen: boolean) {
    if (!title.trim() && pendingImages.length === 0) {
      toast.error("Add a title or attach an image before saving.");
      return;
    }
    const tags = parseTags(tagsInput);
    // Pass title raw so #tag @room shortcuts inside still parse,
    // but explicit fields override.
    await create(title || "Untitled", {
      kind: mode,
      imageBlobs: pendingImages,
      body,
      type: mode === "note" ? type : undefined,
      date: mode === "note" ? dateInput || undefined : undefined,
      room: room || undefined,
      tags,
      priority: mode === "todo" ? priority : undefined,
    });
    toast.success(mode === "todo" ? "Todo added" : "Note added");
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
    defaultNoteType,
  });
  const derived = useNotesDerivedData({
    gridCells: store.gridCells,
    notes: store.notes,
    todos: store.todos,
    title: form.title,
    cursorPos: form.cursorPos,
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

  const submit = useNotesSubmit({
    create: store.create,
    closeWithReturn,
    mode: form.mode,
    title: form.title,
    pendingImages: form.pendingImages,
    body: form.body,
    type: form.type,
    room: form.room,
    dateInput: form.dateInput,
    tagsInput: form.tagsInput,
    priority: form.priority,
    resetAfterSubmit: form.resetAfterSubmit,
  });

  const content = (
    <>
      <NotesCreateHeader mode={form.mode} />
      <NotesModeTabs mode={form.mode} setMode={form.setMode} />

      <div className="capture-form-stack">
        <NotesTitleField
          mode={form.mode}
          title={form.title}
          setTitle={form.setTitle}
          cursorPos={form.cursorPos}
          setCursorPos={form.setCursorPos}
          inputRef={form.inputRef}
          suggestions={derived.suggestions}
          activeToken={derived.activeToken}
          onSubmit={submit}
        />

        <NoteDetailsField
          value={form.body}
          onChange={form.setBody}
          placeholder={
            form.mode === "todo" ? "Details about this todo…" : "Longer note, paste evidence…"
          }
        />

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

function getActiveToken(value: string, cursorPos: number) {
  const pos = Math.max(0, Math.min(cursorPos, value.length));
  const left = value.slice(0, pos);
  const tokenStart = left.lastIndexOf(" ") + 1;
  const right = value.slice(pos);
  const nextSpaceOffset = right.indexOf(" ");
  const tokenEnd = nextSpaceOffset === -1 ? value.length : pos + nextSpaceOffset;
  const token = value.slice(tokenStart, tokenEnd);
  return { token, start: tokenStart, end: tokenEnd };
}

function buildSuggestions(
  activeToken: { token: string },
  rooms: string[],
  tags: string[],
): NotesSuggestion[] {
  const token = activeToken.token;
  if (!token) return [];

  const normalize = (value: string) =>
    value
      .toLowerCase()
      .replace(/[.,!?;:]+$/g, "")
      .replace(/[_-]+/g, " ")
      .trim();

  if (token.startsWith("@") || /^room:/i.test(token)) {
    const q = token.startsWith("@") ? normalize(token.slice(1)) : normalize(token.slice(5));
    return rooms
      .filter((room) => normalize(room).includes(q))
      .slice(0, 8)
      .map((room) => ({ value: `@${room.replace(/\s+/g, "-")}`, hint: "room" }));
  }

  if (token.startsWith("#")) {
    const q = normalize(token.slice(1));
    return tags
      .filter((tag) => normalize(tag).includes(q))
      .slice(0, 8)
      .map((tag) => ({ value: `#${tag.replace(/\s+/g, "-")}`, hint: "tag" }));
  }

  if (token.startsWith("!")) {
    const typeCommands = ["!clue", "!code", "!observation", "!theory", "!story", "!todo"];
    const q = token.toLowerCase();
    return typeCommands
      .filter((cmd) => cmd.includes(q))
      .map((cmd) => ({ value: cmd, hint: "type" }));
  }

  if (token.startsWith(">")) {
    const today = new Date().toISOString().slice(0, 10);
    return [{ value: `>${today}`, hint: "date" }];
  }

  return [];
}
