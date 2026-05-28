import { useEffect, useState } from "react";
import type { Note } from "@/lib/types";
import { INPUT_BASE_CLASS } from "@/components/common/formClasses";
import { BrassButton, GhostButton, IconButton } from "@/components/common/button";
import { RoomDropdown } from "@/components/common/RoomDropdown";
import { StoredImageView } from "@/components/StoredImageView";
import { useStore } from "@/data/store";
import { ImagePlus, X, HelpCircle } from "lucide-react";
import { TYPE_LABEL } from "./constants";
import { MarkdownEditor } from "@/components/common/MarkdownEditor";
import { NotesShortcutHelp } from "@/components/notes/NotesShortcutHelp";
import { formatAllMarkdownTables } from "@/components/common/markdown-table";
import { toast } from "sonner";

function parseTagsInput(value: string) {
  return value
    .split(/[\s,]+/)
    .map((token) => token.replace(/^#/, "").trim().toLowerCase())
    .filter(Boolean);
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
  const [showHelp, setShowHelp] = useState(false);
  const [tagsInput, setTagsInput] = useState(draft.tags.join(", "));
  const [isTagsFocused, setIsTagsFocused] = useState(false);

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

        {draft.imageIds.length > 0 ? (
          <div className="note-editor-images-grid">
            {draft.imageIds.map((id) => (
              <div key={id} className="note-editor-image-wrap">
                <StoredImageView
                  id={id}
                  className="h-16 w-16 rounded border border-border object-cover"
                />
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

      <div className="note-editor-footer">
        <GhostButton onClick={onCancel}>Cancel</GhostButton>
        <BrassButton size="sm" onClick={onSave}>
          Save
        </BrassButton>
      </div>
    </div>
  );
}
