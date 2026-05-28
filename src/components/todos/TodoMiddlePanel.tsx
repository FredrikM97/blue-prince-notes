import { TODO_STATUS_COLUMNS } from "./constants";
import { TodoItem } from "./TodoItem";
import type { Todo, TodoStatus } from "@/lib/types";

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
  onToggle: (id: string, next: TodoStatus) => void;
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

export function TodoMiddlePanel({
  grouped,
  onToggle,
  onDelete,
  onEdit,
}: {
  grouped: Record<TodoStatus, Todo[]>;
  onToggle: (id: string, next: TodoStatus) => void;
  onDelete: (id: string) => void;
  onEdit: (todo: Todo) => void;
}) {
  return (
    <>
      <div className="todos-columns-grid">
        {TODO_STATUS_COLUMNS.map((col) => (
          <TodoColumn
            key={col.value}
            label={col.label}
            value={col.value}
            todos={grouped[col.value]}
            onToggle={onToggle}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </div>
    </>
  );
}
