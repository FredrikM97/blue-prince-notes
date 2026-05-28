import type { Note } from "@/lib/types";
import { MarkdownPreview } from "@/components/common/MarkdownPreview";
import { AttachedImagesGallery } from "@/components/common/AttachedImagesGallery";

export function NotesPreviewPanel({ note }: { note: Note }) {
  return (
    <>
      {note.date && (
        <p className="mb-3 text-xs text-muted-foreground">
          <span className="font-medium uppercase tracking-wider">Date</span> {note.date}
        </p>
      )}
      {note.body && <MarkdownPreview>{note.body}</MarkdownPreview>}
      <AttachedImagesGallery imageIds={note.imageIds} collapsible />
    </>
  );
}
