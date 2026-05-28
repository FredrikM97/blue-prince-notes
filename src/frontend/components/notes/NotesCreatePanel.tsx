import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/frontend/data/store";
import { INPUT_BASE_CLASS } from "@/frontend/components/common/formClasses";
import { GhostButton, BrassButton, IconButton } from "@/frontend/components/common/button";
import { Tabs, TabsList, TabsTrigger } from "@/frontend/components/common/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/common/select";
import { toast } from "sonner";
import { ImagePlus, HelpCircle } from "lucide-react";
import type { NoteType, Priority } from "@/lib/types";
import { DEFAULT_ROOMS } from "@/frontend/data/rooms";
import { NOTE_TYPES } from "@/frontend/components/notes/constants";
import { NotesShortcutHelp } from "@/frontend/components/notes/NotesShortcutHelp";
import { PendingImageList } from "@/frontend/components/notes/PendingImageList";
import { MarkdownEditor } from "@/frontend/components/common/MarkdownEditor";
import { formatAllMarkdownTables } from "@/frontend/components/common/markdown-table";

interface NotesSuggestion {
  value: string;
  hint: string;
}

type NotesStoreSlice = ReturnType<typeof useNotesStoreSlice>;
type NotesFormState = ReturnType<typeof useNotesFormState>;

function useNotesStoreSlice() {
  const open = useStore((s) => s.captureOpen);
  const close = useStore((s) => s.closeCapture);
  const kind = useStore((s) => s.captureDefault);
  const prefill = useStore((s) => s.capturePrefill);
  const prefillRoom = useStore((s) => s.capturePrefillRoom);
  const prefillType = useStore((s) => s.capturePrefillType);
  const gridCells = useStore((s) => s.gridCells);
  const notes = useStore((s) => s.notes);
  const todos = useStore((s) => s.todos);
  const create = useStore((s) => s.createFromCapture);

  return { open, close, kind, prefill, prefillRoom, prefillType, gridCells, notes, todos, create };
}

