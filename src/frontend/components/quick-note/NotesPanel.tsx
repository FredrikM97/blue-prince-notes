import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useStore } from "@/frontend/data/store";
import { INPUT_BASE_CLASS, TEXTAREA_BASE_CLASS } from "@/frontend/components/common/formClasses";
import { buttonClass } from "@/frontend/components/common/buttonClasses";
import { Tabs, TabsList, TabsTrigger } from "@/frontend/components/ui/tabs";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/frontend/components/ui/dialog";
import { SidebarPanel } from "@/frontend/components/ui/sidebar-panel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select";
import { toast } from "sonner";
import { ImagePlus, Info } from "lucide-react";
import type { NoteType, Priority } from "@/lib/types";
import { DEFAULT_ROOMS } from "@/frontend/data/rooms";
import { NOTE_TYPES } from "@/frontend/components/quick-note/constants";
import { QuickNoteShortcutHelp } from "@/frontend/components/quick-note/QuickNoteShortcutHelp";
import { PendingImageList } from "@/frontend/components/quick-note/PendingImageList";

interface NotesSuggestion {
  value: string;
  hint: string;
}

type NotesStoreSlice = ReturnType<typeof useNotesStoreSlice>;
type NotesFormState = ReturnType<typeof useNotesFormState>;

function useNotesStoreSlice() {
  const open = useStore((s) => s.captureOpen);
  const close = useStore((s) => s.closeCapture);
  const openCap = useStore((s) => s.openCapture);
  const kind = useStore((s) => s.captureDefault);
  const prefill = useStore((s) => s.capturePrefill);
  const prefillRoom = useStore((s) => s.capturePrefillRoom);
  const gridCells = useStore((s) => s.gridCells);
  const notes = useStore((s) => s.notes);
  const todos = useStore((s) => s.todos);
  const create = useStore((s) => s.createFromCapture);

  return { open, close, openCap, kind, prefill, prefillRoom, gridCells, notes, todos, create };
}

