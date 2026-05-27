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
        <section className="mt-5 space-y-3 border-t border-border pt-3">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Images ({note.imageIds.length})
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {note.imageIds.map((id) => (
            <button
              key={id}
              type="button"
              className="overflow-hidden rounded border border-border transition-colors hover:border-brass"
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
          <div className="max-h-[75vh] overflow-hidden rounded border border-border bg-black/60 p-2">
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
