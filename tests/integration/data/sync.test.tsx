import { beforeEach, describe, expect, it, vi } from "vitest";

const db = {
  getMeta: vi.fn(),
  setMeta: vi.fn(async () => {}),
  deleteMeta: vi.fn(async () => {}),
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
};

const rooms = {
  listCustomRooms: vi.fn(() => [{ name: "Parlor", category: "Wing" }]),
  replaceCustomRooms: vi.fn(),
};

vi.mock("@/data/db", () => db);
vi.mock("@/data/rooms", () => rooms);
vi.mock("@/data/imageNames", () => ({
  buildUniqueFileName: vi.fn((_: string[], name: string) => `${name}-file`),
}));

interface MockFileHandle {
  getFile: () => Promise<File>;
  createWritable: () => Promise<{
    write: (data: unknown) => Promise<void>;
    close: () => Promise<void>;
  }>;
}

interface MockDirHandle {
  name: string;
  queryPermission: () => Promise<PermissionState>;
  requestPermission: () => Promise<PermissionState>;
  getDirectoryHandle: (name: string, options?: { create?: boolean }) => Promise<MockDirHandle>;
  getFileHandle: (name: string, options?: { create?: boolean }) => Promise<MockFileHandle>;
}

function createMemoryDirHandle(name: string) {
  const files = new Map<string, string | Blob>();

  const handle: MockDirHandle = {
    name,
    queryPermission: async () => "granted",
    requestPermission: async () => "granted",
    async getDirectoryHandle() {
      return handle;
    },
    async getFileHandle(fileName: string, options?: { create?: boolean }) {
      if (!files.has(fileName) && !options?.create) {
        throw new Error("missing file");
      }
      return {
        getFile: async () => {
          const value = files.get(fileName);
          if (typeof value === "string") {
            return new File([value], fileName, { type: "application/json" });
          }
          return new File([value ?? ""], fileName, { type: "application/octet-stream" });
        },
        createWritable: async () => ({
          write: async (data: unknown) => {
            if (data instanceof Blob) {
              files.set(fileName, data);
              return;
            }
            files.set(fileName, String(data));
          },
          close: async () => {},
        }),
      };
    },
  };

  return { handle, files };
}

describe("sync boundaries", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  it("loads and persists sync mode", async () => {
    db.getMeta.mockResolvedValueOnce("manual");
    const sync = await import("@/data/sync");

    const mode = await sync.loadSyncMode();
    expect(mode).toBe("manual");

    await sync.setSyncMode("auto");
    expect(db.setMeta).toHaveBeenCalledWith("sync-mode", "auto");
  });

  it("returns null when picking folder is aborted", async () => {
    const sync = await import("@/data/sync");
    vi.stubGlobal("window", {
      showDirectoryPicker: vi.fn(async () => {
        throw new DOMException("cancel", "AbortError");
      }),
    });

    const handle = await sync.pickSyncFolder();
    expect(handle).toBeNull();
  });

  it("restores handle only with granted permission", async () => {
    const sync = await import("@/data/sync");
    const deniedHandle = {
      queryPermission: vi.fn(async () => "denied"),
      requestPermission: vi.fn(async () => "denied"),
      name: "Denied",
    };
    db.getMeta.mockResolvedValueOnce(deniedHandle);

    expect(await sync.restoreSyncHandle()).toBeNull();
  });

  it("writes manifest when scheduled in auto mode", async () => {
    const sync = await import("@/data/sync");
    const { handle, files } = createMemoryDirHandle("SyncFolder");
    vi.stubGlobal("window", { showDirectoryPicker: vi.fn(async () => handle) });

    await sync.pickSyncFolder();
    await sync.setSyncMode("auto");

    sync.scheduleSyncWrite();
    await vi.advanceTimersByTimeAsync(1500);

    expect(files.has("manifest.json")).toBe(true);
    expect(sync.getSyncStatus().dirty).toBe(false);
  });

  it("does not auto-write in manual mode, but saveSyncNow works", async () => {
    const sync = await import("@/data/sync");
    const { handle, files } = createMemoryDirHandle("SyncFolder");
    vi.stubGlobal("window", { showDirectoryPicker: vi.fn(async () => handle) });

    await sync.pickSyncFolder();
    await sync.setSyncMode("manual");

    sync.scheduleSyncWrite();
    vi.advanceTimersByTime(2000);
    await Promise.resolve();

    expect(files.has("manifest.json")).toBe(false);

    const saved = await sync.saveSyncNow();
    expect(saved).toBe(true);
    expect(files.has("manifest.json")).toBe(true);
  });

  it("imports sync manifest boundary into db layer", async () => {
    const sync = await import("@/data/sync");
    await sync.importSyncManifest({
      manifest: {
        app: "blue-prince-notes",
        syncVersion: 1,
        syncedAt: Date.now(),
        notes: [{ id: "n1" } as never],
        todos: [{ id: "t1" } as never],
        images: [],
        rooms: [{ name: "Parlor", status: "unknown", updatedAt: 1 } as never],
        sections: [{ id: "s1", label: "Notes", order: 0 } as never],
        gridCells: [{ id: "0,0", row: 0, col: 0, status: "unknown", updatedAt: 1 } as never],
        customRooms: [{ name: "Parlor", category: "Wing" as never }],
      },
      images: [],
    });

    expect(db.putNote).toHaveBeenCalled();
    expect(db.putTodo).toHaveBeenCalled();
    expect(db.putRoomState).toHaveBeenCalled();
    expect(db.putSection).toHaveBeenCalled();
    expect(db.putGridCell).toHaveBeenCalled();
    expect(rooms.replaceCustomRooms).toHaveBeenCalled();
  });
});
