import { Chip } from "@/components/common/Chip";
import { MarkdownPreview } from "@/components/common/markdown/MarkdownPreview";
import { AttachedImagesGallery } from "@/components/common/AttachedImagesGallery";
import type { Note } from "@/lib/types";

/**
 * Right-side inspector panel for graph summary and selected entry details.
 */
export function GraphRightPanel({
  noteCount,
  edgeCount,
  selectedNote,
  incomingCount,
  outgoingCount,
}: {
  noteCount: number;
  edgeCount: number;
  selectedNote: Note | null;
  incomingCount: number;
  outgoingCount: number;
}) {
  const summary = (
    <div className="space-y-3 rounded-md border border-border/70 bg-card/50 p-3">
      <div>
        <h2 className="font-serif text-lg">Connections</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Arrows reflect explicit references in entry text: @room and #tag.
        </p>
      </div>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>{noteCount} entries</span>
        <span>{edgeCount} links</span>
      </div>
    </div>
  );

  if (!selectedNote) {
    return (
      <div className="page-layout-panel space-y-3">
        {summary}
        <p className="text-sm text-muted-foreground">Select a note node to inspect details.</p>
      </div>
    );
  }

  return (
    <div className="page-layout-panel space-y-4">
      {summary}

      <div>
        <h3 className="font-serif text-lg">{selectedNote.title}</h3>
      </div>

      <div className="space-y-2 rounded-md border border-border/70 bg-card/50 p-3">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Info
        </div>
        <div className="space-y-2 text-base">
          <div className="flex items-center gap-2">
            <span className="w-18 text-sm text-muted-foreground">Type</span>
            <Chip>{selectedNote.type}</Chip>
          </div>

          {selectedNote.room && (
            <div className="flex items-center gap-2">
              <span className="w-18 text-sm text-muted-foreground">Room</span>
              <Chip>@{selectedNote.room}</Chip>
            </div>
          )}

          {selectedNote.tags.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="w-18 pt-1 text-sm text-muted-foreground">Tags</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedNote.tags.map((tag) => (
                  <Chip key={tag}>#{tag}</Chip>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>Outgoing: {outgoingCount}</span>
            <span>Incoming: {incomingCount}</span>
          </div>
        </div>
      </div>

      <div className="h-px bg-border/80" />

      <div className="space-y-1">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Details
        </div>
        {selectedNote.body.trim() ? (
          <MarkdownPreview>{selectedNote.body}</MarkdownPreview>
        ) : (
          <p className="text-xs text-muted-foreground">No details written for this note yet.</p>
        )}

        <AttachedImagesGallery
          imageIds={selectedNote.imageIds}
          wrapperClassName="mt-3"
          gridClassName="grid grid-cols-2 gap-2"
          itemButtonClassName="rounded p-1 transition-colors hover:bg-muted/40"
          imageClassName="h-20 w-full rounded object-cover"
          labelClassName="mt-1 truncate text-[11px] text-muted-foreground"
          dialogPreviewClassName="mx-auto max-h-[70vh] w-full overflow-hidden rounded-md bg-muted/20 p-2"
        />
      </div>
    </div>
  );
}
