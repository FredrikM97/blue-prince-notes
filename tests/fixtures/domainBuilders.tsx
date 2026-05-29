import type { GridCell, Note, SectionDef, StoredImage, Todo } from "@/lib/types";

/**
 * Creates a Note with sensible defaults for tests.
 */
export function buildNote(overrides: Partial<Note> = {}): Note {
  return {
    id: "note-1",
    type: "clue",
    title: "Test note",
    body: "",
    tags: [],
    status: "open",
    scope: "this-run",
    imageIds: [],
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

/**
 * Creates a Todo with sensible defaults for tests.
 */
export function buildTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: "todo-1",
    title: "Test todo",
    tags: [],
    status: "open",
    priority: "med",
    scope: "this-run",
    linkedNoteIds: [],
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

/**
 * Creates a StoredImage with sensible defaults for tests.
 */
export function buildStoredImage(overrides: Partial<StoredImage> = {}): StoredImage {
  return {
    id: "img-1",
    name: "image.png",
    tags: [],
    mime: "image/png",
    blob: new Blob(["img"], { type: "image/png" }),
    createdAt: 1,
    ...overrides,
  };
}

/**
 * Creates a SectionDef with sensible defaults for tests.
 */
export function buildSection(overrides: Partial<SectionDef> = {}): SectionDef {
  return {
    id: "section-1",
    label: "Section",
    order: 0,
    ...overrides,
  };
}

/**
 * Creates a GridCell with sensible defaults for tests.
 */
export function buildGridCell(overrides: Partial<GridCell> = {}): GridCell {
  const row = overrides.row ?? 0;
  const col = overrides.col ?? 0;

  return {
    id: `${row},${col}`,
    row,
    col,
    status: "unknown",
    updatedAt: 1,
    ...overrides,
  };
}
