import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ImagePlus, X, Info } from "lucide-react";
import type { NoteType, Priority } from "@/lib/types";
import { DEFAULT_ROOMS, ROOM_CATEGORIES, type RoomCategory } from "@/lib/rooms";

const NOTE_TYPES: { value: NoteType; label: string }[] = [
  { value: "clue", label: "Clue" },
  { value: "code", label: "Code" },
  { value: "observation", label: "Observation" },
  { value: "theory", label: "Theory" },
  { value: "book", label: "Book" },
  { value: "task", label: "Task" },
];

const ROOMS_BY_CATEGORY = ROOM_CATEGORIES.reduce(
  (acc, cat) => {
    acc[cat] = DEFAULT_ROOMS.filter((r) => r.category === cat);
    return acc;
  },
  {} as Record<RoomCategory, typeof DEFAULT_ROOMS>,
);

const NONE = "__none__";

export function QuickCapture() {
  const open = useStore((s) => s.captureOpen);
  const close = useStore((s) => s.closeCapture);
  const openCap = useStore((s) => s.openCapture);
  const kind = useStore((s) => s.captureDefault);
  const prefill = useStore((s) => s.capturePrefill);
  const prefillRoom = useStore((s) => s.capturePrefillRoom);
  const gridCells = useStore((s) => s.gridCells);
  const create = useStore((s) => s.createFromCapture);

  const [mode, setMode] = useState<"note" | "todo">(kind);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<NoteType>("clue");
  const [room, setRoom] = useState<string>("");
  const [tagsInput, setTagsInput] = useState("");
  const [priority, setPriority] = useState<Priority>("med");
  const [body, setBody] = useState("");
  const [pendingImages, setPendingImages] = useState<Blob[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Rooms placed on the map get priority in the dropdown
  const placedRooms = useMemo(() => {
    const set = new Set<string>();
    gridCells.forEach((c) => c.roomName && set.add(c.roomName));
    return Array.from(set).sort();
  }, [gridCells]);

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
      setType(kind === "todo" ? "task" : "clue");
      setRoom(prefillRoom ?? "");
      setTagsInput("");
      setPriority("med");
      setBody("");
      setPendingImages([]);
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
      type: mode === "note" ? type : undefined,
      room: room || undefined,
      tags,
      priority: mode === "todo" ? priority : undefined,
    });
    // Optional body: if user typed body, save it via update
    if (body.trim()) {
      // append body to the most recent note (cheap; we know it's first in store)
      const st = useStore.getState();
      if (mode === "note" && st.notes[0]) {
        await st.saveNote({ ...st.notes[0], body });
      } else if (mode === "todo" && st.todos[0]) {
        await st.saveTodo({ ...st.todos[0], notes: body });
      }
    }
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
            Fill in the fields below, or type shortcuts in the title.
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
            <Input
              ref={inputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  submit(e.shiftKey);
                }
              }}
              placeholder={
                mode === "todo" ? "Check Den bookshelf" : "Parlor safe = 4271"
              }
              className="h-10"
            />
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
              <Select
                value={room || NONE}
                onValueChange={(v) => setRoom(v === NONE ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>— None —</SelectItem>
                  {placedRooms.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>On your map</SelectLabel>
                      {placedRooms.map((r) => (
                        <SelectItem key={`p-${r}`} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                  {ROOM_CATEGORIES.map((cat) => (
                    <SelectGroup key={cat}>
                      <SelectLabel>{cat}</SelectLabel>
                      {ROOMS_BY_CATEGORY[cat].map((r) => (
                        <SelectItem key={r.name} value={r.name}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Tags{" "}
              <span className="text-muted-foreground/70 normal-case">
                (space or comma separated)
              </span>
            </label>
            <Input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="safe, gem, puzzle"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Details {mode === "todo" ? "(optional)" : "(optional)"}
            </label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Longer note, paste evidence here, or details about the task…"
              rows={3}
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
            <div className="rounded-md border border-border bg-card/60 p-2 text-[11px] text-muted-foreground">
              You can type these directly inside the title — they auto-fill the
              fields:
              <div className="mt-1 flex flex-wrap gap-1">
                <code className="rounded bg-accent px-1">#tag</code> add a tag
                <code className="rounded bg-accent px-1">@room_name</code> set room
                <code className="rounded bg-accent px-1">!clue</code> /
                <code className="rounded bg-accent px-1">!code</code> /
                <code className="rounded bg-accent px-1">!task</code> set type
                <code className="rounded bg-accent px-1">high</code> /
                <code className="rounded bg-accent px-1">low</code> priority
              </div>
            </div>
          )}

          {pendingImages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {pendingImages.map((b, i) => (
                <div
                  key={i}
                  className="relative h-14 w-14 overflow-hidden rounded border border-border"
                >
                  <img
                    src={URL.createObjectURL(b)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <button
                    onClick={() =>
                      setPendingImages((p) => p.filter((_, j) => j !== i))
                    }
                    className="absolute right-0 top-0 rounded-bl bg-black/60 p-0.5 text-white"
                    aria-label="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <p className="text-[11px] text-muted-foreground">
            ⌘/Ctrl+Enter to save · Shift to keep open
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => submit(true)}>
              Save & add another
            </Button>
            <Button
              onClick={() => submit(false)}
              className="bg-brass text-brass-foreground hover:bg-brass/90"
            >
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
