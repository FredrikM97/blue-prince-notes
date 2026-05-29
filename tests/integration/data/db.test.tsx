import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildGridCell,
  buildNote,
  buildSection,
  buildStoredImage,
  buildTodo,
} from "../../fixtures/domainBuilders";

type UpgradeFn = (
  db: { createObjectStore: (name: string) => { createIndex: (...args: unknown[]) => unknown } },
  oldVersion: number,
) => void;

const ctx = vi.hoisted(() => {
  const db = {
    getAllFromIndex: vi.fn<(...args: unknown[]) => Promise<unknown[]>>(async () => []),
    getAll: vi.fn<(...args: unknown[]) => Promise<unknown[]>>(async () => []),
    put: vi.fn(async () => {}),
    get: vi.fn<(...args: unknown[]) => Promise<unknown>>(async () => undefined),
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
    const db = await import("@/data/db");
    expect(db.isBrowser()).toBe(true);

    // @ts-expect-error test mutation
    delete globalThis.window;
    expect(db.isBrowser()).toBe(false);
  });

  it("lists notes/todos in reverse updated order", async () => {
    ctx.db.getAllFromIndex
      .mockResolvedValueOnce([
        buildNote({ id: "1", title: "Note 1", updatedAt: 1 }),
        buildNote({ id: "2", title: "Note 2", updatedAt: 2 }),
      ])
      .mockResolvedValueOnce([buildTodo({ id: "t1", title: "todo", updatedAt: 2 })]);

    const db = await import("@/data/db");
    const notes = await db.listNotes();
    const todos = await db.listTodos();

    expect(notes.map((n) => n.id)).toEqual(["2", "1"]);
    expect(todos[0].id).toBe("t1");
  });

  it("persists and deletes note/todo/image/section/grid/meta records", async () => {
    const db = await import("@/data/db");

    await db.putNote(buildNote({ id: "n1", title: "Note n1" }));
    await db.putTodo(buildTodo({ id: "t1", title: "todo" }));
    await db.putImage(buildStoredImage({ id: "i1", name: "img" }));
    await db.putSection(buildSection({ id: "s1", label: "x" }));
    await db.putGridCell(buildGridCell({ row: 0, col: 0 }));
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

    const db = await import("@/data/db");
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

    const db = await import("@/data/db");
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
    const db = await import("@/data/db");

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
