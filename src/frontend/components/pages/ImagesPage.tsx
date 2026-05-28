import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/frontend/data/store";
import { Chip } from "@/frontend/components/common/Chip";
import { buttonClass } from "@/frontend/components/common/buttonClasses";
import { INPUT_BASE_CLASS } from "@/frontend/components/common/formClasses";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/frontend/components/ui/dialog";
import { Download, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import type { StoredImage } from "@/lib/types";

export function ImagesPage() {
  const images = useStore((s) => s.images);
  const removeImage = useStore((s) => s.removeImage);
  const updateImage = useStore((s) => s.updateImage);
  const search = useStore((s) => s.search);
  const [selected, setSelected] = useState<StoredImage | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return images;
    return images.filter((i) =>
      `${i.name} ${i.caption ?? ""} ${i.tags.join(" ")}`.toLowerCase().includes(q),
    );
  }, [images, search]);

  return (
    <div className="images-page">
      <header className="images-page-header">
        <h1>Images</h1>
        <p>Upload images from note capture or note editing.</p>
      </header>

      {filtered.length === 0 ? (
        <div className="images-page-empty">
          <p className="images-page-empty-text">
            No images yet. Add one from note capture or from a note's editor.
          </p>
        </div>
      ) : (
        <div className="images-grid">
          {filtered.map((img) => (
            <ImageThumb key={img.id} img={img} onClick={() => setSelected(img)} />
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="images-dialog-content">
          {selected && (
            <ImageDetail
              img={selected}
              onUpdate={async (i) => {
                await updateImage(i);
                setSelected(i);
              }}
              onDelete={async () => {
                if (confirm("Delete this image?")) {
                  await removeImage(selected.id);
                  setSelected(null);
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ImageThumb({ img, onClick }: { img: StoredImage; onClick: () => void }) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    const u = URL.createObjectURL(img.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [img.blob]);
  return (
    <button onClick={onClick} className="group images-thumb">
      {url && <img src={url} alt={img.name} className="images-thumb-image" />}
      <div className="images-thumb-overlay">
        <div className="images-thumb-name">{img.name}</div>
        {img.tags.length > 0 && (
          <div className="images-thumb-tags">
            {img.tags.slice(0, 3).map((t) => (
              <span key={t} className="images-thumb-tag">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

function ImageDetail({
  img,
  onUpdate,
  onDelete,
}: {
  img: StoredImage;
  onUpdate: (img: StoredImage) => void;
  onDelete: () => void;
}) {
  const [url, setUrl] = useState<string>();
  const [caption, setCaption] = useState(img.caption ?? "");
  const [tags, setTags] = useState(img.tags.join(" "));
  const [name, setName] = useState(img.name);

  useEffect(() => {
    const u = URL.createObjectURL(img.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [img.blob]);

  function download() {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = img.name;
    a.click();
  }

  async function copy() {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ [img.blob.type || "image/png"]: img.blob }),
      ]);
      toast.success("Image copied");
    } catch {
      toast.error("Couldn't copy image");
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="images-detail-title">{img.name}</DialogTitle>
      </DialogHeader>
      <div className="images-detail-preview">
        {url && <img src={url} alt={img.name} className="images-detail-preview-image" />}
      </div>
      <div className="images-detail-form">
        <input
          className={INPUT_BASE_CLASS}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
        />
        <input
          className={INPUT_BASE_CLASS}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Caption"
        />
        <input
          className={INPUT_BASE_CLASS}
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Tags (space-separated)"
        />
        <div className="images-detail-tags">
          {tags
            .split(/\s+/)
            .filter(Boolean)
            .map((t) => (
              <Chip key={t} className="images-detail-chip">
                #{t}
              </Chip>
            ))}
        </div>
      </div>
      <div className="images-detail-actions">
        <button
          className={buttonClass({
            size: "sm",
            variant: "outline",
            className: "images-action-button",
          })}
          onClick={download}
        >
          <Download className="images-action-icon" /> Download
        </button>
        <button
          className={buttonClass({
            size: "sm",
            variant: "outline",
            className: "images-action-button",
          })}
          onClick={copy}
        >
          <Copy className="images-action-icon" /> Copy
        </button>
        <button
          className={buttonClass({ size: "sm", className: "images-save-button" })}
          onClick={() =>
            onUpdate({
              ...img,
              name,
              caption: caption || undefined,
              tags: tags.split(/\s+/).filter(Boolean),
            })
          }
        >
          Save
        </button>
        <button
          className={buttonClass({
            size: "sm",
            variant: "ghost",
            className: "images-delete-button",
          })}
          onClick={onDelete}
        >
          <Trash2 className="images-delete-icon" />
        </button>
      </div>
    </>
  );
}
