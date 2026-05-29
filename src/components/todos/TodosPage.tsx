import { useMemo, useState } from "react";
import { useStore } from "@/data/store";
import { groupTodosByStatus } from "@/components/todos/Constants";
import { PageLayout } from "@/components/common/PageLayout";
import { TodoLeftPanel } from "./TodoLeftPanel";
import { TodoMiddlePanel } from "./TodoMiddlePanel";

export function TodosPage() {
  const todos = useStore((s) => s.todos);
  const search = useStore((s) => s.search);
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
  const openCount = filtered.filter((t) => t.status === "open").length;
  const progressCount = filtered.filter((t) => t.status === "in-progress").length;
  const doneCount = filtered.filter((t) => t.status === "done").length;
  const showRunCard =
    thisRunOpen.length > 0 && scopeFilter !== "cross-run" && scopeFilter !== "someday";

  return (
    <PageLayout
      leftSidebar={
        <TodoLeftPanel
          total={filtered.length}
          openCount={openCount}
          progressCount={progressCount}
          doneCount={doneCount}
          scopeFilter={scopeFilter}
          setScopeFilter={setScopeFilter}
          showRunCard={showRunCard}
          thisRunOpen={thisRunOpen}
          onToggleDone={(id) => toggle(id, "done")}
        />
      }
      middle={
        <TodoMiddlePanel
          grouped={grouped}
          onToggle={(id, next) => toggle(id, next)}
          onDelete={(id) => {
            if (confirm("Delete this todo?")) remove(id);
          }}
          onEdit={save}
        />
      }
    >
      {/* middle content is provided via the `middle` prop */}
    </PageLayout>
  );
}
