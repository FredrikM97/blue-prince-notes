import { createContext, useContext, useMemo } from "react";
import { useStore } from "@/data/store";
import { getRoomCatalog } from "@/data/rooms";
import type { Note, Todo } from "@/lib/types";

interface SuggestionOptions {
  notes: Note[];
  todos: Todo[];
  extraRooms?: string[];
  includeCatalog?: boolean;
}

export interface SuggestionSources {
  roomSuggestions: string[];
  tagSuggestions: string[];
}

const EMPTY_SUGGESTION_SOURCES: SuggestionSources = {
  roomSuggestions: [],
  tagSuggestions: [],
};

export const SuggestionSourcesContext = createContext<SuggestionSources | null>(null);

/**
 * Collect normalized room and tag suggestions from note/todo data.
 */
function buildSuggestionSources({
  notes,
  todos,
  extraRooms = [],
  includeCatalog = false,
}: SuggestionOptions): SuggestionSources {
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
  };
}

/**
 * Global suggestion sources from the full app state (notes, todos, map, catalog).
 */
export function useSuggestionSources() {
  const notes = useStore((s) => s.notes);
  const todos = useStore((s) => s.todos);
  const gridCells = useStore((s) => s.gridCells);

  return useMemo(
    () =>
      buildSuggestionSources({
        notes,
        todos,
        extraRooms: gridCells.map((cell) => cell.roomName ?? "").filter(Boolean),
        includeCatalog: true,
      }),
    [gridCells, notes, todos],
  );
}

/**
 * Reads suggestion sources from context, falling back to direct hook usage when needed.
 */
export function useSuggestionSourcesContext() {
  return useContext(SuggestionSourcesContext) ?? EMPTY_SUGGESTION_SOURCES;
}

/**
 * Scoped suggestion sources for local panels (for example a single map room context).
 */
export function useScopedSuggestionSources({
  notes,
  todos,
  extraRooms = [],
}: {
  notes: Note[];
  todos: Todo[];
  extraRooms?: string[];
}) {
  return useMemo(
    () => buildSuggestionSources({ notes, todos, extraRooms }),
    [extraRooms, notes, todos],
  );
}
