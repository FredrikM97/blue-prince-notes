import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import type { StoredImage } from "@/lib/types";

export const Route = createFileRoute("/images")({
  head: () => ({ meta: [{ title: "Images — Blue Prince Notes" }] }),
  component: ImagesPage,
});

function ImagesPage() {
  const images = useStore((s) => s.images);
  const addImage = useStore((s) => s.addImage);
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
    <div
      className="mx-auto max-w-7xl px-4 py-6"
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDrop={async (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files).filter((f) =>
          f.type.startsWith("image/"),
        );
        for (const f of files) await addImage(f, f.name);
        if (files.length) toast.success(`Added ${files.length} image(s)`);
      }}
    >
      <div className="mb-4 flex items-baseline justify-between">
        <h1 className="font-serif text-2xl">Images</h1>
        <label className="cursor-pointer">
          <Button size="sm" className="bg-brass text-brass-foreground hover:bg-brass/90" asChild>
            <span>Upload</span>
          </Button>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={async (e) => {
              const files = Array.from(e.target.files ?? []);
              for (const f of files) await addImage(f, f.name);
              e.target.value = "";
              if (files.length) toast.success(`Added ${files.length} image(s)`);
            }}
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No images. Drag & drop, paste with quick capture, or click Upload.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((img) => (
            <ImageThumb
              key={img.id}
              img={img}
              onClick={() => setSelected(img)}
            />
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl">
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
    <button
      onClick={onClick}
      className="group relative aspect-square overflow-hidden rounded border border-border bg-card hover:border-brass"
    >
      {url && <img src={url} alt={img.name} className="h-full w-full object-cover" />}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-left">
        <div className="truncate text-xs text-white">{img.name}</div>
        {img.tags.length > 0 && (
          <div className="mt-0.5 flex gap-1">
            {img.tags.slice(0, 3).map((t) => (
              <span key={t} className="text-[10px] text-white/70">#{t}</span>
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
        <DialogTitle className="font-serif">{img.name}</DialogTitle>
      </DialogHeader>
      <div className="max-h-[60vh] overflow-hidden rounded border border-border bg-black/50">
        {url && <img src={url} alt={img.name} className="mx-auto max-h-[60vh]" />}
      </div>
      <div className="grid gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <Input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Caption"
        />
        <Input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Tags (space-separated)"
        />
        <div className="flex flex-wrap gap-1">
          {tags
            .split(/\s+/)
            .filter(Boolean)
            .map((t) => (
              <Badge key={t} variant="secondary" className="text-[10px]">#{t}</Badge>
            ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={download}>
          <Download className="mr-1 h-4 w-4" /> Download
        </Button>
        <Button size="sm" variant="outline" onClick={copy}>
          <Copy className="mr-1 h-4 w-4" /> Copy
        </Button>
        <Button
          size="sm"
          className="ml-auto bg-brass text-brass-foreground hover:bg-brass/90"
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
        </Button>
        <Button size="sm" variant="ghost" className="text-destructive" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
}
