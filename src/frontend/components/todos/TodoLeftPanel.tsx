import type { Todo } from "@/lib/types";
import { TodoScopeFilter } from "./TodoScopeFilter";
import { Chip } from "@/frontend/components/common/Chip";

interface TodoLeftPanelProps {
  total: number;
  openCount: number;
  progressCount: number;
  doneCount: number;
  scopeFilter: string | null;
  setScopeFilter: (value: string | null) => void;
  showRunCard: boolean;
  thisRunOpen: Todo[];
  onToggleDone: (id: string) => void;
}

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

export function TodoLeftPanel({
  total,
  openCount,
  progressCount,
  doneCount,
  scopeFilter,
  setScopeFilter,
  showRunCard,
  thisRunOpen,
  onToggleDone,
}: TodoLeftPanelProps) {
  return (
    <div className="space-y-4">
      <div className="page-layout-panel">
        <h1 className="font-serif text-2xl">Todo</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {total} {total === 1 ? "item" : "items"}
        </p>
        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
          <p>Open: {openCount}</p>
          <p>In progress: {progressCount}</p>
          <p>Done: {doneCount}</p>
        </div>
      </div>
      <div className="page-layout-panel">
        <p className="todos-sidebar-label">Scope</p>
        <TodoScopeFilter value={scopeFilter} onChange={setScopeFilter} />
      </div>
      {showRunCard && (
        <div className="page-layout-panel">
          <p className="todos-sidebar-label">This run</p>
          <TodoRunCard todos={thisRunOpen} onToggleDone={onToggleDone} />
        </div>
      )}
    </div>
  );
}
