import { useStore } from "@/data/store";

/**
 * Shared graph-facing store slice so graph components stay store-agnostic.
 */
export function useGraphStoreData() {
  const notes = useStore((s) => s.notes);
  const todos = useStore((s) => s.todos);
  const dataVersion = useStore((s) => s.dataVersion);
  return { notes, todos, dataVersion };
}
