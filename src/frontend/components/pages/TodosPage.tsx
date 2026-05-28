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
    <div className="todos-page">
      <div className="todos-page-header">
        <h1 className="todos-page-title">Todo</h1>
        <div className="todos-page-header-actions">
          <TodoScopeFilter value={scopeFilter} onChange={setScopeFilter} />
          <button
            className={buttonClass({
              size: "sm",
              className: "todos-add-button",
            })}
            onClick={() => openCapture({ kind: "todo" })}
          >
            Add todo
          </button>
        </div>
      </div>

      {thisRunOpen.length > 0 && scopeFilter !== "cross-run" && scopeFilter !== "someday" && (
        <div className="todos-run-open-card">
          <div className="todos-run-open-title">This run · {thisRunOpen.length} open</div>
          <ul className="todos-run-open-list">
            {thisRunOpen.map((t) => (
              <li key={t.id} className="todos-run-open-item">
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => toggle(t.id, "done")}
                  className="todos-run-open-checkbox"
                />
                <span>{t.title}</span>
                {t.room && <Chip className="todos-run-open-chip">@{t.room}</Chip>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="todos-columns-grid">
        {TODO_STATUS_COLUMNS.map((col) => (
          <div key={col.value} className="todos-column">
            <div className="todos-column-header">
              <h2 className="todos-column-title">{col.label}</h2>
              <span className="todos-column-count">{grouped[col.value].length}</span>
            </div>
            <ul className="todos-column-list">
              {grouped[col.value].length === 0 && (
                <li className="todos-column-empty">
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
