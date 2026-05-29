import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const ctx = vi.hoisted(() => ({
  state: {
    notes: [] as Array<{ room?: string; tags: string[] }>,
    todos: [] as Array<{ room?: string; tags: string[] }>,
    gridCells: [] as Array<{ roomName?: string }>,
  },
  catalog: [{ name: "Entrance Hall" }, { name: "Parlor" }],
}));

vi.mock("@/data/store", () => ({
  useStore: (selector: (state: typeof ctx.state) => unknown) => selector(ctx.state),
}));

vi.mock("@/data/rooms", () => ({
  getRoomCatalog: () => ctx.catalog,
}));

import {
  useSuggestionSources,
} from "@/hooks/useSuggestionSources";

describe("useSuggestionSources", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ctx.state.notes = [];
    ctx.state.todos = [];
    ctx.state.gridCells = [];
  });

  it("builds room and tag suggestions from notes/todos/grid and catalog", () => {
    ctx.state.notes = [
      { room: "Library", tags: ["puzzle", "story"] },
      { room: "Parlor", tags: ["story"] },
    ];
    ctx.state.todos = [{ room: "Entrance Hall", tags: ["todo-tag"] }];
    ctx.state.gridCells = [{ roomName: "Attic" }, { roomName: "" }];

    const { result } = renderHook(() => useSuggestionSources());

    expect(result.current.roomSuggestions).toEqual(["Attic", "Entrance Hall", "Library", "Parlor"]);
    expect(result.current.tagSuggestions).toEqual(["puzzle", "story", "todo-tag"]);
  });
});
