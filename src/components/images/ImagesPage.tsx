import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import { useStore } from "@/data/store";
import { Button, GhostButton } from "@/components/common/button";
import { PageLayout } from "@/components/common/PageLayout";
import { MarkdownPreview } from "@/components/common/MarkdownPreview";
import { StoredImageView } from "@/components/StoredImageView";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/common/dialog";
import { INPUT_BASE_CLASS } from "@/components/common/formClasses";
import { Trash2, ChevronLeft, ChevronRight, Expand } from "lucide-react";
import type { Note, StoredImage } from "@/lib/types";
import { toast } from "sonner";
import { loadSteamImportState, refreshSteamFolderImages } from "@/data/steamImport";

function getImageLabel(img: StoredImage): string {
  return img.caption?.trim() || img.name;
}

function formatLastRefreshTime(lastRefreshAt: number | null): string {
  if (!lastRefreshAt) return "Never";
  return new Date(lastRefreshAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function ImagesPage() {
  const images = useStore((s) => s.images);
  const notes = useStore((s) => s.notes);
  const addImage = useStore((s) => s.addImage);
  const removeImage = useStore((s) => s.removeImage);
  const updateImage = useStore((s) => s.updateImage);
  const search = useStore((s) => s.search);
  const deferredSearch = useDeferredValue(search);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [steamImportActive, setSteamImportActive] = useState(false);
  const [steamLastRefreshAt, setSteamLastRefreshAt] = useState<number | null>(null);
  const [refreshBusy, setRefreshBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const state = await loadSteamImportState();
      setSteamImportActive(state.enabled && Boolean(state.folderName));
      setSteamLastRefreshAt(state.lastRefreshAt);
    })();
  }, []);

  async function handleRefreshSteamImages() {
    setRefreshBusy(true);
    try {
      const result = await refreshSteamFolderImages(addImage);
      setSteamLastRefreshAt(Date.now());
      if (result.imported > 0) {
        toast.success(`Imported ${result.imported} screenshot${result.imported === 1 ? "" : "s"}`);
      } else {
        toast.success("No new Steam screenshots found");
      }
    } catch {
      toast.error("Could not refresh Steam screenshots");
    } finally {
      setRefreshBusy(false);
    }
  }

  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return images;
    return images.filter((i) => `${i.name} ${getImageLabel(i)}`.toLowerCase().includes(q));
  }, [images, deferredSearch]);

  const selectedIndex = useMemo(
    () => filtered.findIndex((img) => img.id === selectedId),
    [filtered, selectedId],
  );
  const selected = useMemo(() => {
    if (selectedIndex >= 0) return filtered[selectedIndex];
    return filtered[0] ?? null;
  }, [filtered, selectedIndex]);

  const relatedNotes = useMemo(
    () => (selected ? notes.filter((note) => note.imageIds.includes(selected.id)) : []),
    [notes, selected],
  );

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
      leftSidebar={
        <ImagesLeftPanel
          total={filtered.length}
          steamImportActive={steamImportActive}
          steamLastRefreshAt={steamLastRefreshAt}
          refreshBusy={refreshBusy}
          onRefreshSteam={handleRefreshSteamImages}
        />
      }
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
          onSaveLabel={async (label) => {
            if (!selected) return;
            const next = label.trim() || selected.name;
            if (next === getImageLabel(selected)) return;
            await updateImage({ ...selected, caption: next });
            toast.success("Image label updated");
          }}
        />
      }
    >
      {/* middle content is provided via the `middle` prop */}
    </PageLayout>
  );
}

