import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GridCell, Note, Todo } from "../../src/lib/types";

const mockCtx = vi.hoisted(() => ({
  nanoidMock: vi.fn(),
  parseCaptureMock: vi.fn(),
  scheduleSyncWriteMock: vi.fn(),
  db: {
    isBrowser: vi.fn(() => true),
    clearAllData: vi.fn(async () => {}),
    listNotes: vi.fn(async () => []),
    listTodos: vi.fn(async () => []),
    listImages: vi.fn(async () => []),
    listRoomStates: vi.fn(async () => []),
    listSections: vi.fn(async () => []),
    listGridCells: vi.fn(async () => []),
    putNote: vi.fn(async () => {}),
    putTodo: vi.fn(async () => {}),
    putImage: vi.fn(async () => {}),
    putRoomState: vi.fn(async () => {}),
    putSection: vi.fn(async () => {}),
    putGridCell: vi.fn(async () => {}),
    deleteGridCell: vi.fn(async () => {}),
    deleteNote: vi.fn(async () => {}),
    deleteTodo: vi.fn(async () => {}),
    deleteImage: vi.fn(async () => {}),
    deleteSection: vi.fn(async () => {}),
  },
}));

vi.mock("nanoid", () => ({ nanoid: () => mockCtx.nanoidMock() }));
vi.mock("../../src/data/db", () => mockCtx.db);
vi.mock("../../src/data/parse", () => ({
  parseCapture: (...args: unknown[]) => mockCtx.parseCaptureMock(...args),
}));
vi.mock("../../src/data/sync", () => ({
  disconnectSyncFolder: vi.fn(async () => {}),
  scheduleSyncWrite: () => mockCtx.scheduleSyncWriteMock(),
}));
vi.mock("../../src/data/rooms", () => ({
  cellId: (row: number, col: number) => `${row},${col}`,
  clearCustomRooms: vi.fn(),
}));
vi.mock("../../src/data/imageNames", () => ({
  buildUniqueFileName: vi.fn(() => "image-unique.png"),
}));

import { useStore } from "../../src/data/store";

describe("store flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCtx.nanoidMock.mockReturnValue("id-1");

    useStore.setState({
      loaded: false,
      dataVersion: 0,
      notes: [],
      todos: [],
      images: [],
      rooms: [],
      sections: [],
      gridCells: [],
      search: "",
      syncFolderName: null,
      captureOpen: false,
      captureDefault: "note",
      capturePrefill: "",
      capturePrefillRoom: undefined,
      capturePrefillBody: "",
      capturePrefillTags: "",
      capturePrefillType: undefined,
      capturePrefillPriority: undefined,
      captureEditNoteId: undefined,
      captureEditTodoId: undefined,
      captureReturnTo: undefined,
    });
  });

  it("opens capture from note and closes cleanly", () => {
    const note: Note = {
      id: "n1",
      type: "clue",
      title: "Door code",
      body: "check room",
      room: "Parlor",
      tags: ["tag1"],
      status: "open",
      scope: "this-run",
      imageIds: [],
      createdAt: 1,
      updatedAt: 1,
    };

    useStore.getState().openCapture({ note, returnTo: "/section/map" });

    const state = useStore.getState();
    expect(state.captureOpen).toBe(true);
    expect(state.captureEditNoteId).toBe("n1");
    expect(state.capturePrefill).toBe("Door code");
    expect(state.captureReturnTo).toBe("/section/map");

    state.closeCapture();
    expect(useStore.getState().captureOpen).toBe(false);
    expect(useStore.getState().capturePrefill).toBe("");
  });

  it("creates a note from capture and schedules sync", async () => {
    mockCtx.parseCaptureMock.mockReturnValue({
      isTodo: false,
      title: "Find clue",
      room: "Entrance Hall",
      tags: ["story"],
      type: "clue",
      status: "open",
      scope: "this-run",
      date: "",
      priority: undefined,
    });

    const result = await useStore.getState().createFromCapture("raw note", {
      body: "  body text  ",
      tags: ["manual"],
    });

    expect(result.noteId).toBe("id-1");
    expect(mockCtx.db.putNote).toHaveBeenCalledTimes(1);
    expect(useStore.getState().notes).toHaveLength(1);
    expect(useStore.getState().notes[0].title).toBe("Find clue");
    expect(useStore.getState().notes[0].tags).toEqual(["manual", "story"]);
    expect(mockCtx.scheduleSyncWriteMock).toHaveBeenCalled();
  });

  it("creates a todo from capture and toggles status", async () => {
    mockCtx.parseCaptureMock.mockReturnValue({
      isTodo: true,
      title: "Solve puzzle",
      room: "Parlor",
      tags: ["task"],
      type: "task",
      status: "open",
      scope: "cross-run",
      date: "",
      priority: "high",
    });

    const result = await useStore.getState().createFromCapture("todo raw", { kind: "todo" });
    expect(result.todoId).toBe("id-1");
    expect(mockCtx.db.putTodo).toHaveBeenCalledTimes(1);

    await useStore.getState().toggleTodoStatus("id-1", "done");
    const todo = useStore.getState().todos[0] as Todo;
    expect(todo.status).toBe("done");
    expect(todo.completedAt).toBeTypeOf("number");
  });

  it("saves and removes note/todo records", async () => {
    const existingNote: Note = {
      id: "n1",
      type: "story",
      title: "Old",
      body: "",
      tags: [],
      status: "open",
      scope: "this-run",
      imageIds: [],
      createdAt: 1,
      updatedAt: 1,
    };
    const existingTodo: Todo = {
      id: "t1",
      title: "Todo",
      tags: [],
      status: "open",
      priority: "med",
      scope: "this-run",
      linkedNoteIds: [],
      createdAt: 1,
      updatedAt: 1,
    };

    useStore.setState({ notes: [existingNote], todos: [existingTodo] });

    await useStore.getState().saveNote({ ...existingNote, title: "New" });
    expect(useStore.getState().notes[0].title).toBe("New");

    await useStore.getState().saveTodo({ ...existingTodo, title: "Todo New" });
    expect(useStore.getState().todos[0].title).toBe("Todo New");

    await useStore.getState().removeNote("n1");
    await useStore.getState().removeTodo("t1");
    expect(mockCtx.db.deleteNote).toHaveBeenCalledWith("n1");
    expect(mockCtx.db.deleteTodo).toHaveBeenCalledWith("t1");
    expect(useStore.getState().notes).toHaveLength(0);
    expect(useStore.getState().todos).toHaveLength(0);
  });

  it("adds and removes images", async () => {
    const blob = new Blob(["img"], { type: "image/png" });

    const created = await useStore.getState().addImage(blob, "original.png");
    expect(created.name).toBe("image-unique.png");
    expect(mockCtx.db.putImage).toHaveBeenCalledTimes(1);

    await useStore.getState().removeImage(created.id);
    expect(mockCtx.db.deleteImage).toHaveBeenCalledWith(created.id);
  });

  it("upserts and clears grid cells", async () => {
    await useStore.getState().upsertCell({ row: 1, col: 2, roomName: "Library" });
    expect(mockCtx.db.putGridCell).toHaveBeenCalledTimes(1);
    const cell = useStore.getState().gridCells[0] as GridCell;
    expect(cell.id).toBe("1,2");
    expect(cell.roomName).toBe("Library");

    await useStore.getState().clearCell(1, 2);
    expect(mockCtx.db.deleteGridCell).toHaveBeenCalledWith("1,2");
    expect(useStore.getState().gridCells).toHaveLength(0);
  });
});
