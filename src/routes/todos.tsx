import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import type { Todo, TodoStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/todos")({
  head: () => ({ meta: [{ title: "Todos — Blue Prince Notes" }] }),
  component: TodosPage,
});

const STATUSES: { value: TodoStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in-progress", label: "In progress" },
  { value: "done", label: "Done" },
];

function TodosPage() {
  const todos = useStore((s) => s.todos);
  const search = useStore((s) => s.search);
  const openCapture = useStore((s) => s.openCapture);
  const toggle = useStore((s) => s.toggleTodoStatus);
  const remove = useStore((s) => s.removeTodo);
  const save = useStore((s) => s.saveTodo);
  const [scopeFilter, setScopeFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return todos.filter((t) => {
      if (scopeFilter && t.scope !== scopeFilter) return false;
      if (q && !`${t.title} ${t.tags.join(" ")} ${t.room ?? ""}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [todos, search, scopeFilter]);

  const grouped: Record<TodoStatus, Todo[]> = {
    open: [],
    "in-progress": [],
    done: [],
  };
  filtered.forEach((t) => grouped[t.status].push(t));

  const thisRunOpen = filtered.filter((t) => t.scope === "this-run" && t.status !== "done");

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-serif text-2xl">Todos</h1>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-md bg-secondary p-1 text-xs">
            {[
              { v: null, label: "All" },
              { v: "this-run", label: "This run" },
              { v: "cross-run", label: "Cross-run" },
              { v: "someday", label: "Someday" },
            ].map((o) => (
              <button
                key={String(o.v)}
                onClick={() => setScopeFilter(o.v)}
                className={`rounded px-2 py-1 ${
                  scopeFilter === o.v ? "bg-brass text-brass-foreground" : "text-muted-foreground"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
          <Button
            size="sm"
            className="bg-brass text-brass-foreground hover:bg-brass/90"
            onClick={() => openCapture({ kind: "todo" })}
          >
            Add todo
          </Button>
        </div>
      </div>

      {thisRunOpen.length > 0 && scopeFilter !== "cross-run" && scopeFilter !== "someday" && (
        <div className="mb-6 rounded-lg border border-brass/40 bg-brass/5 p-3">
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-brass">
            This run · {thisRunOpen.length} open
          </div>
          <ul className="space-y-1">
            {thisRunOpen.map((t) => (
              <li key={t.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={false}
                  onCheckedChange={() => toggle(t.id, "done")}
                />
                <span>{t.title}</span>
                {t.room && (
                  <Badge variant="outline" className="border-brass/40 text-brass">
                    @{t.room}
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {STATUSES.map((col) => (
          <div key={col.value} className="rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <h2 className="font-serif text-sm uppercase tracking-wider text-muted-foreground">
                {col.label}
              </h2>
              <span className="text-xs text-muted-foreground">{grouped[col.value].length}</span>
            </div>
            <ul className="divide-y divide-border">
              {grouped[col.value].length === 0 && (
                <li className="px-3 py-6 text-center text-xs text-muted-foreground">
                  {col.value === "open" ? "Press N to add a todo" : "Empty"}
                </li>
              )}
              {grouped[col.value].map((t) => (
                <TodoItem
                  key={t.id}
                  todo={t}
                  onToggle={(next) => toggle(t.id, next)}
                  onDelete={() => {
                    if (confirm("Delete this todo?")) remove(t.id);
                  }}
                  onEdit={(updated) => save(updated)}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function TodoItem({
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
  const priorityColor =
    todo.priority === "high"
      ? "bg-destructive/30 text-red-200"
      : todo.priority === "low"
        ? "bg-muted text-muted-foreground"
        : "bg-brass/20 text-brass";

  return (
    <li className="group flex items-start gap-2 px-3 py-2">
      <Checkbox
        className="mt-1"
        checked={todo.status === "done"}
        onCheckedChange={(c) => onToggle(c ? "done" : "open")}
      />
      <div className="min-w-0 flex-1">
        {editing ? (
          <Input
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
            className="h-7"
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
          <Badge className={`text-[10px] ${priorityColor}`}>{todo.priority}</Badge>
          <Badge variant="outline" className="text-[10px]">
            {todo.scope}
          </Badge>
          {todo.room && (
            <Badge variant="outline" className="border-brass/40 text-[10px] text-brass">
              @{todo.room}
            </Badge>
          )}
          {todo.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px]">
              #{tag}
            </Badge>
          ))}
          {todo.status !== "done" && (
            <select
              className="ml-auto h-6 rounded border border-input bg-background px-1 text-[11px] opacity-0 group-hover:opacity-100"
              value={todo.status}
              onChange={(e) => onToggle(e.target.value as TodoStatus)}
            >
              <option value="open">open</option>
              <option value="in-progress">in progress</option>
              <option value="done">done</option>
            </select>
          )}
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
