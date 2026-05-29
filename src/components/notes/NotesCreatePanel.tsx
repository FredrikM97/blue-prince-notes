import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useStore } from "@/data/store";
import { INPUT_BASE_CLASS } from "@/components/common/FormClasses";
import { GhostButton, BrassButton, IconButton } from "@/components/common/Button";
import { RoomDropdown } from "@/components/common/dropdowns/RoomDropdown";
import { Tabs, TabsList, TabsTrigger } from "@/components/common/Tabs";
import { DropdownSelect } from "@/components/common/dropdowns/DropdownSelect";
import { toast } from "sonner";
import { ImagePlus } from "lucide-react";
import type { NoteType, Priority } from "@/lib/types";
import { NOTE_TYPES } from "@/lib/noteMetadata";
import { PendingImageList } from "@/components/common/inputs/PendingImageList";
import { DetailsField } from "@/components/common/inputs/DetailsField";
import { TokenInputField } from "@/components/common/inputs/TokenInputField";

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
  const create = useStore((s) => s.createFromCapture);

  return {
    open,
    close,
    kind,
    prefill,
    prefillRoom,
    prefillType,
    returnTo,
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
        <TokenInputField
          label="Title"
          value={form.title}
          onChange={form.setTitle}
          placeholder={form.mode === "todo" ? "Check Den bookshelf" : "Parlor safe = 4271"}
          onSubmitShortcut={submit}
          inputClassName={`${INPUT_BASE_CLASS} h-10`}
          ariaLabel="Title suggestions"
          autoFocus
        />

        <DetailsField
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
