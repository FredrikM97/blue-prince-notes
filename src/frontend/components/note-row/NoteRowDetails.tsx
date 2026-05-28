import { useState } from "react";
import type { Note } from "@/lib/types";
import { StoredImageView } from "@/frontend/components/StoredImageView";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/frontend/components/common/dialog";
import { MarkdownPreview } from "@/frontend/components/common/MarkdownPreview";

export function NoteRowDetails({
  note,
}: {
  note: Note;
}) {
  const [zoomedImageId, setZoomedImageId] = useState<string | null>(null);

  return (
    <>
      {note.date && (
        <p className="mb-3 text-xs text-muted-foreground">
          <span className="font-medium uppercase tracking-wider">Date</span>{" "}
          {note.date}
        </p>
      )}
      {note.body && <MarkdownPreview>{note.body}</MarkdownPreview>}
      {note.imageIds.length > 0 && (
        <section className="note-details-images">
          <div className="note-details-images-label">
            Images ({note.imageIds.length})
          </div>
          <div className="note-details-images-grid">
          {note.imageIds.map((id) => (
            <button
              key={id}
              type="button"
              className="note-details-image-btn"
              onClick={() => setZoomedImageId(id)}
              aria-label="Open image preview"
            >
              <StoredImageView
                id={id}
                className="h-28 w-full object-cover"
                alt="Note image thumbnail"
              />
            </button>
          ))}
          </div>
        </section>
      )}

      <Dialog open={!!zoomedImageId} onOpenChange={(o) => !o && setZoomedImageId(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="font-serif">Image preview</DialogTitle>
          </DialogHeader>
          <div className="note-details-zoom-preview">
            {zoomedImageId && (
              <StoredImageView
                id={zoomedImageId}
                className="mx-auto max-h-[70vh] w-full object-contain"
                alt="Enlarged note image"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
