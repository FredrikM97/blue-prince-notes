import type { Note } from "@/lib/types";
import { Chip } from "@/components/common/Chip";
import { MarkdownPreview } from "@/components/common/markdown/MarkdownPreview";
import { AttachedImagesGallery } from "@/components/common/AttachedImagesGallery";
import { MetaRow, PreviewSection, PreviewTimestamps } from "@/components/common/PreviewContent";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/common/Dialog";

export function NotePreviewContent({ note }: { note: Note }) {
  return (
    <>
      <MetaRow label="Status">
        <Chip className="border-border text-foreground">{note.status}</Chip>
      </MetaRow>
      <MetaRow label="Scope">
        <Chip className="border-border text-foreground">{note.scope}</Chip>
      </MetaRow>
      {note.room && (
        <MetaRow label="Room">
          <Chip className="border-brass/40 text-brass">@{note.room}</Chip>
        </MetaRow>
      )}
      {note.tags.length > 0 && (
        <MetaRow label="Tags">
          <span className="flex flex-wrap gap-1">
            {note.tags.map((tag) => (
              <Chip key={tag} className="border-border bg-secondary text-foreground">
                #{tag}
              </Chip>
            ))}
          </span>
        </MetaRow>
      )}
      {note.body && (
        <PreviewSection>
          <MarkdownPreview>{note.body}</MarkdownPreview>
        </PreviewSection>
      )}

      {note.imageIds.length > 0 && (
        <PreviewSection>
          <AttachedImagesGallery imageIds={note.imageIds} collapsible />
        </PreviewSection>
      )}

      <PreviewTimestamps createdAt={note.createdAt} updatedAt={note.updatedAt} />
    </>
  );
}

export function NotePreviewDialog({
  note,
  open,
  onOpenChange,
}: {
  note: Note | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!note) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-[90vw] max-w-2xl flex-col gap-4 p-6">
        <DialogHeader>
          <DialogTitle
            className={`font-serif text-xl ${
              note.status === "solved" ? "text-muted-foreground line-through" : ""
            }`}
          >
            {note.title}
          </DialogTitle>
          <p className="mt-0.5 text-xs text-muted-foreground capitalize">
            {note.type}
            {note.date ? ` · ${note.date}` : ""}
            {` · Created ${new Date(note.createdAt).toLocaleDateString()}`}
          </p>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
          <NotePreviewContent note={note} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
