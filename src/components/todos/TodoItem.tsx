import { useState } from "react";
import type { Todo, TodoStatus } from "@/lib/types";
import { Chip } from "@/components/common/Chip";
import { INPUT_BASE_CLASS } from "@/components/common/formClasses";
import { Trash2 } from "lucide-react";
import { todoPriorityClass } from "./constants";

export function TodoItem({
  todo,
  onToggle,
  onDelete,
  onEdit,
}: {
  todo: Todo;
  onToggle: (s: TodoStatus) => void;
  onDelete: () => void;
  onEdit: (t: Todo) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(todo.title);

  return (
    <li className="group flex items-start gap-2 px-3 py-2">
      <input
        type="checkbox"
        className="mt-1"
        checked={todo.status === "done"}
        onChange={(e) => onToggle(e.target.checked ? "done" : "open")}
      />
      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              setEditing(false);
              if (title.trim() && title !== todo.title) onEdit({ ...todo, title: title.trim() });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              if (e.key === "Escape") {
                setTitle(todo.title);
                setEditing(false);
              }
            }}
            className={`${INPUT_BASE_CLASS} h-7`}
          />
        ) : (
          <button
            className={`text-left text-sm ${
              todo.status === "done" ? "text-muted-foreground line-through" : ""
            }`}
            onDoubleClick={() => setEditing(true)}
          >
            {todo.title}
          </button>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-1">
          <Chip className={`border-transparent ${todoPriorityClass(todo.priority)}`}>
            {todo.priority}
          </Chip>
          <Chip className="border-border text-foreground">{todo.scope}</Chip>
          {todo.room && <Chip className="border-brass/40 text-brass">@{todo.room}</Chip>}
          {todo.tags.map((tag) => (
            <Chip key={tag} className="border-border bg-secondary text-foreground">
              #{tag}
            </Chip>
          ))}
          <select
            className="ml-auto h-6 rounded border border-input bg-background px-1 text-[11px] opacity-0 group-hover:opacity-100"
            value={todo.status}
            onChange={(e) => onToggle(e.target.value as TodoStatus)}
          >
            <option value="open">open</option>
            <option value="in-progress">in progress</option>
            <option value="done">done</option>
          </select>
        </div>
      </div>
      <button
        onClick={onDelete}
        className="rounded p-1 text-muted-foreground opacity-0 hover:bg-destructive/20 hover:text-destructive group-hover:opacity-100"
        aria-label="Delete"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}
