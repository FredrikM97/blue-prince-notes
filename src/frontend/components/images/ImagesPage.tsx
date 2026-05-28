import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/frontend/components/common/EmptyState";
import { useStore } from "@/frontend/data/store";
import { Button, GhostButton } from "@/frontend/components/common/button";
import { PageLayout } from "@/frontend/components/common/PageLayout";
import { MarkdownPreview } from "@/frontend/components/common/MarkdownPreview";
import { StoredImageView } from "@/frontend/components/StoredImageView";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/frontend/components/common/dialog";
import { Trash2, ChevronLeft, ChevronRight, Expand } from "lucide-react";
import type { Note, StoredImage } from "@/lib/types";

export function ImagesPage() {
  const images = useStore((s) => s.images);
  const notes = useStore((s) => s.notes);
  const removeImage = useStore((s) => s.removeImage);
  const search = useStore((s) => s.search);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return images;
    return images.filter((i) => `${i.name}`.toLowerCase().includes(q));
  }, [images, search]);

  const selectedIndex = useMemo(
    () => filtered.findIndex((img) => img.id === selectedId),
    [filtered, selectedId],
  );
  const selected = selectedIndex >= 0 ? filtered[selectedIndex] : null;

  const relatedNotes = useMemo(
    () => (selected ? notes.filter((note) => note.imageIds.includes(selected.id)) : []),
    [notes, selected],
  );

  useEffect(() => {
    if (!selectedId) return;
    if (!filtered.some((img) => img.id === selectedId)) {
      setSelectedId(filtered[0]?.id ?? null);
      setPreviewOpen(false);
    }
  }, [filtered, selectedId]);

  const selectByOffset = useCallback(
    (offset: number) => {
      if (filtered.length === 0) return;
      if (selectedIndex < 0) {
        setSelectedId(filtered[0].id);
        return;
      }
      const next = (selectedIndex + offset + filtered.length) % filtered.length;
      setSelectedId(filtered[next].id);
    },
    [filtered, selectedIndex],
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing = target && /input|textarea|select|button/i.test(target.tagName);
      if (typing) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        selectByOffset(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        selectByOffset(1);
      } else if (e.key === "Enter") {
        if (!selected) return;
        e.preventDefault();
        setPreviewOpen(true);
      } else if (e.key === "Escape") {
        setPreviewOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected, selectByOffset]);

  return (
    <PageLayout
      leftSidebar={<ImagesLeftPanel total={filtered.length} />}
      middle={
        filtered.length === 0 ? (
          <EmptyState>
            No images yet. Add one from note capture or from a note&apos;s editor.
          </EmptyState>
        ) : (
          <div className="images-grid">
            {filtered.map((img) => (
              <ImageThumb
                key={img.id}
                img={img}
                selected={img.id === selectedId}
                onClick={() => setSelectedId(img.id)}
              />
            ))}
          </div>
        )
      }
      rightSidebar={
        <ImagesRightPanel
          img={selected}
          relatedNotes={relatedNotes}
          previewOpen={previewOpen}
          setPreviewOpen={setPreviewOpen}
          onPrev={() => selectByOffset(-1)}
          onNext={() => selectByOffset(1)}
          onDelete={async () => {
            if (!selected) return;
            await removeImage(selected.id);
            if (filtered.length <= 1) {
              setSelectedId(null);
              return;
            }
            selectByOffset(1);
          }}
        />
      }
    >
      {/* middle content is provided via the `middle` prop */}
    </PageLayout>
  );
}

function ImagesLeftPanel({ total }: { total: number }) {
  return (
    <div className="page-layout-panel">
      <h1 className="font-serif text-2xl">Images</h1>
      <p className="mt-1 text-xs text-muted-foreground">{total} stored images</p>
      <p className="mt-3 text-xs text-muted-foreground">
        Click an image to open details in the right panel. Use the preview button there for full
        size.
      </p>
    </div>
  );
}

function ImageThumb({
  img,
  selected,
  onClick,
}: {
  img: StoredImage;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group images-thumb ${selected ? "images-thumb-selected" : ""}`}
    >
      <StoredImageView id={img.id} alt={img.name} className="images-thumb-image" />
      <div className="images-thumb-overlay">
        <div className="images-thumb-name">{img.name}</div>
      </div>
    </button>
  );
}

function ImagesRightPanel({
  img,
  relatedNotes,
  previewOpen,
  setPreviewOpen,
  onPrev,
  onNext,
  onDelete,
}: {
  img: StoredImage | null;
  relatedNotes: Note[];
  previewOpen: boolean;
  setPreviewOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onPrev: () => void;
  onNext: () => void;
  onDelete: () => void;
}) {
  if (!img) {
    return (
      <div className="page-layout-panel images-right-panel text-muted-foreground">
        Select an image to view details.
      </div>
    );
  }

  return (
    <ImagesInspectorPanel
      img={img}
      relatedNotes={relatedNotes}
      previewOpen={previewOpen}
      setPreviewOpen={setPreviewOpen}
      onPrev={onPrev}
      onNext={onNext}
      onDelete={onDelete}
    />
  );
}

function ImagesInspectorPanel({
  img,
  relatedNotes,
  previewOpen,
  setPreviewOpen,
  onPrev,
  onNext,
  onDelete,
}: {
  img: StoredImage;
  relatedNotes: Note[];
  previewOpen: boolean;
  setPreviewOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onPrev: () => void;
  onNext: () => void;
  onDelete: () => void;
}) {
  useEffect(() => {
    setPreviewOpen(false);
  }, [img, setPreviewOpen]);

  return (
    <>
      <div className="page-layout-panel images-right-panel">
        <div className="images-inspector-preview">
          <div className="images-right-header">
            <h2 className="images-detail-title">{img.name}</h2>
            <div className="images-nav-buttons">
              <Button variant="outline" size="icon" onClick={onPrev} aria-label="Previous image">
                <ChevronLeft />
              </Button>
              <Button variant="outline" size="icon" onClick={onNext} aria-label="Next image">
                <ChevronRight />
              </Button>
            </div>
          </div>

          <div className="images-detail-preview">
            <StoredImageView id={img.id} alt={img.name} className="images-detail-preview-image" />
          </div>
        </div>

        <div className="images-inspector-meta">
          <h3 className="images-linked-notes-title">Details from notes</h3>
          <div className="images-linked-notes-list">
            {relatedNotes.length > 0 ? (
              relatedNotes.slice(0, 3).map((note) => (
                <div key={note.id} className="images-linked-note-item">
                  <p className="images-linked-note-name">{note.title}</p>
                  {note.body.trim() ? (
                    <MarkdownPreview>{note.body}</MarkdownPreview>
                  ) : (
                    <p className="images-size-info">No details on this note yet.</p>
                  )}
                </div>
              ))
            ) : (
              <p className="images-size-info">No notes currently reference this image.</p>
            )}
          </div>

          <div className="images-detail-actions">
            <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
              <Expand /> Open preview
            </Button>
            <div className="images-detail-actions-right">
              <GhostButton className="text-destructive hover:text-destructive" onClick={onDelete}>
                <Trash2 />
              </GhostButton>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="images-zoom-dialog">
          <DialogHeader>
            <DialogTitle>{img.name}</DialogTitle>
          </DialogHeader>
          <div className="images-zoom-preview">
            <StoredImageView id={img.id} alt={img.name} className="images-zoom-image" />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
