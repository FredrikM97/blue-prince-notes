import type { Todo, TodoStatus } from "@/lib/types";

export const TODO_STATUS_COLUMNS: { value: TodoStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in-progress", label: "In progress" },
  { value: "done", label: "Done" },
];

export const TODO_SCOPE_OPTIONS: { value: string | null; label: string }[] = [
  { value: null, label: "All" },
  { value: "this-run", label: "This run" },
  { value: "cross-run", label: "Cross-run" },
  { value: "someday", label: "Someday" },
];

export function groupTodosByStatus(todos: Todo[]): Record<TodoStatus, Todo[]> {
  const grouped: Record<TodoStatus, Todo[]> = {
    open: [],
    "in-progress": [],
    done: [],
  };
  todos.forEach((t) => grouped[t.status].push(t));
  return grouped;
}

export function todoPriorityClass(priority: Todo["priority"]): string {
  if (priority === "high") return "bg-destructive/30 text-red-200";
  if (priority === "low") return "bg-muted text-muted-foreground";
  return "bg-brass/20 text-brass";
}
