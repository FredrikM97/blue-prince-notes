import { useEffect, useMemo, useState } from "react";
import type { Note } from "@/lib/types";
import { INPUT_BASE_CLASS } from "@/components/common/formClasses";
import { BrassButton, Button, GhostButton, IconButton } from "@/components/common/button";
import { RoomDropdown } from "@/components/common/RoomDropdown";
import { StoredImageView } from "@/components/StoredImageView";
import { useStore } from "@/data/store";
import { ImagePlus, X, HelpCircle } from "lucide-react";
import { TYPE_LABEL } from "./constants";
import { MarkdownEditor } from "@/components/common/MarkdownEditor";
import { NotesShortcutHelp } from "@/components/notes/NotesShortcutHelp";
import { formatAllMarkdownTables } from "@/components/common/markdown-table";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/common/dialog";

type ImageSort = "newest" | "oldest" | "name-asc" | "name-desc";

function parseTagsInput(value: string) {
  return value
    .split(/[\s,]+/)
    .map((token) => token.replace(/^#/, "").trim().toLowerCase())
    .filter(Boolean);
}

function getImageLabel(img: { name: string; caption?: string }) {
  return img.caption?.trim() || img.name;
}

export function NotesEditorPanel({
  draft,
  setDraft,
  onSave,
  onCancel,
}: {
  draft: Note;
  setDraft: React.Dispatch<React.SetStateAction<Note>>;
  onSave: () => Promise<void>;
  onCancel: () => void;
}) {
  const addImage = useStore((s) => s.addImage);
  const images = useStore((s) => s.images);
  const [showHelp, setShowHelp] = useState(false);
  const [tagsInput, setTagsInput] = useState(draft.tags.join(", "));
  const [isTagsFocused, setIsTagsFocused] = useState(false);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const imageById = useMemo(() => new Map(images.map((img) => [img.id, img])), [images]);

  useEffect(() => {
    if (isTagsFocused) return;
    setTagsInput(draft.tags.join(", "));
  }, [draft.id, draft.tags, isTagsFocused]);

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;

      const images: File[] = [];
      for (const item of items) {
        if (!item.type.startsWith("image/")) continue;
        const file = item.getAsFile();
        if (file) images.push(file);
      }

      if (images.length === 0) return;

      void (async () => {
        try {
          const created = await Promise.all(images.map((f) => addImage(f, f.name)));
          const newIds = created.map((img) => img.id);
          setDraft((prev) => ({
            ...prev,
            imageIds: Array.from(new Set([...prev.imageIds, ...newIds])),
          }));
          toast.success(images.length === 1 ? "Pasted image attached" : "Pasted images attached");
        } catch {
          toast.error("Could not attach pasted image");
        }
      })();
    }

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [addImage, setDraft]);

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
    <div className="note-editor-wrap">
      <div>
        <label className="capture-label">Title</label>
        <input
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              onSave();
            }
          }}
          placeholder="Title"
          className={INPUT_BASE_CLASS}
        />
      </div>

      <div>
        <label className="capture-label">
          Details <span className="text-muted-foreground/70 normal-case">(optional)</span>
        </label>
        <MarkdownEditor
          value={draft.body}
          onChange={(v) => setDraft({ ...draft, body: v })}
          onFormatTables={() => setDraft({ ...draft, body: formatAllMarkdownTables(draft.body) })}
          placeholder="Details (markdown supported)…"
          rows={12}
          extraTools={shortcutToggle}
        />
        {showHelp && (
          <div className="mt-1">
            <NotesShortcutHelp />
          </div>
        )}
      </div>

      <div className="note-editor-grid-2">
        <div>
          <label className="capture-label">Room</label>
          <RoomDropdown
            value={draft.room ?? ""}
            onValueChange={(next) => setDraft({ ...draft, room: next || undefined })}
            clearLabel="No room"
          />
        </div>
        <div>
          <label className="capture-label">
            Tags{" "}
            <span className="text-muted-foreground/70 normal-case">(space or comma separated)</span>
          </label>
          <input
            value={tagsInput}
            onFocus={() => setIsTagsFocused(true)}
            onBlur={() => setIsTagsFocused(false)}
            onChange={(e) => {
              const next = e.target.value;
              setTagsInput(next);
              setDraft({ ...draft, tags: parseTagsInput(next) });
            }}
            placeholder="safe, gem, puzzle"
            className={INPUT_BASE_CLASS}
          />
        </div>
      </div>

      <div className="note-editor-grid-3">
        <div>
          <label className="capture-label">Date</label>
          <input
            value={draft.date ?? ""}
            onChange={(e) => setDraft({ ...draft, date: e.target.value || undefined })}
            placeholder="Free text (e.g. Day 3, after library puzzle)"
            className={INPUT_BASE_CLASS}
          />
        </div>
        <div>
          <label className="capture-label">Type</label>
          <select
            className="note-editor-select w-full"
            value={draft.type}
            onChange={(e) => setDraft({ ...draft, type: e.target.value as Note["type"] })}
          >
            {Object.keys(TYPE_LABEL).map((k) => (
              <option key={k} value={k}>
                {TYPE_LABEL[k as keyof typeof TYPE_LABEL]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="capture-label">Status</label>
          <select
            className="note-editor-select w-full"
            value={draft.status}
            onChange={(e) => setDraft({ ...draft, status: e.target.value as Note["status"] })}
          >
            <option value="open">open</option>
            <option value="solved">solved</option>
            <option value="stale">stale</option>
          </select>
        </div>
      </div>

      <div className="note-editor-images-card">
        <div className="note-editor-images-header">
          <span className="note-editor-images-label">Attached images</span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setImagePickerOpen(true)}
            >
              Use existing
            </Button>
            <label className="note-editor-attach-label">
              <span className="inline-flex items-center gap-1">
                <ImagePlus className="h-3.5 w-3.5" /> Attach image
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const files = Array.from(e.target.files ?? []);
                  if (!files.length) return;
                  const created = await Promise.all(files.map((f) => addImage(f, f.name)));
                  const newIds = created.map((img) => img.id);
                  setDraft((prev) => ({
                    ...prev,
                    imageIds: Array.from(new Set([...prev.imageIds, ...newIds])),
                  }));
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>

        {draft.imageIds.length > 0 ? (
          <div className="note-editor-images-grid">
            {draft.imageIds.map((id) => (
              <div key={id} className="note-editor-image-wrap">
                <StoredImageView
                  id={id}
                  className="h-16 w-16 rounded border border-border object-cover"
                />
                <p className="mt-1 max-w-16 truncate text-[10px] text-muted-foreground" title={id}>
                  {getImageLabel(imageById.get(id) ?? { name: "Image" })}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      imageIds: prev.imageIds.filter((x) => x !== id),
                    }))
                  }
                  className="note-editor-image-remove"
                  aria-label="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No images attached to this note.</p>
        )}
      </div>

      <SelectExistingImagesDialog
        open={imagePickerOpen}
        onOpenChange={setImagePickerOpen}
        images={images}
        selectedImageIds={draft.imageIds}
        setDraft={setDraft}
      />

      <div className="note-editor-footer">
        <GhostButton onClick={onCancel}>Cancel</GhostButton>
        <BrassButton size="sm" onClick={onSave}>
          Save
        </BrassButton>
      </div>
    </div>
  );
}

