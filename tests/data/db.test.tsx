import { beforeEach, describe, expect, it, vi } from "vitest";

type UpgradeFn = (
  db: { createObjectStore: (name: string) => { createIndex: (...args: unknown[]) => unknown } },
  oldVersion: number,
) => void;

const ctx = vi.hoisted(() => {
  const db = {
    getAllFromIndex: vi.fn(async () => []),
    getAll: vi.fn(async () => []),
    put: vi.fn(async () => {}),
    get: vi.fn(async () => undefined),
    delete: vi.fn(async () => {}),
    transaction: vi.fn(() => ({
      objectStore: () => ({ clear: vi.fn(async () => {}) }),
      done: Promise.resolve(),
    })),
  };

  const createIndex = vi.fn();
  const createObjectStore = vi.fn(() => ({ createIndex }));

  const openDB = vi.fn(
    async (_name: string, _version: number, options?: { upgrade?: UpgradeFn }) => {
      if (options?.upgrade) {
        options.upgrade({ createObjectStore }, 0);
      }
      return db;
    },
  );

  return { db, openDB, createObjectStore, createIndex };
});

vi.mock("idb", () => ({ openDB: ctx.openDB }));

function sampleNote(id: string) {
  return {
    id,
    type: "clue",
    title: `Note ${id}`,
    body: "",
    tags: [],
    status: "open",
    scope: "this-run",
    imageIds: [],
    createdAt: 1,
    updatedAt: 2,
  };
}

describe("db boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    Object.defineProperty(globalThis, "indexedDB", {
      value: {},
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, "window", {
      value: {},
      configurable: true,
      writable: true,
    });
  });

  it("reports browser availability", async () => {
    const db = await import("../../src/data/db");
    expect(db.isBrowser()).toBe(true);

    // @ts-expect-error test mutation
    delete globalThis.window;
    expect(db.isBrowser()).toBe(false);
  });

  it("lists notes/todos in reverse updated order", async () => {
    ctx.db.getAllFromIndex
      .mockResolvedValueOnce([sampleNote("1"), sampleNote("2")])
      .mockResolvedValueOnce([
        {
          id: "t1",
          title: "todo",
          tags: [],
          status: "open",
          priority: "med",
          scope: "this-run",
          linkedNoteIds: [],
          createdAt: 1,
          updatedAt: 2,
        },
      ]);

    const db = await import("../../src/data/db");
    const notes = await db.listNotes();
    const todos = await db.listTodos();

    expect(notes.map((n) => n.id)).toEqual(["2", "1"]);
    expect(todos[0].id).toBe("t1");
  });

  it("persists and deletes note/todo/image/section/grid/meta records", async () => {
    const db = await import("../../src/data/db");

    await db.putNote(sampleNote("n1") as never);
    await db.putTodo({
      id: "t1",
      title: "todo",
      tags: [],
      status: "open",
      priority: "med",
      scope: "this-run",
      linkedNoteIds: [],
      createdAt: 1,
      updatedAt: 1,
    } as never);
    await db.putImage({
      id: "i1",
      name: "img",
      tags: [],
      mime: "image/png",
      blob: new Blob(["x"], { type: "image/png" }),
      createdAt: 1,
    } as never);
    await db.putSection({ id: "s1", label: "x", order: 0 } as never);
    await db.putGridCell({ id: "0,0", row: 0, col: 0, status: "unknown", updatedAt: 1 } as never);
    await db.setMeta("sync", { a: 1 });

    await db.deleteNote("n1");
    await db.deleteTodo("t1");
    await db.deleteImage("i1");
    await db.deleteSection("s1");
    await db.deleteGridCell("0,0");
    await db.deleteMeta("sync");

    expect(ctx.db.put).toHaveBeenCalled();
    expect(ctx.db.delete).toHaveBeenCalled();
  });

  it("reads image/meta and clears content stores", async () => {
    ctx.db.get.mockResolvedValueOnce({ id: "img" }).mockResolvedValueOnce("meta-value");

    const db = await import("../../src/data/db");
    const img = await db.getImage("img");
    const meta = await db.getMeta("k");

    expect(img).toEqual({ id: "img" });
    expect(meta).toBe("meta-value");

    await db.clearAllData();
    expect(ctx.db.transaction).toHaveBeenCalledWith(
      ["notes", "todos", "images", "rooms", "sections", "grid"],
      "readwrite",
    );
  });

  it("throws when IndexedDB is unavailable", async () => {
    // @ts-expect-error test mutation
    delete globalThis.indexedDB;

    const db = await import("../../src/data/db");
    await expect(db.listNotes()).rejects.toThrow("IndexedDB unavailable");
  });

  it("runs upgrade branches for initial and v2 schema", async () => {
    const created: string[] = [];
    const createObjectStore = vi.fn((name: string) => {
      created.push(name);
      return { createIndex: vi.fn() };
    });

    const openDB = vi.fn(
      async (_name: string, _version: number, options?: { upgrade?: UpgradeFn }) => {
        if (options?.upgrade) {
          options.upgrade({ createObjectStore }, 0);
          options.upgrade({ createObjectStore }, 1);
        }
        return ctx.db;
      },
    );

    vi.doMock("idb", () => ({ openDB }));
    const db = await import("../../src/data/db");

    await db.listSections();

    expect(created).toContain("notes");
    expect(created).toContain("todos");
    expect(created).toContain("images");
    expect(created).toContain("rooms");
    expect(created).toContain("sections");
    expect(created).toContain("meta");
    expect(created).toContain("grid");
  });
});
