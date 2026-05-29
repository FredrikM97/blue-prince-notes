import { beforeEach, describe, expect, it, vi } from "vitest";

const db = {
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
  deleteNote: vi.fn(async () => {}),
  deleteTodo: vi.fn(async () => {}),
  deleteImage: vi.fn(async () => {}),
};

const rooms = {
  listCustomRooms: vi.fn(() => []),
  replaceCustomRooms: vi.fn(),
};

let lastZipInstance: FakeZip | null = null;
let loadedZipInstance: FakeZip | null = null;

class FakeZip {
  static latest: FakeZip | null = null;

  private store = new Map<string, unknown>();

  constructor() {
    FakeZip.latest = this;
  }

  file(path: string, value?: unknown) {
    if (value === undefined) {
      if (!this.store.has(path)) return null;
      return {
        async: async (type: string) => {
          const v = this.store.get(path);
          if (type === "text") return String(v ?? "");
          if (type === "blob") return v instanceof Blob ? v : new Blob([String(v ?? "")]);
          return v;
        },
      };
    }
    this.store.set(path, value);
    return this;
  }

  async generateAsync() {
    return new Blob(["zip-blob"], { type: "application/zip" });
  }

  static async loadAsync() {
    if (!loadedZipInstance) throw new Error("no loaded zip");
    return loadedZipInstance;
  }
}

vi.mock("../../src/data/db", () => db);
vi.mock("../../src/data/rooms", () => rooms);
vi.mock("jszip", () => ({ default: FakeZip }));

describe("io boundaries", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    lastZipInstance = null;
    loadedZipInstance = null;
    FakeZip.latest = null;

    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  });

  it("exports data into zip and triggers download", async () => {
    db.listNotes.mockResolvedValueOnce([{ id: "n1" }]);
    db.listTodos.mockResolvedValueOnce([{ id: "t1" }]);
    db.listImages.mockResolvedValueOnce([
      {
        id: "img-1",
        name: "image.png",
        caption: "c",
        tags: [],
        mime: "image/png",
        blob: new Blob(["img"], { type: "image/png" }),
        createdAt: 1,
      },
    ]);

    const click = vi.fn();
    vi.spyOn(document, "createElement").mockReturnValue({
      click,
      href: "",
      download: "",
    } as unknown as HTMLAnchorElement);

    const io = await import("../../src/data/io");
    await io.exportAll();

    lastZipInstance = FakeZip.latest;
    expect(lastZipInstance).not.toBeNull();
    expect(click).toHaveBeenCalled();
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it("imports legacy json data", async () => {
    const io = await import("../../src/data/io");
    const legacyJson = JSON.stringify({
      app: "blue-prince-notes",
      version: 2,
      exportedAt: Date.now(),
      notes: [{ id: "n1" }],
      todos: [{ id: "t1" }],
      images: [],
      rooms: [],
      sections: [],
      gridCells: [],
    });
    const file = {
      name: "backup.json",
      type: "application/json",
      text: async () => legacyJson,
    } as File;

    await io.importAll(file, "merge");

    expect(db.putNote).toHaveBeenCalled();
    expect(db.putTodo).toHaveBeenCalled();
  });

  it("imports zip manifest and image blobs", async () => {
    const manifest = {
      app: "blue-prince-notes",
      version: 4,
      exportedAt: Date.now(),
      notes: [{ id: "n1" }],
      todos: [{ id: "t1" }],
      images: [
        {
          id: "img-1",
          name: "image.png",
          caption: "c",
          tags: [],
          mime: "image/png",
          createdAt: 1,
          file: "images/img-1",
        },
      ],
      rooms: [],
      sections: [],
      gridCells: [],
      customRooms: [{ name: "Parlor", category: "Wing" }],
    };

    loadedZipInstance = new FakeZip();
    loadedZipInstance.file("manifest.json", JSON.stringify(manifest));
    loadedZipInstance.file("images/img-1", new Blob(["img"], { type: "image/png" }));

    const io = await import("../../src/data/io");
    const zipFile = {
      name: "backup.zip",
      type: "application/zip",
      arrayBuffer: async () => new ArrayBuffer(0),
    } as File;
    await io.importAll(zipFile, "replace");

    expect(db.putNote).toHaveBeenCalled();
    expect(db.putTodo).toHaveBeenCalled();
    expect(db.putImage).toHaveBeenCalled();
    expect(rooms.replaceCustomRooms).toHaveBeenCalled();
  });
});
