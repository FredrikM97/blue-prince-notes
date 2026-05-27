import type { Note } from "@/lib/types";
import { INPUT_BASE_CLASS, TEXTAREA_BASE_CLASS } from "@/frontend/components/common/formClasses";
import { buttonClass } from "@/frontend/components/common/buttonClasses";
import { StoredImageView } from "@/frontend/components/StoredImageView";
import { useStore } from "@/frontend/data/store";
import { ImagePlus, X } from "lucide-react";
import { TYPE_LABEL } from "./constants";

export function NoteRowEditor({
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

  return (
    <div className="space-y-2">
      <input
        value={draft.title}
        onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        placeholder="Title"
        className={INPUT_BASE_CLASS}
      />
      <textarea
        value={draft.body}
        onChange={(e) => setDraft({ ...draft, body: e.target.value })}
        placeholder="Details..."
        rows={4}
        className={TEXTAREA_BASE_CLASS}
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          value={draft.room ?? ""}
          onChange={(e) => setDraft({ ...draft, room: e.target.value || undefined })}
          placeholder="Room"
          className={INPUT_BASE_CLASS}
        />
        <input
          value={draft.tags.join(" ")}
          onChange={(e) => setDraft({ ...draft, tags: e.target.value.split(/\s+/).filter(Boolean) })}
          placeholder="tags (space-sep)"
          className={INPUT_BASE_CLASS}
        />
      </div>

      <div className="space-y-2 rounded-md border border-border bg-card/30 p-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Attached images
          </span>
          <label className="cursor-pointer rounded-md border border-input bg-secondary px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
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
          <div className="flex flex-wrap gap-2">
            {draft.imageIds.map((id) => (
              <div key={id} className="relative">
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
                  className="absolute right-0 top-0 rounded-bl bg-black/60 p-0.5 text-white"
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

      <div className="flex items-center gap-2">
        <select
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          value={draft.type}
          onChange={(e) => setDraft({ ...draft, type: e.target.value as Note["type"] })}
        >
          {Object.keys(TYPE_LABEL).map((k) => (
            <option key={k} value={k}>
              {TYPE_LABEL[k as keyof typeof TYPE_LABEL]}
            </option>
          ))}
        </select>
        <select
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          value={draft.status}
          onChange={(e) => setDraft({ ...draft, status: e.target.value as Note["status"] })}
        >
          <option value="open">open</option>
          <option value="solved">solved</option>
          <option value="stale">stale</option>
        </select>
        <select
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          value={draft.scope}
          onChange={(e) => setDraft({ ...draft, scope: e.target.value as Note["scope"] })}
        >
          <option value="cross-run">cross-run</option>
          <option value="this-run">this-run</option>
        </select>
        <button
          className={buttonClass({
            size: "sm",
            className: "ml-auto bg-brass text-brass-foreground hover:bg-brass/90",
          })}
          onClick={onSave}
        >
          Save
        </button>
        <button className={buttonClass({ size: "sm", variant: "ghost" })} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
