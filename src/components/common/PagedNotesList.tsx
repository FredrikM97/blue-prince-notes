/**
 * PagedNotesList — shows a list of notes one at a time with prev/next navigation.
 *
 * Used in the map right panel (notes in a room) and the images right panel (notes linked to
 * an image). Both panels show the same rich note card: title, markdown body, and type/tag chips.
 *
 * When only one note exists the navigation controls are hidden.
 * Changing the `notes` array length resets the active index via key — callers should pass an
 * appropriate `key` prop when the context changes (e.g. selected cell, selected image).
 */
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Chip } from "@/components/common/Chip";
import { MarkdownPreview } from "@/components/common/markdown/MarkdownPreview";
import type { Note } from "@/lib/types";

export function PagedNotesList({
  notes,
  title,
  emptyLabel = "No notes.",
}: {
  notes: Note[];
  title: string;
  emptyLabel?: string;
}) {
  const [index, setIndex] = useState(0);
  const total = notes.length;
  const safeIndex = total === 0 ? 0 : ((index % total) + total) % total;
  const note = notes[safeIndex] ?? null;

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        {total > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIndex((i) => ((i - 1) % total + total) % total)}
              aria-label="Previous note"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums">
              {safeIndex + 1} / {total}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIndex((i) => (i + 1) % total)}
              aria-label="Next note"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {note ? (
        <div className="rounded bg-card/60 p-2 text-sm space-y-1.5">
          <p className="font-medium leading-snug">{note.title}</p>
          {note.body.trim() && <MarkdownPreview>{note.body}</MarkdownPreview>}
          <div className="flex flex-wrap gap-1">
            <Chip className="border-border text-foreground">{note.type}</Chip>
            {note.imageIds.length > 0 && (
              <Chip className="border-border text-foreground">📎 {note.imageIds.length}</Chip>
            )}
            {note.tags.map((tag) => (
              <Chip key={tag} className="border-border text-foreground">
                #{tag}
              </Chip>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{emptyLabel}</p>
      )}
    </div>
  );
}