function ImagesLeftPanel({
  total,
  steamImportActive,
  steamLastRefreshAt,
  refreshBusy,
  onRefreshSteam,
}: {
  total: number;
  steamImportActive: boolean;
  steamLastRefreshAt: number | null;
  refreshBusy: boolean;
  onRefreshSteam: () => Promise<void>;
}) {
  const refreshTime = formatLastRefreshTime(steamLastRefreshAt);

  return (
    <div className="page-layout-panel">
      <h1 className="font-serif text-2xl">Images</h1>
      <p className="mt-1 text-xs text-muted-foreground">{total} stored images</p>
      <p className="mt-2 text-xs text-muted-foreground">
        Click an image to open details in the right panel. Use the preview button there for full
        size.
      </p>

      {steamImportActive ? (
        <div className="mt-2 space-y-1.5">
          <h2 className="font-serif text-base">Steam Images</h2>
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void onRefreshSteam()}
              disabled={refreshBusy}
            >
              Refresh
            </Button>
            <span
              className="text-xs text-muted-foreground"
              title={steamLastRefreshAt ? new Date(steamLastRefreshAt).toLocaleString() : "Never"}
            >
              Last refresh: {refreshTime}
            </span>
          </div>
        </div>
      ) : null}
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
        <div className="images-thumb-name">{getImageLabel(img)}</div>
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
  onSaveLabel,
}: {
  img: StoredImage | null;
  relatedNotes: Note[];
  previewOpen: boolean;
  setPreviewOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onPrev: () => void;
  onNext: () => void;
  onDelete: () => void;
  onSaveLabel: (label: string) => Promise<void>;
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
      key={img.id}
      img={img}
      relatedNotes={relatedNotes}
      previewOpen={previewOpen}
      setPreviewOpen={setPreviewOpen}
      onPrev={onPrev}
      onNext={onNext}
      onDelete={onDelete}
      onSaveLabel={onSaveLabel}
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
  onSaveLabel,
}: {
  img: StoredImage;
  relatedNotes: Note[];
  previewOpen: boolean;
  setPreviewOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onPrev: () => void;
  onNext: () => void;
  onDelete: () => void;
  onSaveLabel: (label: string) => Promise<void>;
}) {
  const [labelInput, setLabelInput] = useState(getImageLabel(img));
  const [savingLabel, setSavingLabel] = useState(false);
  const [noteIndex, setNoteIndex] = useState(0);

  const activeRelatedNote =
    relatedNotes.length > 0
      ? relatedNotes[
          ((noteIndex % relatedNotes.length) + relatedNotes.length) % relatedNotes.length
        ]
      : null;

  function cycleRelatedNote(offset: number) {
    if (relatedNotes.length <= 1) return;
    setNoteIndex((prev) => (prev + offset + relatedNotes.length) % relatedNotes.length);
  }

  return (
    <>
      <div className="page-layout-panel images-right-panel">
        <div className="images-inspector-preview">
          <div className="images-right-header">
            <div className="min-w-0">
              <h2 className="images-detail-title truncate">{getImageLabel(img)}</h2>
              <p className="text-xs text-muted-foreground">File: {img.name}</p>
            </div>
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
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Label
            </label>
            <div className="flex items-center gap-2">
              <input
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                className={`${INPUT_BASE_CLASS} h-8 flex-1`}
                placeholder={img.name}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={savingLabel || labelInput.trim() === getImageLabel(img)}
                onClick={async () => {
                  setSavingLabel(true);
                  try {
                    await onSaveLabel(labelInput);
                  } finally {
                    setSavingLabel(false);
                  }
                }}
              >
                Save
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <h3 className="images-linked-notes-title">Details from notes</h3>
            {relatedNotes.length > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => cycleRelatedNote(-1)}
                  aria-label="Previous related note"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="text-xs text-muted-foreground">
                  {noteIndex + 1} / {relatedNotes.length}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => cycleRelatedNote(1)}
                  aria-label="Next related note"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
          <div className="images-linked-notes-list">
            {activeRelatedNote ? (
              <div key={activeRelatedNote.id} className="images-linked-note-item">
                <p className="images-linked-note-name">{activeRelatedNote.title}</p>
                {activeRelatedNote.body.trim() ? (
                  <MarkdownPreview>{activeRelatedNote.body}</MarkdownPreview>
                ) : (
                  <p className="images-size-info">No details on this note yet.</p>
                )}
              </div>
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
