import type { Todo } from "@/lib/types";
import { Chip } from "@/components/common/Chip";
import { MarkdownPreview } from "@/components/common/markdown/MarkdownPreview";
import { todoPriorityClass } from "./Constants";
import { MetaRow, PreviewSection, PreviewTimestamps } from "@/components/common/PreviewContent";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/common/Dialog";

export function TodoPreviewContent({ todo }: { todo: Todo }) {
  return (
    <>
      <MetaRow label="Status">
        <Chip className="border-border text-foreground">{todo.status}</Chip>
      </MetaRow>
      <MetaRow label="Priority">
        <Chip className={`border-transparent ${todoPriorityClass(todo.priority)}`}>
          {todo.priority}
        </Chip>
      </MetaRow>
      <MetaRow label="Scope">
        <Chip className="border-border text-foreground">{todo.scope}</Chip>
      </MetaRow>
      {todo.room && (
        <MetaRow label="Room">
          <Chip className="border-brass/40 text-brass">@{todo.room}</Chip>
        </MetaRow>
      )}
      {todo.tags.length > 0 && (
        <MetaRow label="Tags">
          <span className="flex flex-wrap gap-1">
            {todo.tags.map((tag) => (
              <Chip key={tag} className="border-border bg-secondary text-foreground">
                #{tag}
              </Chip>
            ))}
          </span>
        </MetaRow>
      )}

      {todo.notes && (
        <PreviewSection>
          <MarkdownPreview>{todo.notes}</MarkdownPreview>
        </PreviewSection>
      )}

      <PreviewTimestamps
        createdAt={todo.createdAt}
        updatedAt={todo.updatedAt}
        completedAt={todo.completedAt}
      />
    </>
  );
}

export function TodoPreviewDialog({
  todo,
  open,
  onOpenChange,
}: {
  todo: Todo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!todo) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-[90vw] max-w-2xl flex-col gap-4 p-6">
        <DialogHeader>
          <DialogTitle
            className={`font-serif text-xl ${
              todo.status === "done" ? "text-muted-foreground line-through" : ""
            }`}
          >
            {todo.title}
          </DialogTitle>
          <p className="mt-0.5 text-xs text-muted-foreground capitalize">
            {todo.status} · Created {new Date(todo.createdAt).toLocaleDateString()}
          </p>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
          <TodoPreviewContent todo={todo} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
