import { useMemo } from "react";
import { useStore } from "@/data/store";
import { getRoomCatalog } from "@/data/rooms";
import type { Note, Todo } from "@/lib/types";

export interface SuggestionSources {
  roomSuggestions: string[];
  tagSuggestions: string[];
  /** Note titles — used to suggest ^ note-reference tokens. */
  noteSuggestions: string[];
}

function buildSuggestionSources({
  notes,
  todos,
  extraRooms = [],
  includeCatalog = false,
}: {
  notes: Note[];
  todos: Todo[];
  extraRooms?: string[];
  includeCatalog?: boolean;
}): SuggestionSources {
  const allRooms = new Set<string>();
  if (includeCatalog) getRoomCatalog().forEach((room) => allRooms.add(room.name));
  extraRooms.forEach((room) => room?.trim() && allRooms.add(room.trim()));
  notes.forEach((note) => note.room?.trim() && allRooms.add(note.room.trim()));
  todos.forEach((todo) => todo.room?.trim() && allRooms.add(todo.room.trim()));

  const allTags = new Set<string>();
  notes.forEach((note) => note.tags.forEach((tag) => allTags.add(tag)));
  todos.forEach((todo) => todo.tags.forEach((tag) => allTags.add(tag)));

  return {
    roomSuggestions: Array.from(allRooms).sort(),
    tagSuggestions: Array.from(allTags).sort(),
    noteSuggestions: [],
  };
}

/**
 * Reads room and tag suggestions from the full app state (notes, todos, map rooms, catalog).
 * Memoized — only recomputes when underlying data changes.
 */
export function useSuggestionSources(): SuggestionSources {
  const notes = useStore((s) => s.notes);
  const todos = useStore((s) => s.todos);
  const gridCells = useStore((s) => s.gridCells);

  return useMemo(
    () => ({
      ...buildSuggestionSources({
        notes,
        todos,
        extraRooms: gridCells.map((cell) => cell.roomName ?? "").filter(Boolean),
        includeCatalog: true,
      }),
      noteSuggestions: notes.map((n) => n.title).sort(),
    }),
    [gridCells, notes, todos],
  );
}
