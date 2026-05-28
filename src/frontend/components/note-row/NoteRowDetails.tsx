import { useState } from "react";
import type { Note } from "@/lib/types";
import { StoredImageView } from "@/frontend/components/StoredImageView";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/frontend/components/ui/dialog";

export function NoteRowDetails({
  note,
}: {
  note: Note;
}) {
  const [zoomedImageId, setZoomedImageId] = useState<string | null>(null);

  return (
    <>
      {note.body && <p className="whitespace-pre-wrap text-sm leading-relaxed">{note.body}</p>}
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