function useNotesFormState({
  open,
  kind,
  prefill,
  prefillRoom,
  prefillType,
  defaultNoteType,
}: {
  open: boolean;
  kind: "note" | "todo";
  prefill: string;
  prefillRoom?: string;
  prefillType?: NoteType;
  defaultNoteType?: NoteType;
}) {
  const [mode, setMode] = useState<"note" | "todo">(kind);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<NoteType>("observation");
  const [room, setRoom] = useState<string>("");
  const [dateInput, setDateInput] = useState("");
  const [roomFocused, setRoomFocused] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [priority, setPriority] = useState<Priority>("med");
  const [body, setBody] = useState("");
  const [pendingImages, setPendingImages] = useState<Blob[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [cursorPos, setCursorPos] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setMode(kind);
    setTitle(prefill);
    setType(prefillType ?? defaultNoteType ?? "observation");
    setRoom(prefillRoom ?? "");
    setDateInput("");
    setTagsInput("");
    setPriority("med");
    setBody("");
    setShowHelp(false);
    setPendingImages([]);
    setCursorPos(prefill.length);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [open, kind, prefill, prefillRoom, prefillType, defaultNoteType]);

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
    roomFocused,
    setRoomFocused,
    tagsInput,
    setTagsInput,
    priority,
    setPriority,
    body,
    setBody,
    pendingImages,
    setPendingImages,
    showHelp,
    setShowHelp,
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
  return (
    <div>
      <label className="capture-label">Title</label>
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          setCursorPos(e.target.selectionStart ?? e.target.value.length);
        }}
        onClick={(e) => setCursorPos(e.currentTarget.selectionStart ?? title.length)}
        onKeyUp={(e) =>
          setCursorPos((e.currentTarget as HTMLInputElement).selectionStart ?? title.length)
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
                  setCursorPos(next.length);
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
  roomFocused,
  setRoomFocused,
  roomFieldSuggestions,
}: {
  room: string;
  setRoom: React.Dispatch<React.SetStateAction<string>>;
  roomFocused: boolean;
  setRoomFocused: React.Dispatch<React.SetStateAction<boolean>>;
  roomFieldSuggestions: string[];
}) {
  return (
    <div>
      <label className="capture-label">Room</label>
      <div className="relative">
        <input
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          onFocus={() => setRoomFocused(true)}
          onBlur={() => setTimeout(() => setRoomFocused(false), 100)}
          placeholder="No room"
          className={INPUT_BASE_CLASS}
        />
        {roomFocused && roomFieldSuggestions.length > 0 && (
          <div className="capture-room-popover">
            {roomFieldSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setRoom(suggestion);
                  setRoomFocused(false);
                }}
                className="block w-full rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NotesCreateHeader({ mode }: { mode: "note" | "todo" }) {
  return (
    <div className="capture-header">
      <h2 className="font-serif text-lg">New {mode === "todo" ? "todo" : "note"}</h2>
      <p className="text-xs leading-4 text-muted-foreground">
        Fill in the fields below, or type commands like @room, #tag, and !todo.
      </p>
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
      <TabsList className="grid h-8 w-full grid-cols-2">
        <TabsTrigger className="text-xs" value="note">
          📝 Note
        </TabsTrigger>
        <TabsTrigger className="text-xs" value="todo">
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
  roomFocused,
  setRoomFocused,
  roomFieldSuggestions,
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
  roomFocused: boolean;
  setRoomFocused: React.Dispatch<React.SetStateAction<boolean>>;
  roomFieldSuggestions: string[];
}) {
  return (
    <>
      <div className="capture-two-col">
        {mode === "note" ? (
          <div>
            <label className="capture-label">Type / category</label>
            <Select value={type} onValueChange={(v) => setType(v as NoteType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOTE_TYPES.map((noteType) => (
                  <SelectItem key={noteType.value} value={noteType.value}>
                    {noteType.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div>
            <label className="capture-label">Priority</label>
            <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="med">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <NotesRoomField
          room={room}
          setRoom={setRoom}
          roomFocused={roomFocused}
          setRoomFocused={setRoomFocused}
          roomFieldSuggestions={roomFieldSuggestions}
        />
      </div>

      {mode === "note" && (
        <div>
          <label className="capture-label">Date</label>
          <input
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            placeholder="Free text (e.g. Day 3, after library puzzle)"
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
      <label className="capture-label">
        Tags{" "}
        <span className="text-muted-foreground/70 normal-case">(space or comma separated)</span>
      </label>
      <input
        value={tagsInput}
        onChange={(e) => setTagsInput(e.target.value)}
        placeholder="safe, gem, puzzle"
        className={INPUT_BASE_CLASS}
      />
    </div>
  );
}

function NotesDetailsSection({
  mode,
  body,
  setBody,
  showHelp,
  setShowHelp,
}: {
  mode: "note" | "todo";
  body: string;
  setBody: React.Dispatch<React.SetStateAction<string>>;
  showHelp: boolean;
  setShowHelp: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const shortcutToggle = (
    <IconButton
      aria-label="Toggle shortcut help"
      title="Shortcuts"
      className="h-7 w-7"
      onClick={() => setShowHelp((v) => !v)}
    >
      <HelpCircle className="h-3.5 w-3.5" />
    </IconButton>
  );

  return (
    <div>
      <label className="capture-label">
        Details <span className="text-muted-foreground/70 normal-case">(optional)</span>
      </label>
      <MarkdownEditor
        value={body}
        onChange={setBody}
        onFormatTables={() => setBody(formatAllMarkdownTables(body))}
        placeholder={mode === "todo" ? "Details about this todo…" : "Longer note, paste evidence…"}
        rows={12}
        extraTools={shortcutToggle}
      />
      {showHelp && (
        <div className="mt-1">
          <NotesShortcutHelp />
        </div>
      )}
    </div>
  );
}

function NotesFooterActions({
  submit,
  setPendingImages,
}: {
  submit: (keepOpen: boolean) => void | Promise<void>;
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
  room,
}: {
  gridCells: NotesStoreSlice["gridCells"];
  notes: NotesStoreSlice["notes"];
  todos: NotesStoreSlice["todos"];
  title: string;
  cursorPos: number;
  room: string;
}) {
  // All room names known to the app, merged from map cells, notes, todos, and defaults.
  const roomOptions = useMemo(() => {
    const all = new Set<string>(DEFAULT_ROOMS.map((r) => r.name));
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

  // Room dropdown: filtered by what the user has typed so far.
  const roomFieldSuggestions = useMemo(() => {
    const q = room.trim().toLowerCase();
    if (!q) return roomOptions.slice(0, 8);
    return roomOptions.filter((r) => r.toLowerCase().includes(q)).slice(0, 8);
  }, [room, roomOptions]);

  // Inline title suggestions (e.g. @room, #tag autocomplete).
  const suggestions = useMemo(
    () => buildSuggestions(activeToken, roomOptions, tagSuggestions),
    [activeToken, roomOptions, tagSuggestions],
  );

  return { roomFieldSuggestions, activeToken, suggestions };
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
  close,
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
  close: () => void;
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
    if (!title.trim() && pendingImages.length === 0) return;
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
      close();
    }
  };
}

export function NotesCreatePanel({ defaultNoteType }: { defaultNoteType?: NoteType }) {
  const store = useNotesStoreSlice();
  const form = useNotesFormState({
    open: store.open,
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
    room: form.room,
  });

  useNotesGlobalEffects({
    open: store.open,
    setPendingImages: form.setPendingImages,
  });

  const submit = useNotesSubmit({
    create: store.create,
    close: store.close,
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

        <NotesDetailsSection
          mode={form.mode}
          body={form.body}
          setBody={form.setBody}
          showHelp={form.showHelp}
          setShowHelp={form.setShowHelp}
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
          roomFocused={form.roomFocused}
          setRoomFocused={form.setRoomFocused}
          roomFieldSuggestions={derived.roomFieldSuggestions}
        />

        <NotesTagsField tagsInput={form.tagsInput} setTagsInput={form.setTagsInput} />

        <PendingImageList
          images={form.pendingImages}
          onRemove={(index) => form.setPendingImages((p) => p.filter((_, j) => j !== index))}
        />
      </div>

      <NotesFooterActions submit={submit} setPendingImages={form.setPendingImages} />
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
      .replace(/_/g, " ")
      .trim();

  if (token.startsWith("@") || /^room:/i.test(token)) {
    const q = token.startsWith("@") ? normalize(token.slice(1)) : normalize(token.slice(5));
    return rooms
      .filter((room) => normalize(room).includes(q))
      .slice(0, 8)
      .map((room) => ({ value: `@${room.replace(/\s+/g, "_")}`, hint: "room" }));
  }

  if (token.startsWith("#")) {
    const q = normalize(token.slice(1));
    return tags
      .filter((tag) => normalize(tag).includes(q))
      .slice(0, 8)
      .map((tag) => ({ value: `#${tag}`, hint: "tag" }));
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
