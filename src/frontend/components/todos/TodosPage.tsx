import { useMemo, useState } from "react";
import { useStore } from "@/frontend/data/store";
import { Chip } from "@/frontend/components/common/Chip";
import { BrassButton } from "@/frontend/components/common/button";
import { TODO_STATUS_COLUMNS, groupTodosByStatus } from "@/frontend/components/todos/constants";
import { TodoScopeFilter } from "@/frontend/components/todos/TodoScopeFilter";
import { TodoItem } from "@/frontend/components/todos/TodoItem";
import { PageLayout } from "@/frontend/components/common/PageLayout";
import type { Todo } from "@/lib/types";

/** Quick summary card showing open "this-run" todos at a glance. */
function TodoRunCard({
  todos,
  onToggleDone,
}: {
  todos: Todo[];
  onToggleDone: (id: string) => void;
}) {
  return (
    <div className="todos-run-open-card">
      <div className="todos-run-open-title">This run · {todos.length} open</div>
      <ul className="todos-run-open-list">
        {todos.map((t) => (
          <li key={t.id} className="todos-run-open-item">
            <input
              type="checkbox"
              checked={false}
              onChange={() => onToggleDone(t.id)}
              className="todos-run-open-checkbox"
            />
            <span>{t.title}</span>
            {t.room && <Chip className="todos-run-open-chip">@{t.room}</Chip>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A single kanban-style status column. */
function TodoColumn({
  label,
  value,
  todos,
  onToggle,
  onDelete,
  onEdit,
}: {
  label: string;
  value: string;
  todos: Todo[];
  onToggle: (id: string, next: Todo["status"]) => void;
  onDelete: (id: string) => void;
  onEdit: (t: Todo) => void;
}) {
  return (
    <div className="todos-column">
      <div className="todos-column-header">
        <h2 className="todos-column-title">{label}</h2>
        <span className="todos-column-count">{todos.length}</span>
      </div>
      <ul className="todos-column-list">
        {todos.length === 0 && (
          <li className="todos-column-empty">
            {value === "open" ? "Press N to add a todo" : "Empty"}
          </li>
        )}
        {todos.map((t) => (
          <TodoItem
            key={t.id}
            todo={t}
            onToggle={(next) => onToggle(t.id, next)}
            onDelete={() => onDelete(t.id)}
            onEdit={onEdit}
          />
        ))}
      </ul>
    </div>
  );
}

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
  const showRunCard =
    thisRunOpen.length > 0 && scopeFilter !== "cross-run" && scopeFilter !== "someday";

  return (
    <PageLayout
      sidebar={
        <div className="space-y-4">
          <div>
            <p className="todos-sidebar-label">Scope</p>
            <TodoScopeFilter value={scopeFilter} onChange={setScopeFilter} />
          </div>
          {showRunCard && (
            <div>
              <p className="todos-sidebar-label">This run</p>
              <TodoRunCard todos={thisRunOpen} onToggleDone={(id) => toggle(id, "done")} />
            </div>
          )}
        </div>
      }
    >
      <div className="todos-page-header">
        <h1 className="todos-page-title">Todo</h1>
        <BrassButton
          size="sm"
          className="todos-add-button"
          onClick={() => openCapture({ kind: "todo" })}
        >
          Add todo
        </BrassButton>
      </div>

      <div className="todos-columns-grid">
        {TODO_STATUS_COLUMNS.map((col) => (
          <TodoColumn
            key={col.value}
            label={col.label}
            value={col.value}
            todos={grouped[col.value]}
            onToggle={(id, next) => toggle(id, next)}
            onDelete={(id) => {
              if (confirm("Delete this todo?")) remove(id);
            }}
            onEdit={save}
          />
        ))}
      </div>
    </PageLayout>
  );
}
