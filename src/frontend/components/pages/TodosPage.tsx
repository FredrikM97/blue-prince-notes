import { useMemo, useState } from "react";
import { useStore } from "@/frontend/data/store";
import { Chip } from "@/frontend/components/common/Chip";
import { buttonClass } from "@/frontend/components/common/buttonClasses";
import { TODO_STATUS_COLUMNS, groupTodosByStatus } from "@/frontend/components/todos/constants";
import { TodoScopeFilter } from "@/frontend/components/todos/TodoScopeFilter";
import { TodoItem } from "@/frontend/components/todos/TodoItem";

export function TodosPage() {
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
      if (q && !`${t.title} ${t.tags.join(" ")} ${t.room ?? ""}`.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [todos, search, scopeFilter]);

  const grouped = groupTodosByStatus(filtered);
  const thisRunOpen = filtered.filter((t) => t.scope === "this-run" && t.status !== "done");

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-serif text-2xl">Todo</h1>
        <div className="flex items-center gap-2">
          <TodoScopeFilter value={scopeFilter} onChange={setScopeFilter} />
          <button
            className={buttonClass({
              size: "sm",
              className: "bg-brass text-brass-foreground hover:bg-brass/90",
            })}
            onClick={() => openCapture({ kind: "todo" })}
          >
            Add todo
          </button>
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
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => toggle(t.id, "done")}
                  className="h-4 w-4 cursor-pointer rounded border-input"
                />
                <span>{t.title}</span>
                {t.room && <Chip className="border-brass/40 text-brass">@{t.room}</Chip>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {TODO_STATUS_COLUMNS.map((col) => (
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