function useNotesFormState({
  open,
  kind,
  prefill,
  prefillRoom,
}: {
  open: boolean;
  kind: "note" | "todo";
  prefill: string;
  prefillRoom?: string;
}) {
  const [mode, setMode] = useState<"note" | "todo">(kind);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<NoteType>("observation");
  const [room, setRoom] = useState<string>("");
  const [roomFocused, setRoomFocused] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [priority, setPriority] = useState<Priority>("med");
  const [body, setBody] = useState("");
  const [showDetailsPreview, setShowDetailsPreview] = useState(false);
  const [pendingImages, setPendingImages] = useState<Blob[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [cursorPos, setCursorPos] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setMode(kind);
    setTitle(prefill);
    setType("observation");
    setRoom(prefillRoom ?? "");
    setTagsInput("");
    setPriority("med");
    setBody("");
    setShowDetailsPreview(false);
    setPendingImages([]);
    setCursorPos(prefill.length);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [open, kind, prefill, prefillRoom]);

  function resetAfterSubmit() {
    setTitle("");
    setBody("");
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
    roomFocused,
    setRoomFocused,
    tagsInput,
    setTagsInput,
    priority,
    setPriority,
    body,
    setBody,
    showDetailsPreview,
    setShowDetailsPreview,
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

function NotesPanelHeader({ mode }: { mode: "note" | "todo" }) {
  return (
    <DialogHeader className="capture-header">
      <DialogTitle className="font-serif text-lg">
        New {mode === "todo" ? "todo" : "note"}
      </DialogTitle>
      <DialogDescription className="text-xs leading-4">
        Fill in the fields below, or type commands like @room, #tag, and !todo.
      </DialogDescription>
    </DialogHeader>
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
  roomFocused: boolean;
  setRoomFocused: React.Dispatch<React.SetStateAction<boolean>>;
  roomFieldSuggestions: string[];
}) {
  return (
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
  showDetailsPreview,
  setShowDetailsPreview,
}: {
  mode: "note" | "todo";
  body: string;
  setBody: React.Dispatch<React.SetStateAction<string>>;
  showDetailsPreview: boolean;
  setShowDetailsPreview: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Details {mode === "todo" ? "(optional)" : "(optional)"}
        </label>
        {mode === "note" && (
          <button
            type="button"
            onClick={() => setShowDetailsPreview((v) => !v)}
            className="text-[11px] text-muted-foreground hover:text-foreground"
          >
            {showDetailsPreview ? "Hide preview" : "Open preview"}
          </button>
        )}
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Longer note, paste evidence here, or details about the todo…"
        rows={6}
        className={TEXTAREA_BASE_CLASS}
      />

      {mode === "note" && showDetailsPreview && (
        <div className="capture-preview-card">
          <div className="capture-preview-title">Details preview</div>
          <div className="capture-preview-markdown">
            {body.trim().length > 0 ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
            ) : (
              <p className="text-muted-foreground">Nothing to preview yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotesAttachmentsSection({
  setPendingImages,
  showHelp,
  setShowHelp,
}: {
  setPendingImages: React.Dispatch<React.SetStateAction<Blob[]>>;
  showHelp: boolean;
  setShowHelp: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <>
      <div className="capture-actions-row">
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
        <button type="button" onClick={() => setShowHelp((v) => !v)} className="capture-help-btn">
          <Info className="h-3 w-3" /> Shortcuts
        </button>
      </div>

      {showHelp && <QuickNoteShortcutHelp />}
    </>
  );
}

function NotesFooterActions({ submit }: { submit: (keepOpen: boolean) => void | Promise<void> }) {
  return (
    <DialogFooter className="capture-footer">
      <p className="capture-footer-hint">⌘/Ctrl+Enter to save · Shift to keep open</p>
      <div className="flex gap-2">
        <button className={buttonClass({ variant: "ghost" })} onClick={() => submit(true)}>
          Save & add another
        </button>
        <button
          onClick={() => submit(false)}
          className={buttonClass({
            className: "bg-brass text-brass-foreground hover:bg-brass/90",
          })}
        >
          Save
        </button>
      </div>
    </DialogFooter>
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
  // Rooms placed on the map get priority in the dropdown.
  const placedRooms = useMemo(() => {
    const set = new Set<string>();
    gridCells.forEach((c) => c.roomName && set.add(c.roomName));
    return Array.from(set).sort();
  }, [gridCells]);

  const roomOptions = useMemo(() => {
    const all = new Set<string>(DEFAULT_ROOMS.map((r) => r.name));
    placedRooms.forEach((r) => all.add(r));
    for (const n of notes) {
      if (n.room?.trim()) all.add(n.room.trim());
    }
    for (const t of todos) {
      if (t.room?.trim()) all.add(t.room.trim());
    }
    return Array.from(all).sort();
  }, [placedRooms, notes, todos]);

  const tagSuggestions = useMemo(() => {
    const all = new Set<string>();
    for (const n of notes) n.tags.forEach((t) => all.add(t));
    for (const t of todos) t.tags.forEach((x) => all.add(x));
    return Array.from(all).sort();
  }, [notes, todos]);

  const activeToken = useMemo(() => getActiveToken(title, cursorPos), [title, cursorPos]);

  const roomFieldSuggestions = useMemo(() => {
    const q = room.trim().toLowerCase();
    if (!q) return roomOptions.slice(0, 8);
    return roomOptions.filter((r) => r.toLowerCase().includes(q)).slice(0, 8);
  }, [room, roomOptions]);

  const suggestions = useMemo(() => {
    return buildSuggestions(activeToken, roomOptions, tagSuggestions);
  }, [activeToken, roomOptions, tagSuggestions]);

  return { roomFieldSuggestions, activeToken, suggestions };
}

function useNotesGlobalEffects({
  open,
  openCapture,
  setPendingImages,
}: {
  open: boolean;
  openCapture: () => void;
  setPendingImages: React.Dispatch<React.SetStateAction<Blob[]>>;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tgt = e.target as HTMLElement;
      const typing = tgt && /input|textarea|select/i.test(tgt.tagName);
      if ((e.key === "n" || e.key === "N") && !typing && !e.metaKey && !e.ctrlKey && !open) {
        e.preventDefault();
        openCapture();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, openCapture]);

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

export function NotesPanel() {
  const store = useNotesStoreSlice();
  const form = useNotesFormState({
    open: store.open,
    kind: store.kind,
    prefill: store.prefill,
    prefillRoom: store.prefillRoom,
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
    openCapture: store.openCap,
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
    tagsInput: form.tagsInput,
    priority: form.priority,
    resetAfterSubmit: form.resetAfterSubmit,
  });

  return (
    <SidebarPanel open={store.open} onClose={store.close} className="capture-panel">
      <NotesPanelHeader mode={form.mode} />
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

        <NotesMetaFields
          mode={form.mode}
          type={form.type}
          setType={form.setType}
          priority={form.priority}
          setPriority={form.setPriority}
          room={form.room}
          setRoom={form.setRoom}
          roomFocused={form.roomFocused}
          setRoomFocused={form.setRoomFocused}
          roomFieldSuggestions={derived.roomFieldSuggestions}
        />

        <NotesTagsField tagsInput={form.tagsInput} setTagsInput={form.setTagsInput} />

        <NotesDetailsSection
          mode={form.mode}
          body={form.body}
          setBody={form.setBody}
          showDetailsPreview={form.showDetailsPreview}
          setShowDetailsPreview={form.setShowDetailsPreview}
        />

        <NotesAttachmentsSection
          setPendingImages={form.setPendingImages}
          showHelp={form.showHelp}
          setShowHelp={form.setShowHelp}
        />

        <PendingImageList
          images={form.pendingImages}
          onRemove={(index) => form.setPendingImages((p) => p.filter((_, j) => j !== index))}
        />
      </div>

      <NotesFooterActions submit={submit} />
    </SidebarPanel>
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
    const typeCommands = ["!clue", "!code", "!observation", "!theory", "!book", "!todo"];
    const q = token.toLowerCase();
    return typeCommands
      .filter((cmd) => cmd.includes(q))
      .map((cmd) => ({ value: cmd, hint: "type" }));
  }

  return [];
}
