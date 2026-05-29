import { useState } from "react";
import { ChevronLeft, ChevronRight, Expand, Trash2 } from "lucide-react";
import { Button, GhostButton } from "@/components/common/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/common/Dialog";
import { INPUT_BASE_CLASS } from "@/components/common/FormClasses";
import { MarkdownPreview } from "@/components/common/markdown/MarkdownPreview";
import { StoredImageView } from "@/components/StoredImageView";
import type { Note, StoredImage } from "@/lib/types";

function getImageLabel(img: StoredImage): string {
  return img.caption?.trim() || img.name;
}

/**
 * Right panel wrapper for image details and actions.
 */
export function ImagesRightPanel({
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
                <span className="sr-only">Delete image</span>
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