function SelectExistingImagesDialog({
  open,
  onOpenChange,
  images,
  selectedImageIds,
  setDraft,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: Array<{ id: string; name: string; caption?: string; createdAt: number }>;
  selectedImageIds: string[];
  setDraft: React.Dispatch<React.SetStateAction<Note>>;
}) {
  const [imageSort, setImageSort] = useState<ImageSort>("newest");

  const selectedSet = useMemo(() => new Set(selectedImageIds), [selectedImageIds]);
  const sortedImages = useMemo(() => {
    if (!open) return [];
    const next = [...images];
    next.sort((a, b) => {
      if (imageSort === "newest") return b.createdAt - a.createdAt;
      if (imageSort === "oldest") return a.createdAt - b.createdAt;
      if (imageSort === "name-asc") return a.name.localeCompare(b.name);
      return b.name.localeCompare(a.name);
    });
    return next;
  }, [open, images, imageSort]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-hidden p-0 [&>button]:hidden">
        <DialogHeader className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle>Attach existing image</DialogTitle>
            <div className="flex items-center gap-2">
              <select
                className="note-editor-select h-8 rounded-md border border-input bg-background px-2 text-xs"
                value={imageSort}
                onChange={(e) => setImageSort(e.target.value as ImageSort)}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
              </select>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="shrink-0 border border-input"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-3.5 w-3.5" />
                Close
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Selected: {selectedImageIds.length} image{selectedImageIds.length === 1 ? "" : "s"}
          </p>
        </DialogHeader>

        {sortedImages.length > 0 ? (
          <div className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto p-4 sm:grid-cols-3">
            {sortedImages.map((img) => {
              const selected = selectedSet.has(img.id);
              return (
                <button
                  key={img.id}
                  type="button"
                  className={`rounded-md border p-2 text-left transition-colors hover:border-brass/60 hover:bg-muted/40 ${
                    selected ? "border-brass bg-brass/10" : "border-border"
                  }`}
                  onClick={() => {
                    setDraft((prev) => {
                      const nextIds = selected
                        ? prev.imageIds.filter((id) => id !== img.id)
                        : Array.from(new Set([...prev.imageIds, img.id]));
                      return { ...prev, imageIds: nextIds };
                    });
                    toast.success(selected ? "Image detached" : "Image attached");
                  }}
                >
                  <StoredImageView
                    id={img.id}
                    alt={img.name}
                    className="h-20 w-full rounded border border-border object-cover"
                  />
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p
                      className="min-w-0 flex-1 truncate text-xs text-muted-foreground"
                      title={`${getImageLabel(img)} (${img.name})`}
                    >
                      {getImageLabel(img)}
                    </p>
                    {selected ? (
                      <span className="rounded bg-brass px-1.5 py-0.5 text-[10px] font-medium text-brass-foreground">
                        Selected
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="px-6 py-8 text-sm text-muted-foreground">
            No available images to attach. Upload or paste a new image first.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
