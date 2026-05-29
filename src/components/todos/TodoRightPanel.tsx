import { useState } from "react";
import { MarkdownPreview } from "@/components/common/markdown/MarkdownPreview";
import { RightPreviewPanel } from "@/components/common/RightPreviewPanel";
import type { Todo } from "@/lib/types";
import { TodoPreviewDialog } from "./TodoPreviewDialog";

export function TodoRightPanel({ todo, onClose }: { todo: Todo; onClose: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <RightPreviewPanel
      title={todo.title}
      subtitle={`${todo.status} · Created ${new Date(todo.createdAt).toLocaleDateString()}`}
      strikethrough={todo.status === "done"}
      onExpand={() => setExpanded(true)}
      onClose={onClose}
      expandDialog={<TodoPreviewDialog todo={todo} open={expanded} onOpenChange={setExpanded} />}
    >
      {todo.notes ? (
        <MarkdownPreview>{todo.notes}</MarkdownPreview>
      ) : (
        <p className="text-xs text-muted-foreground">No notes added.</p>
      )}
    </RightPreviewPanel>
  );
}
