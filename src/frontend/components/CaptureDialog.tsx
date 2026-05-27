import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/frontend/data/store";
import { INPUT_BASE_CLASS, TEXTAREA_BASE_CLASS } from "@/frontend/components/common/formClasses";
import { buttonClass } from "@/frontend/components/common/buttonClasses";
import { Tabs, TabsList, TabsTrigger } from "@/frontend/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/frontend/components/ui/dialog";
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
import { NOTE_TYPES } from "@/frontend/components/capture/constants";
import { CaptureShortcutHelp } from "@/frontend/components/capture/CaptureShortcutHelp";
import { PendingImageList } from "@/frontend/components/capture/PendingImageList";

interface CaptureSuggestion {
  value: string;
  hint: string;
}

export function CaptureDialog() {
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

  const [mode, setMode] = useState<"note" | "todo">(kind);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<NoteType>("observation");
  const [room, setRoom] = useState<string>("");
  const [roomFocused, setRoomFocused] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [priority, setPriority] = useState<Priority>("med");
  const [body, setBody] = useState("");
  const [pendingImages, setPendingImages] = useState<Blob[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [cursorPos, setCursorPos] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

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
    return roomOptions
      .filter((r) => r.toLowerCase().includes(q))
      .slice(0, 8);
  }, [room, roomOptions]);

  const suggestions = useMemo(() => {
    return buildSuggestions(activeToken, roomOptions, tagSuggestions);
  }, [activeToken, roomOptions, tagSuggestions]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tgt = e.target as HTMLElement;
      const typing = tgt && /input|textarea|select/i.test(tgt.tagName);
      if ((e.key === "n" || e.key === "N") && !typing && !e.metaKey && !e.ctrlKey && !open) {
        e.preventDefault();
        openCap();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, openCap]);

  useEffect(() => {
    if (open) {
      setMode(kind);
      setTitle(prefill);
      setType("observation");
      setRoom(prefillRoom ?? "");
      setTagsInput("");
      setPriority("med");
      setBody("");
      setPendingImages([]);
      setCursorPos(prefill.length);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, kind, prefill, prefillRoom]);

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
  }, [open]);

  async function submit(keepOpen: boolean) {
    if (!title.trim() && pendingImages.length === 0) return;
    const tags = tagsInput
      .split(/[\s,]+/)
      .map((t) => t.replace(/^#/, "").trim().toLowerCase())
      .filter(Boolean);
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
      setTitle("");
      setBody("");
      setPendingImages([]);
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      close();
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? openCap() : close())}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            New {mode === "todo" ? "todo" : "note"}
          </DialogTitle>
          <DialogDescription>
            Fill in the fields below, or type commands like @room, #tag, and !todo.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as "note" | "todo")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="note">📝 Note</TabsTrigger>
            <TabsTrigger value="todo">✓ Todo</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Title
            </label>
            <input
              ref={inputRef}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setCursorPos(e.target.selectionStart ?? e.target.value.length);
              }}
              onClick={(e) => setCursorPos(e.currentTarget.selectionStart ?? title.length)}
              onKeyUp={(e) => setCursorPos((e.currentTarget as HTMLInputElement).selectionStart ?? title.length)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  submit(e.shiftKey);
                }
              }}
              placeholder={
                mode === "todo" ? "Check Den bookshelf" : "Parlor safe = 4271"
              }
              className={`${INPUT_BASE_CLASS} h-10`}
            />
            {suggestions.length > 0 && (
              <div className="mt-1 rounded-md border border-border bg-card p-1">
                <div className="mb-1 px-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  Suggestions
                </div>
                <div className="flex flex-wrap gap-1">
                  {suggestions.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        const next = `${title.slice(0, activeToken.start)}${s.value} ${title.slice(activeToken.end).trimStart()}`.trim();
                        setTitle(next);
                        setCursorPos(next.length);
                        setTimeout(() => inputRef.current?.focus(), 0);
                      }}
                      className="rounded border border-border bg-secondary px-2 py-0.5 text-xs text-foreground hover:border-brass"
                    >
                      {s.value}
                      <span className="ml-1 text-[10px] text-muted-foreground">{s.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {mode === "note" ? (
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Type / category
                </label>
                <Select value={type} onValueChange={(v) => setType(v as NoteType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Priority
                </label>
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

            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Room
              </label>
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
                  <div className="absolute z-50 mt-1 max-h-40 w-full overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Tags{" "}
              <span className="text-muted-foreground/70 normal-case">
                (space or comma separated)
              </span>
            </label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="safe, gem, puzzle"
              className={INPUT_BASE_CLASS}
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Details {mode === "todo" ? "(optional)" : "(optional)"}
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Longer note, paste evidence here, or details about the todo…"
              rows={3}
              className={TEXTAREA_BASE_CLASS}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="cursor-pointer rounded-md border border-input bg-secondary px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground">
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
                  setPendingImages((p) => [...p, ...files]);
                  e.target.value = "";
                }}
              />
            </label>
            <button
              type="button"
              onClick={() => setShowHelp((v) => !v)}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <Info className="h-3 w-3" /> Shortcuts
            </button>
          </div>

          {showHelp && (
            <CaptureShortcutHelp />
          )}
          <PendingImageList
            images={pendingImages}
            onRemove={(index) => setPendingImages((p) => p.filter((_, j) => j !== index))}
          />
        </div>

        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <p className="text-[11px] text-muted-foreground">
            ⌘/Ctrl+Enter to save · Shift to keep open
          </p>
          <div className="flex gap-2">
            <button className={buttonClass({ variant: "ghost" })} onClick={() => submit(true)}>
              Save & add another
            </button>
            <button
              onClick={() => submit(false)}
              className={buttonClass({ className: "bg-brass text-brass-foreground hover:bg-brass/90" })}
            >
              Save
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
): CaptureSuggestion[] {
  const token = activeToken.token;
  if (!token) return [];

  const normalize = (value: string) =>
    value
      .toLowerCase()
      .replace(/[.,!?;:]+$/g, "")
      .replace(/_/g, " ")
      .trim();

  if (token.startsWith("@") || /^room:/i.test(token)) {
    const q = token.startsWith("@")
      ? normalize(token.slice(1))
      : normalize(token.slice(5));
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
